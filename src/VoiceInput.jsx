import { useEffect, useRef, useState } from "react";

/**
 * 말로 이야기하기 — Web Speech API (Chrome/Android, Safari 일부)
 * 실패 시 안내 후 글 입력으로 유도
 */
export default function VoiceInput({ onConfirm, onCancel }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("마이크 버튼을 누르면 말씀하실 수 있어요.");
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);
  const finalRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      setStatus("이 휴대폰에서는 음성 인식이 어려워요. 글로 적어 주세요.");
      return;
    }
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => {
      setListening(true);
      setStatus("말씀하고 계세요. 편하게 이야기해 주세요.");
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setStatus("마이크 사용을 허용해 주셔야 해요. 설정에서 마이크를 켜 주세요.");
      } else if (e.error === "no-speech") {
        setStatus("목소리가 잘 안 들렸어요. 다시 한 번 말씀해 주세요.");
      } else {
        setStatus("음성 인식에 문제가 생겼어요. 다시 시도하거나 글로 적어 주세요.");
      }
    };
    rec.onend = () => {
      setListening(false);
      if (finalRef.current.trim()) {
        setStatus("아래 글을 확인하시고, 틀리면 고치신 뒤 '이대로 답변하기'를 눌러 주세요.");
      } else {
        setStatus("녹음이 끝났어요. 다시 말씀하시거나 글로 적어 주세요.");
      }
    };
    rec.onresult = (event) => {
      let interim = "";
      let finalText = finalRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      finalRef.current = finalText;
      setText((finalText + interim).trim());
    };
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch (_) {}
    };
  }, []);

  const start = () => {
    if (!recRef.current) return;
    finalRef.current = text ? text + " " : "";
    try {
      recRef.current.start();
    } catch (_) {
      setStatus("이미 듣고 있어요. 말씀을 이어 가시면 됩니다.");
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch (_) {}
    setListening(false);
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <div
        style={{
          background: "#FFF8F5",
          border: "2.5px solid #E8D5CE",
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "14px",
          fontSize: "18px",
          color: "#6B4E4E",
          lineHeight: 1.7,
        }}
      >
        {status}
        <div style={{ fontSize: "14px", color: "#aaa", marginTop: "8px", lineHeight: 1.6 }}>
          말씀하신 내용은 글 정리에만 쓰이며, 외부로 공유되지 않도록 조심히 다룹니다.
        </div>
      </div>

      {supported && (
        <button
          onClick={listening ? stop : start}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "20px",
            padding: "22px",
            fontSize: "20px",
            fontWeight: "800",
            marginBottom: "12px",
            background: listening
              ? "linear-gradient(135deg,#D94F4F,#FF6B6B)"
              : "linear-gradient(135deg,#FF6B6B,#FF8E53)",
            color: "white",
            boxShadow: "0 8px 24px rgba(255,107,107,.35)",
          }}
        >
          {listening ? "⏹ 녹음 끝내기" : "🎤 말씀 시작하기"}
        </button>
      )}

      <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "10px" }}>
        알아들은 내용 (고치셔도 돼요)
      </label>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          finalRef.current = e.target.value;
        }}
        placeholder="여기에 말씀하신 내용이 나타나요"
      />

      <button
        onClick={() => text.trim() && onConfirm(text.trim())}
        disabled={!text.trim()}
        style={{
          width: "100%",
          marginTop: "14px",
          border: "none",
          borderRadius: "20px",
          padding: "20px",
          fontSize: "20px",
          fontWeight: "800",
          background: text.trim() ? "linear-gradient(135deg,#06D6A0,#2EC4B6)" : "#E8D5CE",
          color: text.trim() ? "white" : "#aaa",
        }}
      >
        이대로 답변하기
      </button>
      <button
        onClick={onCancel}
        style={{
          width: "100%",
          marginTop: "10px",
          border: "2.5px solid #E8D5CE",
          background: "white",
          borderRadius: "18px",
          padding: "16px",
          fontSize: "18px",
          fontWeight: "700",
          color: "#888",
        }}
      >
        취소
      </button>
    </div>
  );
}
