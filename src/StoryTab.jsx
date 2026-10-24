import { useEffect, useState } from "react";
import { LIFE_THEMES, getTheme } from "./lifeThemes.js";
import { nextInterviewStep, polishStory } from "./ai.js";
import VoiceInput from "./VoiceInput.jsx";
import FamilyGate from "./FamilyGate.jsx";
import {
  subscribeStories,
  subscribeDrafts,
  subscribeAlbum,
  saveStory,
  deleteStory,
  saveDraft,
  deleteDraft,
  isFamilyUnlocked,
} from "./firebase.js";

const primaryBtn = (enabled = true) => ({
  width: "100%",
  border: "none",
  borderRadius: "20px",
  padding: "20px",
  fontSize: "20px",
  fontWeight: "800",
  background: enabled ? "linear-gradient(135deg,#FF6B6B,#FF8E53)" : "#E8D5CE",
  color: enabled ? "white" : "#aaa",
  boxShadow: enabled ? "0 8px 24px rgba(255,107,107,.35)" : "none",
});

const secondaryBtn = {
  width: "100%",
  border: "2.5px solid #E8D5CE",
  background: "white",
  borderRadius: "18px",
  padding: "16px",
  fontSize: "18px",
  fontWeight: "700",
  color: "#666",
};

const greenBtn = {
  width: "100%",
  border: "none",
  borderRadius: "20px",
  padding: "20px",
  fontSize: "20px",
  fontWeight: "800",
  background: "linear-gradient(135deg,#06D6A0,#2EC4B6)",
  color: "white",
  boxShadow: "0 8px 24px rgba(6,214,160,.3)",
};

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("ko-KR");
}

