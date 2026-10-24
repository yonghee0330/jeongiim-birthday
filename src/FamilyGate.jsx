import { useState } from "react";
import { unlockFamily } from "./firebase.js";

const btnPrimary = {
  width: "100%",
  border: "none",
  borderRadius: "20px",
  padding: "20px",
  fontSize: "20px",
  fontWeight: "800",
  background: "linear-gradient(135deg,#FF6B6B,#FF8E53)",
  color: "white",
  boxShadow: "0 8px 24px rgba(255,107,107,.38)",
};

/** 사진 올리기·이야기 저장 등 가족만 하는 작업 앞에 띄우는 비밀번호 창 */
export default function FamilyGate({ open, onClose, onUnlocked, title = "가족만 할 수 있어요" }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setErr("");
    const res = await unlockFamily(pin);
    setBusy(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setPin("");
    onUnlocked?.();
    onClose?.();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 950,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "28px",
          padding: "36px 28px",
          width: "100%",
          maxWidth: "340px",
          animation: "popIn .35s ease both",
        }}
      >
        <div style={{ fontSize: "40px", textAlign: "center" }}>🔐</div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: "800",
            textAlign: "center",
            marginTop: "12px",
            color: "#2C2C2C",
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "17px",
            color: "#888",
            textAlign: "center",
            marginTop: "10px",
            lineHeight: 1.7,
          }}
        >
          가족 비밀번호를 입력해 주세요.
          <br />
          한 번 열면 이 기기에서는 계속 쓸 수 있어요.
        </div>
        <input
          type="password"
          inputMode="numeric"
          placeholder="비밀번호"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ marginTop: "22px" }}
          autoFocus
        />
        {err && (
          <div style={{ color: "#D94F4F", fontSize: "16px", marginTop: "12px", fontWeight: "700" }}>
            {err}
          </div>
        )}
        <button onClick={submit} disabled={busy || !pin.trim()} style={{ ...btnPrimary, marginTop: "20px", opacity: busy || !pin.trim() ? 0.6 : 1 }}>
          {busy ? "확인 중..." : "열기"}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "12px",
            border: "2.5px solid #E8D5CE",
            background: "white",
            borderRadius: "18px",
            padding: "16px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#888",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
