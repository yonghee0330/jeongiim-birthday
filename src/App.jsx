import { useState, useEffect, useRef } from 'react';
import { PHOTOS } from './photos.js';
import { addCard, subscribeCards } from './firebase.js';

const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  id: i, left: (i * 41 + 7) % 100, size: 9 + (i * 6) % 12,
  delay: (i * 0.22) % 3.5, dur: 2.8 + (i * 0.15) % 2, shape: i % 3,
  color: ["#FF6B6B","#FFD166","#06D6A0","#FF8FA3","#A8DADC","#FFB347","#DCEDC1","#FF8E53"][i % 8],
}));
const CARD_COLORS = ["#FFF0F3","#FFFDE7","#F0FFF4","#FFF3E0","#EEF5FF","#FCE4EC"];
const DECORS = ["🌸","💐","🌺","🌼","🎀","💝","🌹","✨","🎉","💫"];
const TEMPLATES = [
  { label: "건강 오래오래", text: "어머니, 생신 진심으로 축하드려요!\n앞으로도 팔팔하게 오래오래 사세요! 💪" },
  { label: "사랑합니다", text: "늘 건강하시고 행복하세요!\n사랑합니다 🌸" },
  { label: "인생은 지금부터", text: "정임 씨 생일 축하해요!\n인생은 이제부터 시작입니다! 🚀" },
  { label: "행복한 날만", text: "앞으로도 웃음 가득하고\n행복한 날들만 가득하길 바랍니다 😊" },
];

