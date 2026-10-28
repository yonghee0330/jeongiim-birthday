import { useState, useEffect, useRef } from "react";
import { PHOTOS } from "./photos.js";
import { HAPPINESS_QUOTES } from "./quotes.js";
import { LIFE_CHAPTERS } from "./lifeChapters.js";
import {
  addCard,
  subscribeCards,
  subscribeAlbum,
} from "./firebase.js";
import AlbumTab from "./AlbumTab.jsx";
import StoryTab from "./StoryTab.jsx";
import MusicPlayer from "./MusicPlayer.jsx";

const C = {
  sage: "#7A9B8E",
  sageDeep: "#5F7F72",
  sageSoft: "#E4EDE8",
  cream: "#F7F3EB",
  creamDeep: "#EFE8DC",
  rose: "#E8C4C4",
  roseSoft: "#F6EAEA",
  coral: "#C98B84",
  coralDeep: "#B5746C",
  ink: "#2F2C28",
  muted: "#6B6560",
  white: "#FFFcf7",
  line: "rgba(122,155,142,.28)",
  shadow: "0 12px 40px rgba(47,44,40,.08)",
};

const CARD_COLORS = ["#F6EAEA", "#EFE8DC", "#E4EDE8", "#F3E6E0", "#EAF0EC", "#F8F0F0"];
const DECORS = ["🌿", "🌸", "🕊️", "✨", "💮", "🍃"];

