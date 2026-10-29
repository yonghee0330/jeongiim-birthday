import { useEffect, useRef, useState } from "react";

// 화면 오른쪽 아래에 떠 있는 두근거리는 하트. 누르면 오현식 님 페이지(인생은 아름다워)로 건너가는 비밀 통로가 열려요.
const PARTNER = {
  name: "오현식",
  title: "인생은 아름다워",
  url: "https://xn--wv4bz3dmzt.kr", // 오현식.kr
};

export default function SecretDoor() {
  const [open, setOpen] = useState(false);
  const [going, setGoing] = useState(false);
  const [hint, setHint] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // 말풍선은 잠깐 떴다가 사라져요 (반복해서 살짝 알려줌)
  useEffect(() => {
    let on, off;
    const cycle = () => {
      on = setTimeout(() => setHint(true), 1800);
      off = setTimeout(() => setHint(false), 7500);
    };
    cycle();
    const again = setInterval(() => { clearTimeout(on); clearTimeout(off); cycle(); }, 30000);
    return () => { clearTimeout(on); clearTimeout(off); clearInterval(again); };
  }, []);
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
      <div className="secret-float">
        {hint && !open && <span className="secret-bubble" aria-hidden="true">쉿, 비밀 통로 🤫</span>}
        <button className="secret-fab" onClick={() => { setHint(false); setOpen(true); }} aria-label={`비밀 통로: ${PARTNER.name} 님 페이지로`}>
          <span className="secret-fab-heart">💕</span>
        </button>
      </div>

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
  .secret-float { position: fixed; right: max(14px, env(safe-area-inset-right)); bottom: 92px; z-index: 790; display: flex; align-items: center; gap: 10px; pointer-events: none; }
  .secret-float > * { pointer-events: auto; }
  .secret-fab { position: relative; width: 58px; height: 58px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; background: linear-gradient(145deg, #f08fa6, #e0566f); box-shadow: 0 8px 22px rgba(224,86,111,.45), 0 0 0 4px rgba(255,255,255,.85); -webkit-tap-highlight-color: transparent; }
  .secret-fab::before { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 2px solid #e0566f; animation: secretring 2.2s ease-out infinite; }
  .secret-fab:active { transform: scale(.92); }
  .secret-fab-heart { font-size: 28px; line-height: 1; animation: secretbeat 1.6s ease-in-out infinite; }
  .secret-bubble { background: #fff; color: #7a2f3f; font-weight: 700; font-size: 14px; padding: 9px 14px; border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,.18); white-space: nowrap; animation: secretpop .35s ease both; position: relative; font-family: 'Noto Sans KR', sans-serif; }
  .secret-bubble::after { content: ''; position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; background: #fff; transform: translateY(-50%) rotate(45deg); border-radius: 2px; }
  @keyframes secretbeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.22); } 30% { transform: scale(1); } 45% { transform: scale(1.14); } }
  @keyframes secretring { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(1.7); opacity: 0; } }
  @keyframes secretpop { from { opacity: 0; transform: translateX(10px) scale(.9); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .secret-fab::before, .secret-fab-heart { animation: none; } }
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
