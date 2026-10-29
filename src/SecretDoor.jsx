import { useEffect, useRef, useState } from "react";

// 푸터에 숨겨 둔 작은 하트. 누르면 오현식 님 페이지(인생은 아름다워)로 건너가는 비밀 통로가 열려요.
const PARTNER = {
  name: "오현식",
  title: "인생은 아름다워",
  url: "https://xn--wv4bz3dmzt.kr", // 오현식.kr
};

export default function SecretDoor() {
  const [open, setOpen] = useState(false);
  const [going, setGoing] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const cross = () => {
    setOpen(false);
    setGoing(true);
    timer.current = setTimeout(() => { window.location.href = PARTNER.url; }, 1700);
  };

  return (
    <>
      <style>{css}</style>
      <button className="secret-heart" onClick={() => setOpen(true)} aria-label="비밀 통로">♡</button>

      {open && (
        <div className="secret-back" onClick={() => setOpen(false)}>
          <div className="secret-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="secret-emoji">🤫🚪</div>
            <h3>쉿, 비밀 통로를 찾으셨네요!</h3>
            <p>
              이 문을 열면 {PARTNER.name} 님의 ‘{PARTNER.title}’ 페이지로 건너가요.
              <br />
              그쪽에도 이쪽으로 오는 문이 숨겨져 있대요.
              <br />
              두 분은 어딜 가나 서로를 찾으시네요 💕
            </p>
            <div className="secret-row">
              <button className="secret-btn ghost" onClick={() => setOpen(false)}>다음에요</button>
              <button className="secret-btn" onClick={cross}>💕 건너가 볼게요</button>
            </div>
          </div>
        </div>
      )}

      {going && (
        <div className="secret-go" role="status">
          <div className="secret-go-emoji">🚪💨</div>
          <div>{PARTNER.name} 님 곁으로 건너가는 중…</div>
          <div className="secret-hearts" aria-hidden="true">💕 💕 💕</div>
        </div>
      )}
    </>
  );
}

const css = `
  .secret-heart { background: none; border: 0; padding: 2px 4px; margin-left: 2px; font-size: 14px; line-height: 1; color: var(--line, #e4dccd); opacity: .7; cursor: pointer; transition: color .2s, transform .2s, opacity .2s; }
  .secret-heart:hover, .secret-heart:focus-visible { color: #e0566f; opacity: 1; transform: scale(1.35) rotate(-8deg); }
  .secret-back { position: fixed; inset: 0; z-index: 200; background: rgba(30,24,18,.55); display: grid; place-items: center; padding: 16px; }
  .secret-modal { background: #fffdf8; color: var(--ink, #2f2a24); border-radius: 22px; padding: 28px 22px 22px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,.3); font-family: 'Noto Sans KR', sans-serif; }
  .secret-modal h3 { font-family: 'Gowun Batang', serif; font-size: 22px; margin: 4px 0 12px; }
  .secret-modal p { margin: 0 0 18px; line-height: 1.8; word-break: keep-all; }
  .secret-emoji { font-size: 40px; }
  .secret-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .secret-btn { font: inherit; font-weight: 700; padding: 11px 20px; border-radius: 999px; border: 0; cursor: pointer; background: #9a5b3a; color: #fff; }
  .secret-btn.ghost { background: #efe8db; color: var(--ink, #2f2a24); }
  .secret-go { position: fixed; inset: 0; z-index: 300; display: grid; place-content: center; text-align: center; gap: 6px; color: #fff; font-family: 'Gowun Batang', serif; font-size: 22px; background: linear-gradient(160deg, #e98aa0 0%, #f4b6a0 55%, #f7d9a8 100%); animation: secretfade .5s ease both; }
  .secret-go-emoji { font-size: 64px; animation: secretdash 1.6s ease-in-out infinite; }
  .secret-hearts { margin-top: 10px; letter-spacing: .3em; animation: secretpulse 1s ease-in-out infinite; }
  @keyframes secretfade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes secretdash { 0%, 100% { transform: translateX(-14px); } 50% { transform: translateX(14px); } }
  @keyframes secretpulse { 0%, 100% { opacity: .5; transform: scale(.95); } 50% { opacity: 1; transform: scale(1.08); } }
`;