const NAV = [
  { id: "quote", label: "오늘의 행복" },
  { id: "story", label: "인생 이야기" },
  { id: "gallery", label: "갤러리" },
  { id: "guestbook", label: "따뜻한 한마디" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function dayQuoteIndex() {
  const d = new Date();
  const key = d.getFullYear() * 400 + d.getMonth() * 40 + d.getDate();
  return key % HAPPINESS_QUOTES.length;
}

export default function App() {
  // 음악 플레이어는 화면을 옮겨도 끊기지 않도록 페이지 밖에 둡니다
  return (
    <>
      <Page />
      <MusicPlayer />
    </>
  );
}

function Page() {
  const [view, setView] = useState("landing"); // landing | album | story | write
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(dayQuoteIndex);
  const [cards, setCards] = useState([]);
  const [album, setAlbum] = useState([]);
  const [name, setName] = useState("");
  const [cardMsg, setCardMsg] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [shareHint, setShareHint] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(null);
  const heroPhoto = PHOTOS[23] || PHOTOS[0];

  useEffect(() => {
    const u1 = subscribeCards(setCards);
    const u2 = subscribeAlbum(setAlbum);
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitCard = async () => {
    if (!name.trim() || !cardMsg.trim() || sending) return;
    setSending(true);
    try {
      await addCard({
        name: name.trim(),
        msg: cardMsg.trim(),
        date: new Date().toLocaleDateString("ko-KR"),
        color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
        decor: DECORS[Math.floor(Math.random() * DECORS.length)],
        createdAt: new Date(),
      });
      setName("");
      setCardMsg("");
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setView("landing");
        setTimeout(() => scrollToId("guestbook"), 100);
      }, 1800);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const shareQuote = async () => {
    const q = HAPPINESS_QUOTES[quoteIdx];
    const text = `"${q.text}"\n- ${q.tag}\n유정임 | 오늘 더 행복해\n${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "오늘의 행복 구절", text });
        setShareHint("공유 창을 열었어요.");
      } else {
        await navigator.clipboard.writeText(text);
        setShareHint("문구를 복사했어요. 카카오톡에 붙여넣기 하세요.");
      }
    } catch (_) {
      setShareHint("공유가 취소되었거나 지원되지 않아요.");
    }
    setTimeout(() => setShareHint(""), 3500);
  };

  const galleryItems = [
    ...album.slice(0, 8).map((p) => ({
      key: p.id,
      src: p.url,
      caption: p.title || p.period || "행복한 순간",
    })),
    ...PHOTOS.slice(0, Math.max(0, 8 - Math.min(album.length, 8))).map((p) => ({
      key: `static-${p.n}`,
      src: p.src,
      caption: p.caption,
    })),
  ].slice(0, 8);

  if (view === "album") {
    return (
      <Shell onBack={() => setView("landing")}>
        <AlbumTab />
      </Shell>
    );
  }
  if (view === "story") {
    return (
      <Shell onBack={() => setView("landing")}>
        <StoryTab />
      </Shell>
    );
  }
  if (view === "write") {
    return (
      <Shell onBack={() => setView("landing")} title="따뜻한 한마디 남기기">
        <WriteForm
          name={name}
          setName={setName}
          cardMsg={cardMsg}
          setCardMsg={setCardMsg}
          sending={sending}
          submitCard={submitCard}
          done={done}
        />
      </Shell>
    );
  }

  const quote = HAPPINESS_QUOTES[quoteIdx];

  return (
    <>
      <style>{globalCss}</style>

      {done && (
        <div className="overlay">
          <div className="popup">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
            <div className="popup-title">따뜻한 마음이 전달됐어요</div>
            <div className="popup-sub">정임님께 전해질 거예요</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="header-inner">
          <button className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="logo-name">유정임</span>
            <span className="logo-sep">|</span>
            <span className="logo-tag">오늘 더 행복해</span>
          </button>

          <nav className="nav-desktop">
            {NAV.map((n) => (
              <button key={n.id} className="nav-link" onClick={() => scrollToId(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>

          <button
            className="nav-toggle"
            aria-label="메뉴"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "닫기" : "메뉴"}
          </button>
        </div>
        {menuOpen && (
          <div className="nav-mobile">
            {NAV.map((n) => (
              <button
                key={n.id}
                className="nav-link"
                onClick={() => {
                  setMenuOpen(false);
                  scrollToId(n.id);
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="hero" id="top">
          <div className="hero-bg" />
          <div className="hero-inner">
            <div className="hero-copy fade-up">
              <p className="eyebrow">Personal Brand · Today, Happier</p>
              <h1>
                매일이 새로워지는 삶,
                <br />
                유정임의 <em>‘오늘 더 행복해’</em>
              </h1>
              <p className="hero-sub">
                따뜻한 시선과 긍정의 에너지가 머무는 공간입니다.
              </p>
              <button className="btn-primary" onClick={() => scrollToId("quote")}>
                오늘의 행복 한 줄 읽기
              </button>
            </div>
            <div className="hero-visual fade-up delay">
              <div className="portrait-frame">
                <img src={heroPhoto.src} alt="유정임" />
              </div>
              <div className="portrait-caption">오늘도, 더 행복하게</div>
            </div>
          </div>
        </section>

        {/* Daily Quote */}
        <section className="section" id="quote">
          <div className="section-inner">
            <p className="section-eyebrow">Daily Inspiration</p>
            <h2 className="section-title">오늘의 행복 구절</h2>
            <p className="section-desc">마음에 남는 한 줄로, 오늘을 조금 더 부드럽게</p>

            <article className="quote-card">
              <div
                key={quoteIdx}
                className="quote-hero"
                style={{ backgroundImage: `url(${quote.image})` }}
              >
                <div className="quote-veil" />
                <div className="quote-body">
                  <div className="quote-mark">“</div>
                  <p className="quote-text">{quote.text}</p>
                  <p className="quote-author">— {quote.tag} —</p>
                </div>
                {quote.credit && <p className="quote-credit">{quote.credit}</p>}
              </div>
              <div className="quote-actions">
                <button
                  className="btn-ghost"
                  onClick={() => setQuoteIdx((i) => (i + 1) % HAPPINESS_QUOTES.length)}
                >
                  오늘의 명언 바꾸기
                </button>
                <button className="btn-soft" onClick={shareQuote}>
                  카카오톡으로 공유하기
                </button>
              </div>
              {shareHint && <p className="share-hint">{shareHint}</p>}
            </article>
          </div>
        </section>

        {/* Life Story */}
        <section className="section section-alt" id="story">
          <div className="section-inner">
            <p className="section-eyebrow">Life Story</p>
            <h2 className="section-title">유정임의 인생 이야기</h2>
            <p className="section-desc">지나온 길과 오늘의 마음이 이어지는 이야기</p>

            <div className="chapters">
              {LIFE_CHAPTERS.map((ch, i) => {
                const photo = PHOTOS.find((p) => p.n === ch.photoHint) || PHOTOS[i * 7];
                const reverse = i % 2 === 1;
                return (
                  <article key={ch.id} className={`chapter ${reverse ? "is-reverse" : ""}`}>
                    <div className="chapter-text">
                      <span className="chapter-label">{ch.chapter}</span>
                      <h3>{ch.title}</h3>
                      <p>{ch.body}</p>
                    </div>
                    <div className="chapter-photo">
                      <img src={photo.src} alt={ch.title} />
                    </div>
                  </article>
                );
              })}
            </div>

          </div>
        </section>

        {/* Gallery */}
        <section className="section" id="gallery">
          <div className="section-inner">
            <p className="section-eyebrow">Gallery</p>
            <h2 className="section-title">행복한 순간들</h2>
            <p className="section-desc">가족과 여행, 일상의 미소가 담긴 사진들</p>

            <div className="gallery-grid">
              {galleryItems.map((g, i) => (
                <figure key={g.key} className="gallery-card">
                  <button
                    type="button"
                    className="gallery-img"
                    aria-label={`${g.caption} 크게 보기`}
                    onClick={() => setZoomIdx(i)}
                  >
                    <img src={g.src} alt={g.caption} />
                  </button>
                  <figcaption>{g.caption}</figcaption>
                </figure>
              ))}
            </div>

            <div className="section-cta">
              <button className="btn-primary" onClick={() => setView("album")}>
                행복한 순간 추가하기
              </button>
            </div>
          </div>
        </section>

        {/* Guestbook */}
        <section className="section section-alt" id="guestbook">
          <div className="section-inner">
            <p className="section-eyebrow">Community</p>
            <h2 className="section-title">따뜻한 한마디</h2>
            <p className="section-desc">친구와 가족이 전하는 응원의 마음을 남겨 주세요</p>

            <button className="btn-primary" style={{ marginBottom: 28 }} onClick={() => setView("write")}>
              한마디 남기기
            </button>

            {cards.length === 0 ? (
              <div className="empty-box">
                아직 남겨진 말이 없어요.
                <br />
                첫 번째 따뜻한 한마디를 남겨 주세요.
              </div>
            ) : (
              <div className="guest-grid">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className="guest-card"
                    style={{ background: card.color || C.roseSoft }}
                  >
                    <div className="guest-decor">{card.decor || "🌿"}</div>
                    <div className="guest-from">From. {card.name}</div>
                    <p className="guest-msg">
                      {(card.message || card.msg || "").split("\n").map((line, j, arr) => (
                        <span key={j}>
                          {line}
                          {j < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                    <div className="guest-date">{card.date}</div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>© 유정임 | 오늘 더 행복해. All rights reserved.</div>
      </footer>

      {zoomIdx !== null && galleryItems[zoomIdx] && (
        <PhotoZoom
          items={galleryItems}
          index={zoomIdx}
          setIndex={setZoomIdx}
          onClose={() => setZoomIdx(null)}
        />
      )}
    </>
  );
}

function PhotoZoom({ items, index, setIndex, onClose }) {
  const touchX = useRef(null);
  const item = items[index];
  const n = items.length;
  const prev = () => setIndex((index - 1 + n) % n);
  const next = () => setIndex((index + 1) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  return (
    <div
      className="zoom-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 50) (dx > 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      <button className="zoom-close" onClick={onClose}>✕ 닫기</button>
      <img
        key={index}
        className="zoom-img"
        src={item.src}
        alt={item.caption}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="zoom-caption" onClick={(e) => e.stopPropagation()}>
        <p>{item.caption}</p>
        {n > 1 && (
          <div className="zoom-nav">
            <button onClick={prev} aria-label="이전 사진">‹ 이전</button>
            <span>{index + 1} / {n}</span>
            <button onClick={next} aria-label="다음 사진">다음 ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Shell({ children, onBack, title }) {
  return (
    <>
      <style>{globalCss}</style>
      <div className="shell">
        <div className="shell-bar">
          <button className="btn-ghost" onClick={onBack}>
            ← 홈으로
          </button>
          {title && <div className="shell-title">{title}</div>}
        </div>
        <div className="shell-body">{children}</div>
      </div>
    </>
  );
}

function WriteForm({ name, setName, cardMsg, setCardMsg, sending, submitCard, done }) {
  return (
    <div style={{ padding: "8px 4px 40px", maxWidth: 520, margin: "0 auto" }}>
      {done && (
        <div className="overlay">
          <div className="popup">
            <div className="popup-title">전달되었어요</div>
          </div>
        </div>
      )}
      <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>
        정임님께 따뜻한 응원을 전해 주세요
      </p>
      <label className="field-label">이름 (또는 별명)</label>
      <input
        className="field"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="field-label" style={{ marginTop: 20 }}>전하고 싶은 말</label>
      <textarea
        className="field"
        rows={6}
        placeholder="마음을 담아 적어 주세요"
        value={cardMsg}
        onChange={(e) => setCardMsg(e.target.value)}
      />
      <button
        className="btn-primary"
        style={{ width: "100%", marginTop: 20, opacity: !name.trim() || !cardMsg.trim() || sending ? 0.55 : 1 }}
        disabled={!name.trim() || !cardMsg.trim() || sending}
        onClick={submitCard}
      >
        {sending ? "보내는 중…" : "마음 전하기"}
      </button>
    </div>
  );
}

const globalCss = `
  :root {
    --sage: ${C.sage};
    --sage-deep: ${C.sageDeep};
    --sage-soft: ${C.sageSoft};
    --cream: ${C.cream};
    --cream-deep: ${C.creamDeep};
    --rose: ${C.rose};
    --rose-soft: ${C.roseSoft};
    --coral: ${C.coral};
    --coral-deep: ${C.coralDeep};
    --ink: ${C.ink};
    --muted: ${C.muted};
    --white: ${C.white};
    --line: ${C.line};
    --shadow: ${C.shadow};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--cream);
    color: var(--ink);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 18px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  button { font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  img { max-width: 100%; display: block; }
  em { font-style: normal; color: var(--coral-deep); }

  .site-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(247,243,235,.88);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid transparent;
    transition: border-color .25s, box-shadow .25s;
  }
  .site-header.is-scrolled {
    border-bottom-color: var(--line);
    box-shadow: 0 4px 24px rgba(47,44,40,.06);
  }
  .header-inner {
    max-width: 1080px; margin: 0 auto;
    padding: 14px 22px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .logo {
    border: none; background: transparent; text-align: left;
    display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
  }
  .logo-name {
    font-family: 'Gowun Batang', serif;
    font-size: 22px; font-weight: 700; color: var(--ink);
  }
  .logo-sep { color: var(--sage); font-size: 16px; }
  .logo-tag {
    font-family: 'Gowun Batang', serif;
    font-size: 16px; color: var(--sage-deep);
  }
  .nav-desktop { display: none; gap: 8px; align-items: center; }
  .nav-link {
    border: none; background: transparent;
    color: var(--muted); font-size: 15px; font-weight: 500;
    padding: 10px 12px; border-radius: 999px;
  }
  .nav-link:hover { color: var(--sage-deep); background: var(--sage-soft); }
  .nav-toggle {
    border: 1.5px solid var(--line); background: var(--white);
    color: var(--sage-deep); font-size: 15px; font-weight: 700;
    padding: 10px 16px; border-radius: 999px;
  }
  .nav-mobile {
    display: flex; flex-direction: column; padding: 8px 16px 18px;
    border-top: 1px solid var(--line); background: rgba(247,243,235,.98);
  }
  @media (min-width: 860px) {
    .nav-desktop { display: flex; }
    .nav-toggle, .nav-mobile { display: none !important; }
  }

  .hero {
    position: relative; overflow: hidden;
    padding: 48px 22px 64px;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 20%, rgba(232,196,196,.45), transparent 55%),
      radial-gradient(ellipse 70% 50% at 90% 10%, rgba(122,155,142,.22), transparent 50%),
      linear-gradient(165deg, #F7F3EB 0%, #EFE8DC 45%, #E4EDE8 100%);
  }
  .hero-inner {
    position: relative; max-width: 1080px; margin: 0 auto;
    display: grid; gap: 36px; align-items: center;
  }
  @media (min-width: 860px) {
    .hero { padding: 72px 32px 88px; }
    .hero-inner { grid-template-columns: 1.1fr .9fr; gap: 48px; }
  }
  .eyebrow, .section-eyebrow {
    font-size: 13px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--sage-deep); font-weight: 700; margin-bottom: 14px;
  }
  .hero h1 {
    font-family: 'Gowun Batang', serif;
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 700; line-height: 1.45; color: var(--ink);
    word-break: keep-all; margin-bottom: 18px;
  }
  .hero-sub {
    font-size: 19px; color: var(--muted); line-height: 1.8;
    margin-bottom: 28px; word-break: keep-all;
  }
  .hero-visual { justify-self: center; width: 100%; max-width: 420px; }
  .portrait-frame {
    border-radius: 28px; overflow: hidden;
    box-shadow: var(--shadow);
    border: 6px solid rgba(255,252,247,.9);
    aspect-ratio: 4/5; background: var(--cream-deep);
  }
  .portrait-frame img { width: 100%; height: 100%; object-fit: cover; }
  .portrait-caption {
    text-align: center; margin-top: 14px;
    font-family: 'Gowun Batang', serif;
    font-size: 16px; color: var(--sage-deep);
  }
  .fade-up { animation: fadeUp .7s ease both; }
  .fade-up.delay { animation-delay: .15s; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .btn-primary {
    border: none; border-radius: 999px;
    padding: 16px 28px; font-size: 17px; font-weight: 700;
    color: white;
    background: linear-gradient(135deg, var(--coral), var(--coral-deep));
    box-shadow: 0 10px 28px rgba(181,116,108,.28);
  }
  .btn-soft {
    border: none; border-radius: 999px;
    padding: 14px 22px; font-size: 16px; font-weight: 700;
    color: var(--sage-deep); background: var(--sage-soft);
  }
  .btn-ghost {
    border: 1.5px solid var(--line); border-radius: 999px;
    padding: 14px 22px; font-size: 16px; font-weight: 700;
    color: var(--muted); background: transparent;
  }

  .section { padding: 72px 22px; }
  .section-alt { background: linear-gradient(180deg, var(--cream-deep), var(--cream)); }
  .section-inner { max-width: 960px; margin: 0 auto; }
  .section-title {
    font-family: 'Gowun Batang', serif;
    font-size: clamp(26px, 4vw, 34px);
    font-weight: 700; margin-bottom: 10px; color: var(--ink);
  }
  .section-desc {
    font-size: 18px; color: var(--muted); margin-bottom: 36px; word-break: keep-all;
  }
  .section-cta { text-align: center; margin-top: 36px; }

  .quote-card {
    background: transparent;
    border-radius: 28px; padding: 0;
    box-shadow: none; border: none;
    text-align: center; position: relative;
  }
  .quote-hero {
    position: relative;
    border-radius: 28px;
    overflow: hidden;
    min-height: 420px;
    background-size: cover;
    background-position: center;
    box-shadow: var(--shadow);
    border: 1px solid var(--line);
    display: flex;
    align-items: flex-end;
    animation: quoteFade .55s ease both;
  }
  @media (min-width: 720px) {
    .quote-hero { min-height: 480px; }
  }
  @keyframes quoteFade {
    from { opacity: 0; transform: scale(1.02); }
    to { opacity: 1; transform: scale(1); }
  }
  .quote-veil {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(47,44,40,.18) 0%, rgba(47,44,40,.35) 40%, rgba(47,44,40,.72) 100%);
    pointer-events: none;
  }
  .quote-body {
    position: relative; z-index: 1;
    width: 100%;
    padding: 48px 28px 36px;
    text-align: center;
  }
  .quote-mark {
    font-family: 'Gowun Batang', serif;
    font-size: 56px; line-height: 1; color: rgba(255,252,247,.55);
    margin-bottom: 4px;
  }
  .quote-text {
    font-family: 'Gowun Batang', serif;
    font-size: clamp(20px, 3.2vw, 28px);
    line-height: 1.75; color: #FFFcf7;
    word-break: keep-all; margin: 0 0 18px;
    text-shadow: 0 2px 18px rgba(0,0,0,.35);
  }
  .quote-author {
    font-size: 15px; color: rgba(255,252,247,.88); font-weight: 700;
    letter-spacing: .04em; margin-bottom: 0;
  }
  .quote-credit {
    position: absolute; right: 14px; bottom: 10px; z-index: 2;
    font-size: 11px; color: rgba(255,252,247,.55); letter-spacing: .02em;
  }
  .quote-actions {
    display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
    margin-top: 22px;
  }
  .share-hint {
    margin-top: 16px; font-size: 15px; color: var(--coral-deep); font-weight: 600;
  }

  .chapters { display: flex; flex-direction: column; gap: 40px; }
  .chapter {
    display: grid; gap: 22px; align-items: center;
    background: var(--white); border-radius: 28px; padding: 22px;
    box-shadow: var(--shadow); border: 1px solid var(--line);
  }
  @media (min-width: 760px) {
    .chapter { grid-template-columns: 1.15fr .85fr; padding: 28px; gap: 28px; }
    .chapter.is-reverse .chapter-text { order: 2; }
    .chapter.is-reverse .chapter-photo { order: 1; }
  }
  .chapter-label {
    display: inline-block; font-size: 13px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--coral); margin-bottom: 8px;
  }
  .chapter-text h3 {
    font-family: 'Gowun Batang', serif;
    font-size: 24px; margin-bottom: 14px; line-height: 1.4;
  }
  .chapter-text p {
    font-size: 17px; color: var(--muted); line-height: 1.85; word-break: keep-all;
  }
  .chapter-photo {
    border-radius: 20px; overflow: hidden; aspect-ratio: 4/3;
    background: var(--cream-deep);
  }
  .chapter-photo img { width: 100%; height: 100%; object-fit: cover; }

  .mini-title {
    font-family: 'Gowun Batang', serif;
    font-size: 20px; margin: 40px 0 14px;
  }
  .story-list { display: grid; gap: 10px; }
  .story-chip {
    text-align: left; border: 1px solid var(--line); background: var(--white);
    border-radius: 16px; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .story-chip strong { font-size: 17px; color: var(--ink); }
  .story-chip span { font-size: 14px; color: var(--sage-deep); }

  .gallery-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  }
  @media (min-width: 720px) {
    .gallery-grid { grid-template-columns: repeat(4, 1fr); gap: 18px; }
  }
  .gallery-card {
    background: var(--white); border-radius: 20px; overflow: hidden;
    box-shadow: var(--shadow); border: 1px solid var(--line);
  }
  .gallery-img {
    aspect-ratio: 1; background: var(--cream-deep);
    display: block; width: 100%; border: none; padding: 0; cursor: zoom-in;
  }

  .zoom-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(20,18,16,.98);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 72px 12px 20px;
  }
  .zoom-close {
    position: absolute; top: 16px; right: 16px;
    border: none; border-radius: 999px;
    background: rgba(255,252,247,.95); color: var(--ink);
    font-size: 18px; font-weight: 700; padding: 12px 22px;
  }
  .zoom-img {
    max-width: 100%; max-height: calc(100vh - 220px);
    object-fit: contain; border-radius: 12px;
    animation: quoteFade .3s ease both;
  }
  .zoom-caption { margin-top: 18px; text-align: center; color: #FFFcf7; width: 100%; max-width: 560px; }
  .zoom-caption p { font-size: 18px; line-height: 1.6; word-break: keep-all; margin-bottom: 14px; }
  .zoom-nav { display: flex; align-items: center; justify-content: center; gap: 16px; }
  .zoom-nav span { font-size: 16px; color: rgba(255,252,247,.75); min-width: 60px; }
  .zoom-nav button {
    border: 1.5px solid rgba(255,252,247,.5); border-radius: 999px;
    background: transparent; color: #FFFcf7;
    font-size: 17px; font-weight: 700; padding: 12px 22px;
  }
  .gallery-img img { width: 100%; height: 100%; object-fit: cover; }
  .gallery-card figcaption {
    padding: 12px 14px 14px; font-size: 14px; color: var(--muted);
    line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  .guest-grid { display: grid; gap: 14px; }
  @media (min-width: 720px) { .guest-grid { grid-template-columns: 1fr 1fr; } }
  .guest-card {
    border-radius: 22px; padding: 24px; position: relative;
    box-shadow: var(--shadow); border: 1px solid var(--line);
  }
  .guest-decor { position: absolute; top: 16px; right: 18px; font-size: 22px; opacity: .35; }
  .guest-from { font-weight: 700; font-size: 16px; margin-bottom: 10px; color: var(--ink); }
  .guest-msg { font-size: 17px; line-height: 1.8; color: var(--ink); margin-bottom: 12px; }
  .guest-date { font-size: 13px; color: var(--muted); text-align: right; }
  .empty-box {
    text-align: center; padding: 48px 20px; color: var(--muted);
    background: var(--white); border-radius: 22px; border: 1px dashed var(--line);
    line-height: 1.9;
  }

  .site-footer {
    padding: 36px 22px 48px; text-align: center;
    font-size: 14px; color: var(--muted);
    border-top: 1px solid var(--line);
    background: var(--cream-deep);
  }

  .shell { min-height: 100vh; background: var(--cream); padding-bottom: 40px; }
  .shell-bar {
    position: sticky; top: 0; z-index: 50;
    background: rgba(247,243,235,.92); backdrop-filter: blur(10px);
    padding: 12px 18px; border-bottom: 1px solid var(--line);
    display: flex; align-items: center; gap: 12px;
  }
  .shell-title {
    font-family: 'Gowun Batang', serif; font-size: 18px; font-weight: 700;
  }
  .shell-body { max-width: 560px; margin: 0 auto; }

  .overlay {
    position: fixed; inset: 0; background: rgba(47,44,40,.4);
    z-index: 900; display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .popup {
    background: var(--white); border-radius: 28px; padding: 40px 32px;
    text-align: center; width: 100%; max-width: 320px;
    box-shadow: var(--shadow);
  }
  .popup-title { font-family: 'Gowun Batang', serif; font-size: 22px; font-weight: 700; }
  .popup-sub { margin-top: 8px; color: var(--muted); font-size: 16px; }

  .field-label {
    display: block; font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 8px;
  }
  .field, textarea.field, input.field {
    width: 100%; font-family: inherit; font-size: 17px; color: var(--ink);
    background: var(--white); border: 1.5px solid var(--line);
    border-radius: 16px; padding: 14px 16px; outline: none; resize: none;
    line-height: 1.7; margin-bottom: 4px;
  }
  .field:focus { border-color: var(--sage); box-shadow: 0 0 0 3px rgba(122,155,142,.15); }
  .template-btn {
    text-align: left; border-radius: 16px; padding: 16px 18px;
    border: 1.5px solid; display: flex; flex-direction: column; gap: 6px;
    font-size: 16px; line-height: 1.6;
  }
`;
