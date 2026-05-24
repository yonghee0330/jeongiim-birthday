import { useState, useEffect, useRef } from 'react';
import { PHOTOS } from './photos.js';
import { addCard, subscribeCards } from './firebase.js';

const CONFETTI = Array.from({ length: 38 }, (_, i) => ({
  id: i, left: (i * 37 + 11) % 100, size: 7 + (i * 7) % 11,
  delay: (i * 0.19) % 3.2, dur: 2.4 + (i * 0.13) % 2, shape: i % 3,
  color: ["#FF6B6B","#FFD166","#06D6A0","#FF8FA3","#A8DADC","#FFB347","#DCEDC1","#FF8E53"][i % 8],
}));
const CARD_COLORS = ["#FFF0F3","#FFFDE7","#F0FFF4","#FFF3E0","#EEF5FF","#FCE4EC"];
const DECORS = ["🌸","💐","🌺","🌼","🎀","💝","🌹","✨","🎉","💫"];
const TEMPLATES = [
  "어머니, 생신 진심으로 축하드려요! 앞으로도 팔팔하게 오래오래 사세요! 💪🎉",
  "늘 건강하시고 행복하세요! 사랑합니다 🌸",
  "정임 씨 생일 축하해요! 인생은 이제부터 시작입니다! 🚀✨",
  "항상 웃음 가득하고 행복한 날들만 가득하길 바랍니다 😊💝",
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

  // Firestore 실시간 구독
  useEffect(() => {
    const unsub = subscribeCards(setCards);
    return unsub;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (tab !== "home") return;
    const iv = setInterval(() => setPhotoIdx(p => (p + 1) % PHOTOS.length), 4500);
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
      setTimeout(() => { setDone(false); setTab("cards"); }, 2000);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const onTS = e => { touchRef.current = e.touches[0].clientX; touchYRef.current = e.touches[0].clientY; };
  const onTE = e => {
    if (!touchRef.current) return;
    const dx = touchRef.current - e.changedTouches[0].clientX;
    const dy = Math.abs((touchYRef.current||0) - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 48 && Math.abs(dx) > dy)
      setPhotoIdx(p => dx > 0 ? (p+1)%PHOTOS.length : (p-1+PHOTOS.length)%PHOTOS.length);
    touchRef.current = null;
  };

  const n = PHOTOS.length;
  const photo = PHOTOS[photoIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Nanum+Gothic:wght@400;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#FFFBF5;font-family:'Nanum Gothic',sans-serif;}
        @keyframes upIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        .f1{animation:upIn .5s ease both}
        .f2{animation:upIn .5s .15s ease both}
        .f4{animation:upIn .5s .45s ease both}
        input,textarea{font-family:'Nanum Gothic',sans-serif;width:100%;border:2px solid #FFD6CC;border-radius:14px;padding:12px 16px;font-size:15px;color:#3D2C2C;background:white;outline:none;resize:none;transition:border-color .2s;display:block;}
        input:focus,textarea:focus{border-color:#FF6B6B}
        button{cursor:pointer;font-family:'Nanum Gothic',sans-serif;}
      `}</style>
      <Confetti on={confetti} />
      {done && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.38)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:"28px",padding:"44px 40px",textAlign:"center",animation:"popIn .35s ease both"}}>
            <div style={{fontSize:"54px"}}>🎉</div>
            <div style={{fontSize:"19px",fontWeight:"700",color:"#3D2C2C",marginTop:"14px"}}>카드가 전달됐어요!</div>
            <div style={{fontSize:"13px",color:"#8B6B6B",marginTop:"6px"}}>정임 씨가 기뻐할 거예요 💕</div>
          </div>
        </div>
      )}
      <div style={{maxWidth:"430px",margin:"0 auto",minHeight:"100vh",paddingBottom:"74px"}}>
        {/* 홈 */}
        {tab==="home" && (
          <div>
            <div style={{background:"linear-gradient(160deg,#FFF0EC 0%,#FFF8E6 55%,#F0FFF7 100%)",padding:"44px 24px 24px",textAlign:"center"}}>
              <div className="f1" style={{display:"inline-block",background:"#FF6B6B",color:"white",fontSize:"11px",fontWeight:"700",padding:"4px 16px",borderRadius:"20px",letterSpacing:"1.5px",marginBottom:"18px"}}>🎂 생신을 축하합니다</div>
              <div className="f2" style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:"26px",fontWeight:"800",color:"#FF6B6B",lineHeight:1.45,wordBreak:"keep-all"}}>
                날마다 행복한 정임씨의<br/>생일을 축하합니다! 🎂
              </div>
              <div className="f4" style={{fontSize:"15px",color:"#8B6B6B",marginTop:"16px",lineHeight:"2",wordBreak:"keep-all"}}>
                어제보다 행복한 오늘 🌸<br/>날마다 웃음 가득한 시간 😄<br/>앞으로도 함께 해요! 💕
              </div>
            </div>
            <div style={{padding:"16px 20px 4px"}}>
              <div style={{fontSize:"15px",fontWeight:"700",color:"#3D2C2C",marginBottom:"12px"}}>📸 정임씨의 아름다운 순간들</div>
              <div style={{position:"relative"}}>
                <div onTouchStart={onTS} onTouchEnd={onTE} style={{borderRadius:"24px",overflow:"hidden",aspectRatio:"4/3",position:"relative",boxShadow:"0 8px 32px rgba(255,107,107,.18)",background:"#f0f0f0"}}>
                  <img key={photoIdx} src={photo.src} alt={photo.caption} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",animation:"fadeSlide .35s ease both"}} />
                  <div style={{position:"absolute",top:0,left:0,right:0,background:"linear-gradient(180deg,rgba(0,0,0,.62) 0%,transparent 100%)",padding:"14px 16px 32px"}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,255,255,.97)",lineHeight:1.5}}>{photo.caption}</div>
                  </div>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(0deg,rgba(0,0,0,.62) 0%,transparent 100%)",padding:"32px 14px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                    <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,.92)",background:"rgba(0,0,0,.35)",padding:"3px 10px",borderRadius:"20px"}}>📅 {photo.date}</div>
                    <div style={{fontSize:"11px",color:"rgba(255,255,255,.75)",background:"rgba(0,0,0,.3)",padding:"3px 10px",borderRadius:"20px"}}>{photoIdx+1} / {n}</div>
                  </div>
                </div>
                <button onClick={()=>setPhotoIdx(p=>(p-1+n)%n)} style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.88)",border:"none",borderRadius:"50%",width:"38px",height:"38px",fontSize:"20px",fontWeight:"700",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(0,0,0,.18)",zIndex:10,color:"#FF6B6B"}}>‹</button>
                <button onClick={()=>setPhotoIdx(p=>(p+1)%n)} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.88)",border:"none",borderRadius:"50%",width:"38px",height:"38px",fontSize:"20px",fontWeight:"700",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(0,0,0,.18)",zIndex:10,color:"#FF6B6B"}}>›</button>
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:"4px",marginTop:"12px",flexWrap:"wrap",padding:"0 8px"}}>
                {PHOTOS.map((_,i)=>(<button key={i} onClick={()=>setPhotoIdx(i)} style={{width:i===photoIdx?"18px":"6px",height:"6px",borderRadius:i===photoIdx?"3px":"50%",background:i===photoIdx?"#FF6B6B":"#FFD6CC",border:"none",padding:0,transition:"all .3s ease",flexShrink:0}}/>))}
              </div>
            </div>
            <div style={{display:"flex",gap:"10px",padding:"16px 20px 4px"}}>
              {[["💪","팔팔함","MAX"],["😄","행복지수","999%"],["🌿","건강나이","25세"]].map(([e,l,v])=>(
                <div key={l} style={{flex:1,background:"white",borderRadius:"18px",padding:"14px 8px",textAlign:"center",boxShadow:"0 2px 14px rgba(0,0,0,.06)",border:"1.5px solid #FFE4D6"}}>
                  <div style={{fontSize:"26px"}}>{e}</div>
                  <div style={{fontSize:"11px",color:"#8B6B6B",marginTop:"5px"}}>{l}</div>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#FF6B6B",marginTop:"2px"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{margin:"16px 20px 8px",background:"white",borderRadius:"22px",padding:"20px",boxShadow:"0 2px 14px rgba(0,0,0,.06)",border:"1.5px solid #FFE4D6"}}>
              <div style={{fontSize:"14px",fontWeight:"700",color:"#3D2C2C",marginBottom:"16px"}}>🔬 정임 씨 능력치 과학적 분석</div>
              {[{label:"팔팔함 ⚡",v:95,c:"#FF6B6B"},{label:"행복 바이러스 😄",v:100,c:"#FFD166"},{label:"건강 체력 💪",v:88,c:"#06D6A0"},{label:"인생 즐기기 🎉",v:99,c:"#FF8E53"}].map(({label,v,c})=>(
                <div key={label} style={{marginBottom:"12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#8B6B6B",marginBottom:"5px"}}><span>{label}</span><span style={{color:c,fontWeight:"700"}}>{v}%</span></div>
                  <div style={{height:"10px",background:"#FFE4D6",borderRadius:"5px",overflow:"hidden"}}><div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${c},${c}99)`,borderRadius:"5px"}}/></div>
                </div>
              ))}
              <div style={{fontSize:"11px",color:"#ccc",textAlign:"center",marginTop:"10px"}}>* 세계 공인 연구기관의 과학적 분석 결과입니다 (실제 아님)</div>
            </div>
            <div style={{padding:"8px 20px 16px"}}>
              <button onClick={()=>setTab("write")} style={{background:"linear-gradient(135deg,#FF6B6B,#FF8E53)",color:"white",border:"none",borderRadius:"18px",padding:"16px",fontSize:"16px",fontWeight:"700",boxShadow:"0 6px 20px rgba(255,107,107,.32)",width:"100%"}}>축하 카드 보내기 💌</button>
            </div>
            <div style={{padding:"0 16px 16px",textAlign:"center",fontSize:"12px",color:"#ccc",lineHeight:"1.8"}}>정임 씨를 사랑하는 모든 분들이 응원하고 있어요 🌸</div>
          </div>
        )}
        {/* 카드 목록 */}
        {tab==="cards" && (
          <div style={{padding:"24px 16px"}}>
            <div style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:"23px",fontWeight:"700",textAlign:"center",color:"#3D2C2C",marginBottom:"6px"}}>💌 축하 카드 모음</div>
            <div style={{textAlign:"center",fontSize:"13px",color:"#8B6B6B",marginBottom:"22px"}}>소중한 분들의 마음이 담겼어요</div>
            {cards.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 24px",color:"#aaa"}}>
                <div style={{fontSize:"52px",marginBottom:"14px"}}>📭</div>
                <div style={{fontSize:"14px",lineHeight:"1.9"}}>아직 카드가 없어요<br/>첫 번째 카드를 보내주세요!</div>
                <button onClick={()=>setTab("write")} style={{marginTop:"22px",background:"linear-gradient(135deg,#FF6B6B,#FF8E53)",color:"white",border:"none",borderRadius:"16px",padding:"14px 28px",fontWeight:"700",fontSize:"15px",boxShadow:"0 4px 16px rgba(255,107,107,.3)"}}>카드 쓰러 가기 ✏️</button>
              </div>
            ) : (
              <>
                <div style={{textAlign:"center",fontSize:"13px",fontWeight:"700",color:"#FF6B6B",marginBottom:"16px"}}>총 {cards.length}개의 축하 카드 🎉</div>
                {cards.map((card,i)=>(
                  <div key={card.id} style={{background:card.color,borderRadius:"22px",padding:"22px",marginBottom:"14px",boxShadow:"0 3px 16px rgba(0,0,0,.07)",position:"relative",animation:`upIn .4s ${i*.07}s ease both`}}>
                    <div style={{position:"absolute",top:"16px",right:"18px",fontSize:"22px",opacity:.35}}>{card.decor}</div>
                    <div style={{fontWeight:"700",fontSize:"15px",color:"#3D2C2C",marginBottom:"9px"}}>From. {card.name}</div>
                    <div style={{fontSize:"14px",color:"#6B5B5B",lineHeight:"1.8"}}>{card.msg}</div>
                    <div style={{fontSize:"11px",color:"#aaa",marginTop:"11px",textAlign:"right"}}>{card.date}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {/* 카드 쓰기 */}
        {tab==="write" && (
          <div style={{padding:"24px 20px"}}>
            <div style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:"23px",fontWeight:"700",textAlign:"center",color:"#3D2C2C",marginBottom:"6px"}}>✏️ 카드 쓰기</div>
            <div style={{textAlign:"center",fontSize:"13px",color:"#8B6B6B",marginBottom:"24px"}}>정임 씨에게 마음을 전해드려요</div>
            <label style={{display:"block",fontSize:"13px",fontWeight:"700",color:"#3D2C2C",marginBottom:"8px"}}>이름 또는 별명</label>
            <input placeholder="예) 막내 손주, 사위 호세, 친구 홍길동..." value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:"18px"}}/>
            <label style={{display:"block",fontSize:"13px",fontWeight:"700",color:"#3D2C2C",marginBottom:"8px"}}>어머니께 전하는 말 💌</label>
            <textarea placeholder="마음을 담아 축하 메시지를 써주세요" rows={5} value={msg} onChange={e=>setMsg(e.target.value)} style={{marginBottom:"18px"}}/>
            <div style={{fontSize:"12px",fontWeight:"700",color:"#8B6B6B",marginBottom:"10px"}}>💡 템플릿으로 시작하기</div>
            {TEMPLATES.map((t,i)=>(<button key={i} onClick={()=>setMsg(t)} style={{width:"100%",textAlign:"left",background:"#FFF0EC",border:"1.5px solid #FFD6CC",borderRadius:"13px",padding:"12px 15px",fontSize:"13px",color:"#6B5B5B",lineHeight:"1.7",marginBottom:"9px"}}>{t}</button>))}
            <button onClick={submitCard} disabled={!name.trim()||!msg.trim()||sending} style={{width:"100%",background:name.trim()&&msg.trim()?"linear-gradient(135deg,#FF6B6B,#FF8E53)":"#FFD6CC",color:"white",border:"none",borderRadius:"18px",padding:"17px",fontSize:"17px",fontWeight:"700",marginTop:"12px",boxShadow:name.trim()&&msg.trim()?"0 6px 20px rgba(255,107,107,.32)":"none",opacity:name.trim()&&msg.trim()?1:0.75}}>
              {sending ? "전송 중..." : "카드 보내기 🎉"}
            </button>
          </div>
        )}
      </div>
      {/* 하단 네비 */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"430px",background:"white",borderTop:"2px solid #FFE4D6",display:"flex",zIndex:100,boxShadow:"0 -4px 20px rgba(255,107,107,.1)"}}>
        {[["home","🏠","홈"],["cards","💌","축하카드"],["write","✏️","카드쓰기"]].map(([id,ic,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",fontSize:"11px",color:tab===id?"#FF6B6B":"#ccc",fontWeight:tab===id?"800":"400",transition:"color .2s"}}>
            <div style={{fontSize:"23px",lineHeight:1.3}}>{ic}</div>{lbl}
          </button>
        ))}
      </div>
    </>
  );
}
