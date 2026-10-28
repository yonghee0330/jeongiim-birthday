import { useEffect, useRef, useState } from "react";

// 임영웅 노래 목록 (유튜브 영상 ID). 재생이 막힌 영상은 자동으로 건너뜁니다.
// 곡을 바꾸려면 이 목록만 고치면 됩니다.
const SONGS = [
  "oQW9lY1ZAJA", // 별빛 같은 나의 사랑아
  "horFR5HoxZ0", // 우리들의 블루스
  "sHqFqWDviBg", // 다시 만날 수 있을까
  "AUP3Dau4BEs", // 다시 만날 수 있을까
  "xwSyicR1XDA", // 우리들의 블루스 (오디오)
  "zwmESLAuO4c", // London Boy
  "Zeh6z_Vh8JE", // 다시 만날 수 있을까 (무대)
];

// 유튜브 재생목록 ID(list=...)를 넣으면 위 목록 대신 그 재생목록을 섞어서 재생합니다.
const PLAYLIST_ID = "";

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
}

export default function MusicPlayer() {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      const order = shuffled(SONGS);
      playerRef.current = new YT.Player("yt-music", {
        width: 200,
        height: 200,
        videoId: PLAYLIST_ID ? undefined : order[0],
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          ...(PLAYLIST_ID
            ? { listType: "playlist", list: PLAYLIST_ID }
            : { playlist: order.slice(1).join(",") }),
        },
        events: {
          onReady: (e) => {
            const p = e.target;
            p.setLoop(true);
            if (PLAYLIST_ID) {
              p.setShuffle(true);
              p.playVideoAt(0);
            }
            p.playVideo();
            setReady(true);
          },
          onStateChange: (e) => {
            const data = e.target.getVideoData && e.target.getVideoData();
            if (data && data.title) setTitle(data.title);
          },
          // 퍼가기 금지·삭제된 영상이면 다음 곡으로
          onError: (e) => e.target.nextVideo(),
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
    };
  }, []);

  const toggleSound = () => {
    const p = playerRef.current;
    if (!p) return;
    if (soundOn) {
      p.mute();
    } else {
      p.unMute();
      p.setVolume(80);
      p.playVideo();
    }
    setSoundOn(!soundOn);
  };

  const nextSong = () => {
    const p = playerRef.current;
    if (p) p.nextVideo();
  };

  const shortTitle = title
    .replace(/\[[^\]]*\]|\([^)]*\)|MV|M\/V|Official|OFFICIAL|Audio/gi, "")
    .replace(/임영웅|Lim Young[- ]?Woong/gi, "")
    .replace(/[_\-–|:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <>
      <div className="yt-hidden" aria-hidden="true">
        <div id="yt-music" />
      </div>

      <div className={`music-bar ${soundOn ? "is-on" : ""}`}>
        <div className="music-info">
          <span className="music-note">{soundOn ? "♪" : "🎵"}</span>
          <span className="music-text">
            <span className="music-label">임영웅 노래</span>
            <span className="music-title">
              {soundOn ? shortTitle || "재생 중" : ready ? "소리를 켜 보세요" : "준비 중…"}
            </span>
          </span>
        </div>
        {soundOn && (
          <button className="music-btn music-next" onClick={nextSong} aria-label="다음 곡">
            다음 곡
          </button>
        )}
        <button className="music-btn music-toggle" onClick={toggleSound} disabled={!ready}>
          {soundOn ? "🔇 끄기" : "🔊 소리 켜기"}
        </button>
      </div>

      <style>{musicCss}</style>
    </>
  );
}

const musicCss = `
  .yt-hidden {
    position: fixed; left: -9999px; top: 0;
    width: 200px; height: 200px; overflow: hidden;
    pointer-events: none;
  }
  .music-bar {
    position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%);
    z-index: 800;
    width: calc(100% - 24px); max-width: 520px;
    display: flex; align-items: center; gap: 8px;
    padding: 10px 10px 10px 18px;
    background: rgba(255,252,247,.97);
    border: 1.5px solid rgba(122,155,142,.35);
    border-radius: 999px;
    box-shadow: 0 10px 30px rgba(47,44,40,.16);
  }
  .music-bar.is-on {
    background: linear-gradient(135deg, #C98B84, #B5746C);
    border-color: transparent;
  }
  .music-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
  .music-note { font-size: 22px; }
  .music-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
  .music-label { font-size: 12px; font-weight: 700; color: #5F7F72; }
  .music-title {
    font-size: 16px; font-weight: 700; color: #2F2C28;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .music-bar.is-on .music-label { color: rgba(255,255,255,.85); }
  .music-bar.is-on .music-title { color: #fff; }
  .music-btn {
    flex-shrink: 0; border: none; border-radius: 999px;
    font-size: 16px; font-weight: 700; padding: 12px 16px;
  }
  .music-toggle { background: #B5746C; color: #fff; }
  .music-toggle:disabled { opacity: .5; }
  .music-bar.is-on .music-toggle,
  .music-bar.is-on .music-next { background: rgba(255,255,255,.22); color: #fff; }
  .site-footer { padding-bottom: 110px !important; }
  .shell { padding-bottom: 110px !important; }
`;
