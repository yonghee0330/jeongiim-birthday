import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app } from "./firebase.js";
import { getTheme } from "./lifeThemes.js";

let modelPromise = null;

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        return getGenerativeModel(ai, { model: "gemini-2.0-flash" });
      } catch (e) {
        console.warn("Firebase AI 초기화 실패, 로컬 모드로 전환:", e);
        return null;
      }
    })();
  }
  return modelPromise;
}

async function askGemini(prompt) {
  const model = await getModel();
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    return result?.response?.text?.()?.trim() || null;
  } catch (e) {
    console.warn("Gemini 호출 실패:", e);
    return null;
  }
}

function looksLikeStop(answer) {
  return /그만|여기까지|이제\s*끝|더\s*안|싫|힘들어|나중에/.test(answer);
}

function looksLikeDontKnow(answer) {
  return /모르겠|기억\s*안|생각이\s*안|잘\s*모르|기억이\s*안/.test(answer);
}

function localFollowUp({ themeId, qaPairs, lastAnswer }) {
  const theme = getTheme(themeId);
  if (looksLikeStop(lastAnswer)) {
    return { action: "wrap", question: null };
  }
  if (qaPairs.length >= 5) {
    return { action: "wrap", question: null };
  }
  if (looksLikeDontKnow(lastAnswer)) {
    const next = theme.questions[qaPairs.length] || theme.questions[0];
    return {
      action: "ask",
      question: `괜찮아요. 다른 이야기를 해볼까요?\n${next}`,
    };
  }
  const short = lastAnswer.trim().length < 25;
  if (short && qaPairs.length < 4) {
    return {
      action: "ask",
      question: "조금 더 들려주실 수 있을까요? 그때 어떤 기분이셨나요?",
    };
  }
  const idx = Math.min(qaPairs.length, theme.questions.length - 1);
  const q = theme.questions[idx];
  if (qaPairs.length >= 3) {
    return { action: "wrap", question: null };
  }
  return {
    action: "ask",
    question: q.includes("?") ? q : `${q}`,
  };
}

function localPolish({ themeLabel, qaPairs }) {
  const lines = qaPairs
    .map((p) => p.answer?.trim())
    .filter(Boolean)
    .filter((a) => !looksLikeDontKnow(a) && !looksLikeStop(a));

  if (lines.length === 0) {
    return {
      title: `${themeLabel} 이야기`,
      body: "아직 남긴 이야기가 많지 않아요. 나중에 이어서 적어 보셔도 좋아요.",
    };
  }

  const titleSeed = lines[0].slice(0, 18).replace(/[.!?,。]+$/, "");
  const title = titleSeed.length > 4 ? titleSeed : `${themeLabel}의 추억`;

  const body = [
    `나는 ${themeLabel}에 대해 이렇게 기억한다.`,
    "",
    ...lines.map((l) => (/[.!?다요음]$/.test(l) ? l : `${l}.`)),
    "",
    "지금도 그 시절을 떠올리면 마음이 따뜻해진다.",
  ].join("\n");

  return { title, body };
}

/**
 * 다음 질문 또는 정리 단계로 넘어갈지 결정
 * @returns {{ action: 'ask'|'wrap', question: string|null, usedAI: boolean }}
 */
export async function nextInterviewStep({ themeId, themeLabel, qaPairs, lastAnswer }) {
  const prompt = `당신은 70대 어머니와 따뜻하게 대화하는 인생 인터뷰어입니다.
주제: ${themeLabel}
지금까지의 대화:
${qaPairs.map((p, i) => `Q${i + 1}: ${p.question}\nA${i + 1}: ${p.answer}`).join("\n")}
방금 답변: ${lastAnswer}

규칙:
- 한국어 존댓말, 질문 1개만, 1~2문장
- 사실·감정만 이어가기. 없는 내용 짐작 금지
- 슬픈 기억 강요 금지
- 답변이 '모르겠어요/기억 안 나요'면 부담 없이 다른 쉬운 질문
- '그만/여기까지'면 JSON만: {"action":"wrap","question":null}
- 질문이 3~5개면 정리 단계로 wrap
- 그 외 JSON만: {"action":"ask","question":"..."}

JSON만 출력하세요.`;

  const raw = await askGemini(prompt);
  if (raw) {
    try {
      const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(jsonText);
      if (parsed.action === "wrap" || parsed.action === "ask") {
        return {
          action: parsed.action,
          question: parsed.question || null,
          usedAI: true,
        };
      }
    } catch (_) {
      /* fall through */
    }
  }
  return { ...localFollowUp({ themeId, qaPairs, lastAnswer }), usedAI: false };
}

/**
 * 대화 내용을 1인칭 인생 이야기로 다듬기
 */
export async function polishStory({ themeLabel, qaPairs }) {
  const prompt = `어머니의 구술 인터뷰를 자연스러운 1인칭 회고문으로 다듬어 주세요.

주제: ${themeLabel}
대화:
${qaPairs.map((p, i) => `질문: ${p.question}\n답변: ${p.answer}`).join("\n\n")}

규칙:
- 말씀하신 사실·의미만 사용. 없는 사건·인물·날짜·감정 창작 금지
- 맞춤법·띄어쓰기 정리, 추임새 정리
- 과도하게 문학적이거나 어려운 표현 금지
- 짧으면 억지로 늘리지 말 것
- JSON만: {"title":"제목","body":"본문(줄바꿈 포함)"}`;

  const raw = await askGemini(prompt);
  if (raw) {
    try {
      const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(jsonText);
      if (parsed.title && parsed.body) {
        return { title: parsed.title, body: parsed.body, usedAI: true };
      }
    } catch (_) {
      /* fall through */
    }
  }
  return { ...localPolish({ themeLabel, qaPairs }), usedAI: false };
}

export async function checkAiAvailable() {
  const text = await askGemini('JSON만 출력: {"ok":true}');
  return Boolean(text);
}