function Confetti({ on }) {
  if (!on) return null;
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      <style>{`@keyframes fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {CONFETTI.map(p => (
        <div key={p.id} style={{
          position:"absolute",left:`${p.left}%`,top:"-24px",
          width:`${p.size}px`,height:`${p.size}px`,background:p.color,
          borderRadius:p.shape===0?"50%":p.shape===1?"2px":"30% 70% 70% 30%",
          animation:`fall ${p.dur}s ${p.delay}s ease-in infinite`,
        }}/>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [cards, setCards] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [confetti, setConfetti] = useState(true);
  const touchRef = useRef(null);
  const touchYRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeCards(setCards);
    return unsub;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 7000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (tab !== "home") return;
    const iv = setInterval(() => setPhotoIdx(p => (p + 1) % PHOTOS.length), 5000);
    return () => clearInterval(iv);
  }, [tab]);

  const submitCard = async () => {
    if (!name.trim() || !msg.trim() || sending) return;
    setSending(true);
    try {
      await addCard({
        name: name.trim(), msg: msg.trim(),
        date: new Date().toLocaleDateString("ko-KR"),
        color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
        decor: DECORS[Math.floor(Math.random() * DECORS.length)],
        createdAt: new Date(),
      });
      setName(""); setMsg("");
      setDone(true);
      setTimeout(() => { setDone(false); setTab("cards"); }, 2200);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const onTS = e => { touchRef.current = e.touches[0].clientX; touchYRef.current = e.touches[0].clientY; };
  const onTE = e => {
    if (!touchRef.current) return;
    const dx = touchRef.current - e.changedTouches[0].clientX;
    const dy = Math.abs((touchYRef.current||0) - e.changedTouches[0].clientY);
    const n = PHOTOS.length;
    if (Math.abs(dx) > 52 && Math.abs(dx) > dy)
      setPhotoIdx(p => dx > 0 ? (p+1)%n : (p-1+n)%n);
    touchRef.current = null;
  };

  const n = PHOTOS.length;
  const photo = PHOTOS[photoIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Nanum+Gothic:wght@400;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FFF8F5; font-family: 'Nanum Gothic', sans-serif; }
        @keyframes upIn  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes popIn { from { opacity:0; transform:scale(0.82) }       to { opacity:1; transform:scale(1) } }
        @keyframes fadeSlide { from { opacity:0; transform:translateX(14px) } to { opacity:1; transform:translateX(0) } }
        @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
        .f1 { animation: upIn .55s ease both }
        .f2 { animation: upIn .55s .18s ease both }
        .f3 { animation: upIn .55s .36s ease both }
        textarea, input {
          font-family: 'Nanum Gothic', sans-serif;
          font-size: 18px;
          color: #2C2C2C;
          background: white;
          border: 2.5px solid #E8D5CE;
          border-radius: 16px;
          padding: 16px 18px;
          width: 100%;
          outline: none;
          resize: none;
          display: block;
          line-height: 1.7;
          transition: border-color .2s, box-shadow .2s;
        }
        textarea:focus, input:focus {
          border-color: #FF6B6B;
          box-shadow: 0 0 0 3px rgba(255,107,107,.12);
        }
        button { cursor: pointer; font-family: 'Nanum Gothic', sans-serif; -webkit-tap-highlight-color: transparent; }
      `}</style>

      <Confetti on={confetti} />

      {/* 전송 완료 팝업 */}
      {done && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
          <div style={{background:"white",borderRadius:"32px",padding:"48px 36px",textAlign:"center",animation:"popIn .35s ease both",width:"100%",maxWidth:"320px"}}>
            <div style={{fontSize:"64px",lineHeight:1}}>🎉</div>
            <div style={{fontSize:"22px",fontWeight:"800",color:"#2C2C2C",marginTop:"20px",lineHeight:1.4}}>
              카드가 전달됐어요!
            </div>
            <div style={{fontSize:"18px",color:"#888",marginTop:"10px",lineHeight:1.6}}>
              정임 씨가 기뻐할 거예요 💕
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:"460px",margin:"0 auto",minHeight:"100vh",paddingBottom:"88px"}}>

        {/* ── 홈 탭 ── */}
        {tab === "home" && (
          <div>
            {/* 헤더 히어로 */}
            <div style={{background:"linear-gradient(160deg,#FFF0EC 0%,#FFF8E8 60%,#F0FFF8 100%)",padding:"52px 28px 32px",textAlign:"center"}}>
              <div className="f1" style={{
                display:"inline-block",background:"#FF6B6B",color:"white",
                fontSize:"15px",fontWeight:"700",padding:"8px 22px",
                borderRadius:"30px",letterSpacing:"1px",marginBottom:"24px",
              }}>
                🎂 &nbsp;생신을 축하합니다
              </div>

              <div className="f2" style={{
                fontFamily:"'Nanum Myeongjo',serif",
                fontSize:"30px",fontWeight:"800",
                color:"#D94F4F",lineHeight:1.5,wordBreak:"keep-all",
                marginBottom:"20px",
              }}>
                날마다 행복한<br/>정임씨의 생일을<br/>축하합니다! 🎂
              </div>

              <div className="f3" style={{
                fontSize:"19px",color:"#6B4E4E",lineHeight:"2.0",wordBreak:"keep-all",
              }}>
                어제보다 행복한 오늘 🌸<br/>
                날마다 웃음 가득한 시간 😄<br/>
                앞으로도 함께 해요! 💕
              </div>
            </div>

            {/* 사진 슬라이드 */}
            <div style={{padding:"24px 20px 8px"}}>
              <div style={{fontSize:"18px",fontWeight:"700",color:"#2C2C2C",marginBottom:"14px",display:"flex",alignItems:"center",gap:"8px"}}>
                📸 <span>정임씨의 아름다운 순간들</span>
              </div>

              <div style={{position:"relative"}}>
                <div
                  onTouchStart={onTS} onTouchEnd={onTE}
                  style={{borderRadius:"24px",overflow:"hidden",aspectRatio:"4/3",position:"relative",boxShadow:"0 10px 36px rgba(255,107,107,.2)",background:"#f0ece8"}}
                >
                  <img
                    key={photoIdx} src={photo.src} alt={photo.caption}
                    style={{width:"100%",height:"100%",objectFit:"cover",display:"block",animation:"fadeSlide .4s ease both"}}
                  />
                  {/* 상단 캡션 */}
                  <div style={{position:"absolute",top:0,left:0,right:0,background:"linear-gradient(180deg,rgba(0,0,0,.65) 0%,transparent 100%)",padding:"18px 18px 40px"}}>
                    <div style={{fontSize:"15px",fontWeight:"700",color:"white",lineHeight:1.6}}>{photo.caption}</div>
                  </div>
                  {/* 하단 날짜 */}
                  <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(0deg,rgba(0,0,0,.65) 0%,transparent 100%)",padding:"40px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                    <div style={{fontSize:"13px",fontWeight:"700",color:"white",background:"rgba(0,0,0,.35)",padding:"5px 12px",borderRadius:"20px"}}>📅 {photo.date}</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.8)",background:"rgba(0,0,0,.3)",padding:"5px 12px",borderRadius:"20px"}}>{photoIdx+1} / {n}</div>
                  </div>
                </div>

                {/* 좌우 버튼 — 크게 */}
                {[["‹", () => setPhotoIdx(p=>(p-1+n)%n), "left"], ["›", () => setPhotoIdx(p=>(p+1)%n), "right"]].map(([icon, fn, side]) => (
                  <button key={side} onClick={fn} style={{
                    position:"absolute",[side]:"10px",top:"50%",transform:"translateY(-50%)",
                    background:"rgba(255,255,255,.92)",border:"none",borderRadius:"50%",
                    width:"48px",height:"48px",fontSize:"26px",fontWeight:"700",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:"0 3px 12px rgba(0,0,0,.2)",zIndex:10,color:"#D94F4F",
                  }}>{icon}</button>
                ))}
              </div>

              {/* 인디케이터 */}
              <div style={{display:"flex",justifyContent:"center",gap:"6px",marginTop:"14px",flexWrap:"wrap",padding:"0 12px"}}>
                {PHOTOS.map((_,i) => (
                  <button key={i} onClick={()=>setPhotoIdx(i)} style={{
                    width:i===photoIdx?"24px":"8px",height:"8px",
                    borderRadius:i===photoIdx?"4px":"50%",
                    background:i===photoIdx?"#FF6B6B":"#F0C8C0",
                    border:"none",padding:0,transition:"all .3s ease",flexShrink:0,
                  }}/>
                ))}
              </div>
            </div>

            {/* 능력치 카드 3개 */}
            <div style={{display:"flex",gap:"10px",padding:"20px 20px 4px"}}>
              {[["💪","팔팔함","MAX"],["😄","행복지수","999%"],["🌿","건강나이","25세"]].map(([e,l,v]) => (
                <div key={l} style={{
                  flex:1,background:"white",borderRadius:"20px",
                  padding:"18px 8px",textAlign:"center",
                  boxShadow:"0 3px 16px rgba(0,0,0,.07)",
                  border:"2px solid #FFE4D6",
                }}>
                  <div style={{fontSize:"32px",lineHeight:1}}>{e}</div>
                  <div style={{fontSize:"13px",color:"#888",marginTop:"8px",fontWeight:"700"}}>{l}</div>
                  <div style={{fontSize:"17px",fontWeight:"800",color:"#D94F4F",marginTop:"4px"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* 능력치 게이지 */}
            <div style={{margin:"16px 20px",background:"white",borderRadius:"24px",padding:"24px",boxShadow:"0 3px 16px rgba(0,0,0,.07)",border:"2px solid #FFE4D6"}}>
              <div style={{fontSize:"17px",fontWeight:"800",color:"#2C2C2C",marginBottom:"20px"}}>
                🔬 정임 씨 능력치 과학적 분석
              </div>
              {[
                {label:"팔팔함 ⚡",v:95,c:"#FF6B6B"},
                {label:"행복 바이러스 😄",v:100,c:"#FFD166"},
                {label:"건강 체력 💪",v:88,c:"#06D6A0"},
                {label:"인생 즐기기 🎉",v:99,c:"#FF8E53"},
              ].map(({label,v,c}) => (
                <div key={label} style={{marginBottom:"16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"16px",fontWeight:"700",color:"#444",marginBottom:"8px"}}>
                    <span>{label}</span>
                    <span style={{color:c}}>{v}%</span>
                  </div>
                  <div style={{height:"14px",background:"#FFE8E0",borderRadius:"7px",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${c},${c}bb)`,borderRadius:"7px"}}/>
                  </div>
                </div>
              ))}
              <div style={{fontSize:"13px",color:"#bbb",textAlign:"center",marginTop:"12px"}}>
                * 세계 공인 연구기관의 과학적 분석 결과입니다 (실제 아님)
              </div>
            </div>

            {/* 축하카드 버튼 */}
            <div style={{padding:"4px 20px 20px"}}>
              <button onClick={()=>setTab("write")} style={{
                background:"linear-gradient(135deg,#FF6B6B,#FF8E53)",
                color:"white",border:"none",borderRadius:"20px",
                padding:"22px",fontSize:"20px",fontWeight:"800",
                boxShadow:"0 8px 24px rgba(255,107,107,.38)",
                width:"100%",letterSpacing:"0.5px",
                animation:"pulse 2.5s 3s ease-in-out 3",
              }}>
                💌 &nbsp;축하 카드 보내기
              </button>
            </div>

            <div style={{padding:"0 20px 24px",textAlign:"center",fontSize:"16px",color:"#bbb",lineHeight:"1.9"}}>
              정임 씨를 사랑하는 모든 분들이<br/>응원하고 있어요 🌸
            </div>
          </div>
        )}

        {/* ── 축하카드 목록 ── */}
        {tab === "cards" && (
          <div style={{padding:"32px 20px"}}>
            <div style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:"26px",fontWeight:"800",textAlign:"center",color:"#2C2C2C",marginBottom:"8px"}}>
              💌 축하 카드 모음
            </div>
            <div style={{textAlign:"center",fontSize:"17px",color:"#888",marginBottom:"28px",lineHeight:1.7}}>
              소중한 분들의 마음이 담겼어요
            </div>

            {cards.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 24px",color:"#bbb"}}>
                <div style={{fontSize:"64px",marginBottom:"20px"}}>📭</div>
                <div style={{fontSize:"18px",lineHeight:"2",color:"#999"}}>
                  아직 카드가 없어요<br/>
                  첫 번째 카드를 보내주세요!
                </div>
                <button onClick={()=>setTab("write")} style={{
                  marginTop:"28px",
                  background:"linear-gradient(135deg,#FF6B6B,#FF8E53)",
                  color:"white",border:"none",borderRadius:"18px",
                  padding:"18px 36px",fontWeight:"800",fontSize:"18px",
                  boxShadow:"0 6px 20px rgba(255,107,107,.3)",
                }}>카드 쓰러 가기 ✏️</button>
              </div>
            ) : (
              <>
                <div style={{
                  textAlign:"center",fontSize:"16px",fontWeight:"700",
                  color:"#D94F4F",marginBottom:"20px",
                  background:"#FFF0EC",borderRadius:"16px",padding:"14px",
                }}>
                  🎉 &nbsp;총 {cards.length}개의 축하 카드가 도착했어요!
                </div>
                {cards.map((card, i) => (
                  <div key={card.id} style={{
                    background: card.color,
                    borderRadius:"24px",padding:"28px",marginBottom:"16px",
                    boxShadow:"0 4px 20px rgba(0,0,0,.08)",position:"relative",
                    animation:`upIn .45s ${i*.08}s ease both`,
                    border:"2px solid rgba(0,0,0,.04)",
                  }}>
                    <div style={{position:"absolute",top:"20px",right:"22px",fontSize:"28px",opacity:.25}}>{card.decor}</div>
                    <div style={{fontWeight:"800",fontSize:"18px",color:"#2C2C2C",marginBottom:"14px"}}>
                      💌 &nbsp;From. {card.name}
                    </div>
                    <div style={{fontSize:"18px",color:"#1a1a1a",lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:"400"}}>{card.msg}</div>
                    <div style={{fontSize:"14px",color:"#aaa",marginTop:"16px",textAlign:"right"}}>{card.date}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── 카드 쓰기 ── */}
        {tab === "write" && (
          <div style={{padding:"32px 20px"}}>
            <div style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:"26px",fontWeight:"800",textAlign:"center",color:"#2C2C2C",marginBottom:"8px"}}>
              ✏️ 축하 카드 쓰기
            </div>
            <div style={{textAlign:"center",fontSize:"17px",color:"#888",marginBottom:"32px",lineHeight:1.7}}>
              정임 씨에게 마음을 전해드려요
            </div>

            {/* 이름 입력 */}
            <div style={{marginBottom:"24px"}}>
              <label style={{display:"block",fontSize:"17px",fontWeight:"800",color:"#2C2C2C",marginBottom:"10px"}}>
                내 이름 (또는 별명)
              </label>
              <input
                placeholder="예) 친구 김순자, 사위 호세, 막내 손주..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* 템플릿 먼저 */}
            <div style={{marginBottom:"24px"}}>
              <div style={{fontSize:"17px",fontWeight:"800",color:"#2C2C2C",marginBottom:"12px"}}>
                💡 &nbsp;예시 문구 (누르면 바로 입력돼요)
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={()=>setMsg(t.text)} style={{
                    textAlign:"left",
                    background: msg === t.text ? "#FFF0EC" : "white",
                    border: msg === t.text ? "2.5px solid #FF6B6B" : "2.5px solid #E8D5CE",
                    borderRadius:"16px",padding:"18px 20px",
                    transition:"all .15s",
                  }}>
                    <div style={{fontSize:"14px",fontWeight:"800",color:"#D94F4F",marginBottom:"4px"}}>{t.label}</div>
                    <div style={{fontSize:"17px",color:"#444",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{t.text}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 직접 입력 */}
            <div style={{marginBottom:"28px"}}>
              <label style={{display:"block",fontSize:"17px",fontWeight:"800",color:"#2C2C2C",marginBottom:"10px"}}>
                직접 쓰기 (위 예시를 수정해도 돼요)
              </label>
              <textarea
                placeholder="마음을 담아 써주세요&#10;(위의 예시를 눌러서 수정하셔도 됩니다)"
                rows={6}
                value={msg}
                onChange={e => setMsg(e.target.value)}
              />
            </div>

            {/* 전송 버튼 */}
            <button
              onClick={submitCard}
              disabled={!name.trim() || !msg.trim() || sending}
              style={{
                width:"100%",border:"none",borderRadius:"20px",
                padding:"22px",fontSize:"20px",fontWeight:"800",
                letterSpacing:"0.5px",transition:"all .2s",
                background: (name.trim() && msg.trim())
                  ? "linear-gradient(135deg,#FF6B6B,#FF8E53)"
                  : "#E8D5CE",
                color: (name.trim() && msg.trim()) ? "white" : "#aaa",
                boxShadow: (name.trim() && msg.trim())
                  ? "0 8px 24px rgba(255,107,107,.38)"
                  : "none",
              }}
            >
              {sending ? "전송 중... ⏳" : "카드 보내기 💌"}
            </button>

            <div style={{fontSize:"15px",color:"#bbb",textAlign:"center",marginTop:"16px",lineHeight:1.7}}>
              카드를 보내면 정임 씨가 바로 확인하실 수 있어요
            </div>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div style={{
        position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:"460px",
        background:"white",borderTop:"2px solid #FFE4D6",
        display:"flex",zIndex:100,
        boxShadow:"0 -4px 24px rgba(255,107,107,.12)",
      }}>
        {[
          ["home",  "🏠", "홈"],
          ["cards", "💌", "축하카드"],
          ["write", "✏️",  "카드쓰기"],
        ].map(([id, ic, lbl]) => (
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1,padding:"14px 4px 12px",border:"none",background:"transparent",
            fontSize:"13px",color:tab===id?"#D94F4F":"#bbb",
            fontWeight:tab===id?"800":"400",transition:"color .2s",
          }}>
            <div style={{fontSize:"26px",lineHeight:1.3,marginBottom:"3px"}}>{ic}</div>
            {lbl}
          </button>
        ))}
      </div>
    </>
  );
}