export default function StoryTab() {
  const [screen, setScreen] = useState("home"); // home | themes | interview | preview | list | detail | edit
  const [stories, setStories] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [album, setAlbum] = useState([]);
  const [themeId, setThemeId] = useState(null);
  const [question, setQuestion] = useState("");
  const [qaPairs, setQaPairs] = useState([]);
  const [answerMode, setAnswerMode] = useState(null); // voice | text | null
  const [textAnswer, setTextAnswer] = useState("");
  const [draftId, setDraftId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [preview, setPreview] = useState({ title: "", body: "" });
  const [usedAI, setUsedAI] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pickPhotos, setPickPhotos] = useState(false);
  const [photoIds, setPhotoIds] = useState([]);

  useEffect(() => {
    const u1 = subscribeStories(setStories);
    const u2 = subscribeDrafts(setDrafts);
    const u3 = subscribeAlbum(setAlbum);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const requireFamily = (action) => {
    if (isFamilyUnlocked()) {
      action();
      return;
    }
    setPendingAction(() => action);
    setGateOpen(true);
  };

  const theme = themeId ? getTheme(themeId) : null;

  const persistDraft = async (nextQa, nextQ, tid = themeId) => {
    const id = await saveDraft(draftId, {
      themeId: tid,
      themeLabel: getTheme(tid).label,
      qaPairs: nextQa,
      currentQuestion: nextQ,
      status: "in_progress",
    });
    setDraftId(id);
  };

  const startTheme = (id) =>
    requireFamily(async () => {
      const t = getTheme(id);
      const q = t.questions[0];
      setThemeId(id);
      setQaPairs([]);
      setQuestion(q);
      setAnswerMode(null);
      setTextAnswer("");
      setPhotoIds([]);
      setStatusMsg("편하게 말씀해 주세요.");
      setScreen("interview");
      const did = await saveDraft(null, {
        themeId: id,
        themeLabel: t.label,
        qaPairs: [],
        currentQuestion: q,
        status: "in_progress",
      });
      setDraftId(did);
    });

  const resumeDraft = (d) =>
    requireFamily(() => {
      setDraftId(d.id);
      setThemeId(d.themeId);
      setQaPairs(d.qaPairs || []);
      setQuestion(d.currentQuestion || getTheme(d.themeId).questions[0]);
      setAnswerMode(null);
      setTextAnswer("");
      setStatusMsg("이어서 이야기해 보아요.");
      setScreen("interview");
    });

  const submitAnswer = async (answer) => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setAnswerMode(null);
    setStatusMsg("잘 듣고 있어요…");
    const nextQa = [...qaPairs, { question, answer: answer.trim() }];
    setQaPairs(nextQa);

    try {
      const step = await nextInterviewStep({
        themeId,
        themeLabel: theme.label,
        qaPairs: nextQa,
        lastAnswer: answer.trim(),
      });
      setUsedAI(step.usedAI);

      if (step.action === "wrap" || nextQa.length >= 5) {
        setStatusMsg("이야기를 글로 정리하고 있어요…");
        const polished = await polishStory({ themeLabel: theme.label, qaPairs: nextQa });
        setPreview({ title: polished.title, body: polished.body });
        setUsedAI(polished.usedAI);
        setStatusMsg("이야기를 글로 정리했어요. 확인해 주세요.");
        await persistDraft(nextQa, question);
        setScreen("preview");
      } else {
        setQuestion(step.question);
        setTextAnswer("");
        setStatusMsg("편하게 말씀해 주세요.");
        await persistDraft(nextQa, step.question);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg("잠시 문제가 생겼어요. 같은 답을 다시 보내 주시거나, 글로 적어 주세요.");
      setQaPairs(qaPairs);
    }
    setBusy(false);
  };

  const wrapNow = async () => {
    if (qaPairs.length === 0) {
      setStatusMsg("아직 이야기가 없어요. 하나라도 말씀해 주세요.");
      return;
    }
    setBusy(true);
    setStatusMsg("이야기를 글로 정리하고 있어요…");
    try {
      const polished = await polishStory({ themeLabel: theme.label, qaPairs });
      setPreview({ title: polished.title, body: polished.body });
      setUsedAI(polished.usedAI);
      setScreen("preview");
      setStatusMsg("이야기를 글로 정리했어요.");
    } catch (e) {
      setStatusMsg("정리에 실패했어요. 다시 눌러 주세요.");
    }
    setBusy(false);
  };

  const saveFinal = () =>
    requireFamily(async () => {
      setBusy(true);
      try {
        await saveStory({
          themeId,
          themeLabel: theme.label,
          title: preview.title,
          body: preview.body,
          rawQa: qaPairs,
          photoIds,
        });
        if (draftId) await deleteDraft(draftId);
        setStatusMsg("참 소중한 이야기가 저장되었어요.");
        setScreen("list");
        setDraftId(null);
        setQaPairs([]);
      } catch (e) {
        alert("저장에 실패했어요. 네트워크를 확인해 주세요.");
      }
      setBusy(false);
    });

  const openDetail = (s) => {
    setSelected(s);
    setConfirmDelete(false);
    setPickPhotos(false);
    setPhotoIds(s.photoIds || []);
    setScreen("detail");
  };

  const saveDetailEdits = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await saveStory({
        id: selected.id,
        themeId: selected.themeId,
        themeLabel: selected.themeLabel,
        title: selected.title,
        body: selected.body,
        rawQa: selected.rawQa || [],
        photoIds,
      });
      setSelected({ ...selected, photoIds });
      setPickPhotos(false);
      setStatusMsg("수정해서 저장했어요.");
    } catch (e) {
      alert("저장 실패");
    }
    setBusy(false);
  };

  const doDeleteStory = async () => {
    setBusy(true);
    try {
      await deleteStory(selected.id);
      setScreen("list");
      setSelected(null);
    } catch (e) {
      alert("삭제 실패");
    }
    setBusy(false);
  };

  const linkedPhotos = album.filter((p) => (selected?.photoIds || photoIds).includes(p.id));

  return (
    <div style={{ padding: "28px 20px" }}>
      <FamilyGate
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setPendingAction(null);
        }}
        onUnlocked={() => pendingAction?.()}
      />

      {/* ── 첫 화면 ── */}
      {screen === "home" && (
        <>
          <div
            style={{
              fontFamily: "'Nanum Myeongjo',serif",
              fontSize: "26px",
              fontWeight: "800",
              textAlign: "center",
              color: "#2C2C2C",
              marginBottom: "16px",
            }}
          >
            📖 나의 인생 기록장
          </div>
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px 22px",
              border: "2px solid #FFE4D6",
              boxShadow: "0 3px 16px rgba(0,0,0,.06)",
              fontSize: "18px",
              color: "#6B4E4E",
              lineHeight: 1.9,
              marginBottom: "22px",
              wordBreak: "keep-all",
            }}
          >
            정임님의 소중한 인생 이야기를 남겨보세요.
            <br />
            <br />
            어린 시절의 추억부터 가족과 함께한 행복한 순간까지, 기억나는 이야기를 하나씩 들려주세요.
            <br />
            <br />
            글로 적으셔도 좋고, 편하게 말씀하셔도 됩니다.
            <br />
            제가 예쁜 글로 정리해 드릴게요.
          </div>

          <button onClick={() => setScreen("themes")} style={{ ...primaryBtn(true), marginBottom: "12px" }}>
            이야기 시작하기
          </button>
          <button onClick={() => setScreen("list")} style={secondaryBtn}>
            내가 남긴 이야기 보기
          </button>

          {drafts.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <div style={{ fontSize: "17px", fontWeight: "800", marginBottom: "12px" }}>이어서 쓰기</div>
              {drafts.slice(0, 3).map((d) => (
                <button
                  key={d.id}
                  onClick={() => resumeDraft(d)}
                  style={{
                    ...secondaryBtn,
                    textAlign: "left",
                    marginBottom: "10px",
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ color: "#D94F4F", fontWeight: "800", fontSize: "15px" }}>{d.themeLabel}</div>
                  <div style={{ color: "#666", marginTop: "4px", fontSize: "16px" }}>
                    나중에 이어서 하셔도 괜찮아요 · {(d.qaPairs || []).length}개 답변
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 시기 선택 ── */}
      {screen === "themes" && (
        <>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", textAlign: "center", marginBottom: "8px" }}>
            어느 시절 이야기일까요?
          </div>
          <div style={{ textAlign: "center", fontSize: "17px", color: "#888", marginBottom: "20px", lineHeight: 1.6 }}>
            하나를 골라 주세요. 질문은 하나씩만 나와요.
          </div>
          {LIFE_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => startTheme(t.id)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "2.5px solid #E8D5CE",
                background: "white",
                borderRadius: "18px",
                padding: "20px 22px",
                marginBottom: "12px",
                fontSize: "19px",
                fontWeight: "800",
                color: "#2C2C2C",
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
          <button onClick={() => setScreen("home")} style={{ ...secondaryBtn, marginTop: "8px" }}>
            뒤로 가기
          </button>
        </>
      )}

      {/* ── 인터뷰 ── */}
      {screen === "interview" && theme && (
        <>
          <div style={{ fontSize: "15px", fontWeight: "800", color: "#D94F4F", marginBottom: "8px" }}>
            {theme.emoji} {theme.label} · {qaPairs.length + 1}번째 이야기
          </div>
          <div
            style={{
              background: "#FFF0EC",
              borderRadius: "24px",
              padding: "28px 22px",
              marginBottom: "18px",
              border: "2px solid #FFD6CC",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#D94F4F", marginBottom: "10px" }}>질문</div>
            <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", color: "#2C2C2C", lineHeight: 1.55, wordBreak: "keep-all" }}>
              {question}
            </div>
          </div>

          <div style={{ fontSize: "17px", color: "#888", marginBottom: "16px", lineHeight: 1.6 }}>{statusMsg}</div>

          {busy && (
            <div style={{ textAlign: "center", padding: "24px", fontSize: "18px", color: "#D94F4F", fontWeight: "700" }}>
              잠시만 기다려 주세요…
            </div>
          )}

          {!busy && !answerMode && (
            <>
              <button onClick={() => setAnswerMode("voice")} style={{ ...primaryBtn(true), marginBottom: "12px" }}>
                🎤 말로 이야기하기
              </button>
              <button onClick={() => setAnswerMode("text")} style={{ ...secondaryBtn, marginBottom: "12px" }}>
                ✏️ 글로 적기
              </button>
              {qaPairs.length > 0 && (
                <button onClick={wrapNow} style={{ ...greenBtn, marginBottom: "12px" }}>
                  여기까지 · 글로 정리하기
                </button>
              )}
              <button
                onClick={() => {
                  setScreen("home");
                  setStatusMsg("나중에 이어서 하셔도 괜찮아요.");
                }}
                style={secondaryBtn}
              >
                나중에 이어서 하기
              </button>
            </>
          )}

          {!busy && answerMode === "voice" && (
            <VoiceInput
              onConfirm={(t) => submitAnswer(t)}
              onCancel={() => setAnswerMode(null)}
            />
          )}

          {!busy && answerMode === "text" && (
            <>
              <textarea
                rows={5}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="편안하게 적어 주세요"
                style={{ marginBottom: "12px" }}
              />
              <button
                onClick={() => submitAnswer(textAnswer)}
                disabled={!textAnswer.trim()}
                style={{ ...primaryBtn(!!textAnswer.trim()), marginBottom: "10px" }}
              >
                이대로 답변하기
              </button>
              <button onClick={() => setAnswerMode(null)} style={secondaryBtn}>
                취소
              </button>
            </>
          )}
        </>
      )}

      {/* ── 미리보기 ── */}
      {screen === "preview" && (
        <>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", textAlign: "center", marginBottom: "8px" }}>
            이야기를 글로 정리했어요
          </div>
          <div style={{ textAlign: "center", fontSize: "15px", color: "#aaa", marginBottom: "18px" }}>
            {usedAI ? "AI가 다듬은 글이에요. 사실만 담았어요." : "글을 보기 좋게 정리했어요."}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px 22px",
              border: "2px solid #FFE4D6",
              marginBottom: "18px",
            }}
          >
            <input
              value={preview.title}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
              style={{ fontFamily: "'Nanum Myeongjo',serif", fontWeight: "800", fontSize: "22px", marginBottom: "16px" }}
            />
            <textarea
              rows={12}
              value={preview.body}
              onChange={(e) => setPreview({ ...preview, body: e.target.value })}
              style={{ fontSize: "18px", lineHeight: 1.9 }}
            />
          </div>

          <button onClick={saveFinal} disabled={busy} style={{ ...greenBtn, marginBottom: "10px" }}>
            {busy ? "저장 중…" : "이대로 저장하기"}
          </button>
          <button
            onClick={() => {
              setScreen("interview");
              setAnswerMode(null);
              setStatusMsg("이야기를 더 들려주세요.");
              const t = getTheme(themeId);
              setQuestion(t.questions[Math.min(qaPairs.length, t.questions.length - 1)]);
            }}
            style={{ ...secondaryBtn, marginBottom: "10px" }}
          >
            이야기 더하기
          </button>
          <button onClick={() => setScreen("interview")} style={secondaryBtn}>
            글 수정은 위에서 바로 하세요
          </button>
        </>
      )}

      {/* ── 목록 ── */}
      {screen === "list" && (
        <>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "26px", fontWeight: "800", textAlign: "center", marginBottom: "8px" }}>
            내가 남긴 이야기
          </div>
          <div style={{ textAlign: "center", fontSize: "17px", color: "#888", marginBottom: "22px" }}>
            눌러서 천천히 읽어 보세요
          </div>

          {stories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 12px", color: "#999", fontSize: "18px", lineHeight: 1.9 }}>
              아직 저장된 이야기가 없어요
              <br />
              &apos;이야기 시작하기&apos;로 남겨 보세요
            </div>
          ) : (
            LIFE_THEMES.map((t) => {
              const items = stories.filter((s) => s.themeId === t.id);
              if (!items.length) return null;
              return (
                <div key={t.id} style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "10px" }}>
                    {t.emoji} {t.label}
                  </div>
                  {items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openDetail(s)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "2.5px solid #E8D5CE",
                        background: "white",
                        borderRadius: "18px",
                        padding: "18px 20px",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#2C2C2C" }}>{s.title}</div>
                      <div style={{ fontSize: "14px", color: "#aaa", marginTop: "6px" }}>{formatDate(s.createdAt)}</div>
                    </button>
                  ))}
                </div>
              );
            })
          )}

          <button onClick={() => setScreen("home")} style={{ ...secondaryBtn, marginTop: "8px" }}>
            기록장 첫 화면
          </button>
          <button onClick={() => setScreen("themes")} style={{ ...primaryBtn(true), marginTop: "12px" }}>
            새 이야기 시작하기
          </button>
        </>
      )}

      {/* ── 상세 ── */}
      {screen === "detail" && selected && (
        <>
          <div style={{ fontSize: "15px", fontWeight: "800", color: "#D94F4F", marginBottom: "8px" }}>
            {selected.themeLabel} · {formatDate(selected.createdAt)}
          </div>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "26px", fontWeight: "800", lineHeight: 1.45, marginBottom: "18px" }}>
            {selected.title}
          </div>
          <div style={{ fontSize: "19px", color: "#333", lineHeight: 1.95, whiteSpace: "pre-wrap", marginBottom: "22px", wordBreak: "keep-all" }}>
            {selected.body}
          </div>

          {linkedPhotos.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "17px", fontWeight: "800", marginBottom: "10px" }}>함께 보는 사진</div>
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px" }}>
                {linkedPhotos.map((p) => (
                  <img key={p.id} src={p.url} alt="" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "14px", flexShrink: 0 }} />
                ))}
              </div>
            </div>
          )}

          {pickPhotos && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "17px", fontWeight: "800", marginBottom: "10px" }}>사진첩에서 고르기</div>
              {album.length === 0 ? (
                <div style={{ color: "#999", fontSize: "16px", marginBottom: "12px" }}>사진첩에 올린 사진이 아직 없어요.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  {album.map((p) => {
                    const on = photoIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          setPhotoIds((ids) => (on ? ids.filter((x) => x !== p.id) : [...ids, p.id]))
                        }
                        style={{
                          padding: 0,
                          border: on ? "3px solid #FF6B6B" : "3px solid transparent",
                          borderRadius: "12px",
                          overflow: "hidden",
                        }}
                      >
                        <img src={p.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                      </button>
                    );
                  })}
                </div>
              )}
              <button onClick={saveDetailEdits} style={{ ...greenBtn, marginBottom: "10px" }}>
                사진 연결 저장
              </button>
            </div>
          )}

          <button
            onClick={() =>
              requireFamily(() => {
                setSelected({ ...selected });
                setScreen("edit");
              })
            }
            style={{ ...primaryBtn(true), marginBottom: "10px" }}
          >
            ✏️ 글 수정하기
          </button>
          <button
            onClick={() => requireFamily(() => setPickPhotos((v) => !v))}
            style={{ ...secondaryBtn, marginBottom: "10px" }}
          >
            🖼️ 사진 붙이기
          </button>
          <button
            onClick={() => requireFamily(() => setConfirmDelete(true))}
            style={{ ...secondaryBtn, color: "#D94F4F", borderColor: "#F5C6C6", marginBottom: "10px" }}
          >
            이야기 삭제하기
          </button>
          <button onClick={() => setScreen("list")} style={secondaryBtn}>
            목록으로
          </button>

          {confirmDelete && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
              <div style={{ background: "white", borderRadius: "28px", padding: "32px 28px", width: "100%", maxWidth: "320px" }}>
                <div style={{ fontSize: "22px", fontWeight: "800", textAlign: "center", lineHeight: 1.5 }}>
                  이 이야기를
                  <br />
                  정말 지울까요?
                </div>
                <button onClick={doDeleteStory} style={{ ...primaryBtn(true), marginTop: "22px", background: "linear-gradient(135deg,#D94F4F,#FF6B6B)" }}>
                  네, 지울게요
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ ...secondaryBtn, marginTop: "10px" }}>
                  아니요
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 글 수정 ── */}
      {screen === "edit" && selected && (
        <>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", textAlign: "center", marginBottom: "18px" }}>
            글 수정하기
          </div>
          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>제목</label>
          <input
            value={selected.title}
            onChange={(e) => setSelected({ ...selected, title: e.target.value })}
            style={{ marginBottom: "16px" }}
          />
          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>본문</label>
          <textarea
            rows={14}
            value={selected.body}
            onChange={(e) => setSelected({ ...selected, body: e.target.value })}
            style={{ marginBottom: "18px" }}
          />
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await saveStory({
                  id: selected.id,
                  themeId: selected.themeId,
                  themeLabel: selected.themeLabel,
                  title: selected.title,
                  body: selected.body,
                  rawQa: selected.rawQa || [],
                  photoIds: selected.photoIds || [],
                });
                setScreen("detail");
              } catch (e) {
                alert("저장 실패");
              }
              setBusy(false);
            }}
            style={{ ...greenBtn, marginBottom: "10px" }}
          >
            저장하기
          </button>
          <button onClick={() => setScreen("detail")} style={secondaryBtn}>
            취소
          </button>
        </>
      )}
    </div>
  );
}
