import { useEffect, useRef, useState } from "react";
import {
  subscribeAlbum,
  uploadAlbumPhoto,
  updateAlbumPhoto,
  deleteAlbumPhoto,
  isFamilyUnlocked,
} from "./firebase.js";
import FamilyGate from "./FamilyGate.jsx";

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

export default function AlbumTab() {
  const [photos, setPhotos] = useState([]);
  const [sort, setSort] = useState("newest"); // newest | period
  const [view, setView] = useState("list"); // list | upload | edit | detail
  const [selected, setSelected] = useState(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [form, setForm] = useState({ title: "", period: "", story: "" });
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    return subscribeAlbum(setPhotos);
  }, []);

  const requireFamily = (action) => {
    if (isFamilyUnlocked()) {
      action();
      return;
    }
    setPendingAction(() => action);
    setGateOpen(true);
  };

  const sorted = [...photos].sort((a, b) => {
    if (sort === "period") {
      const pa = a.period || "";
      const pb = b.period || "";
      if (pa !== pb) return pa.localeCompare(pb, "ko");
    }
    const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
    const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
    return tb - ta;
  });

  const startUpload = () =>
    requireFamily(() => {
      setForm({ title: "", period: "", story: "" });
      setFiles([]);
      setProgress("");
      setView("upload");
    });

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setFiles(list);
    e.target.value = "";
  };

  const doUpload = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(`사진 ${i + 1}장 / 모두 ${files.length}장 올리는 중…`);
        await uploadAlbumPhoto({
          file: f,
          title: files.length === 1 ? form.title : form.title || "",
          period: form.period,
          story: files.length === 1 ? form.story : "",
          onProgress: (pct) =>
            setProgress(`사진 ${i + 1}장 / 모두 ${files.length}장 — ${pct}% 완료`),
        });
      }
      setProgress("다 올렸어요! 참 잘하셨어요.");
      setTimeout(() => {
        setView("list");
        setProgress("");
        setFiles([]);
      }, 1200);
    } catch (e) {
      console.error(e);
      setProgress(e.message || "올리기에 실패했어요. 잠시 뒤 다시 해 주세요.");
    }
    setBusy(false);
  };

  const openDetail = (p) => {
    setSelected(p);
    setView("detail");
    setConfirmDelete(false);
  };

  const startEdit = () =>
    requireFamily(() => {
      setForm({
        title: selected.title || "",
        period: selected.period || "",
        story: selected.story || "",
      });
      setView("edit");
    });

  const saveEdit = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await updateAlbumPhoto(selected.id, form);
      setSelected({ ...selected, ...form });
      setView("detail");
    } catch (e) {
      alert("저장에 실패했어요. 네트워크를 확인해 주세요.");
    }
    setBusy(false);
  };

  const doDelete = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await deleteAlbumPhoto(selected);
      setConfirmDelete(false);
      setSelected(null);
      setView("list");
    } catch (e) {
      alert("삭제에 실패했어요.");
    }
    setBusy(false);
  };

  return (
    <div style={{ padding: "28px 20px" }}>
      <FamilyGate
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setPendingAction(null);
        }}
        onUnlocked={() => pendingAction?.()}
        title="사진 올리기·수정은 가족만"
      />

      {view === "list" && (
        <>
          <div
            style={{
              fontFamily: "'Nanum Myeongjo',serif",
              fontSize: "26px",
              fontWeight: "800",
              textAlign: "center",
              color: "#2C2C2C",
              marginBottom: "8px",
            }}
          >
            📸 추억의 사진첩
          </div>
          <div style={{ textAlign: "center", fontSize: "17px", color: "#888", marginBottom: "22px", lineHeight: 1.7 }}>
            사진을 올리고, 그때 이야기를 남겨 보세요
          </div>

          <button onClick={startUpload} style={{ ...primaryBtn(true), marginBottom: "14px" }}>
            📷 사진 올리기
          </button>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[
              ["newest", "올린 순서"],
              ["period", "시기별"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSort(id)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  border: sort === id ? "2.5px solid #FF6B6B" : "2.5px solid #E8D5CE",
                  background: sort === id ? "#FFF0EC" : "white",
                  fontSize: "16px",
                  fontWeight: "800",
                  color: sort === id ? "#D94F4F" : "#888",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "#999" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>🖼️</div>
              <div style={{ fontSize: "18px", lineHeight: 1.9 }}>
                아직 올린 사진이 없어요
                <br />
                위의 &apos;사진 올리기&apos;를 눌러 보세요
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {sorted.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openDetail(p)}
                  style={{
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    textAlign: "left",
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,.08)",
                  }}
                >
                  <div style={{ aspectRatio: "1", background: "#f0ece8" }}>
                    <img src={p.url} alt={p.title || "추억 사진"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ padding: "12px", background: "white" }}>
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#2C2C2C", lineHeight: 1.4 }}>
                      {p.title || "제목 없는 사진"}
                    </div>
                    {p.period && (
                      <div style={{ fontSize: "13px", color: "#D94F4F", marginTop: "4px", fontWeight: "700" }}>
                        {p.period}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {view === "upload" && (
        <>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", textAlign: "center", marginBottom: "20px" }}>
            📷 사진 올리기
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            style={{ display: "none" }}
            onChange={onPickFiles}
          />
          <button onClick={() => fileRef.current?.click()} style={{ ...primaryBtn(true), marginBottom: "12px" }}>
            사진 고르기 / 카메라로 찍기
          </button>
          {files.length > 0 && (
            <div style={{ fontSize: "17px", color: "#D94F4F", fontWeight: "700", marginBottom: "16px", textAlign: "center" }}>
              {files.length}장의 사진을 골랐어요
            </div>
          )}

          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>사진 제목 (선택)</label>
          <input placeholder="예) 가족들과 함께한 봄날" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ marginBottom: "16px" }} />

          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>촬영 시기 (선택)</label>
          <input placeholder="예) 1970년대쯤, 결혼하고 얼마 뒤" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} style={{ marginBottom: "16px" }} />

          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>사진에 담긴 이야기 (선택)</label>
          <textarea rows={4} placeholder="그날의 이야기를 적어 보세요" value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} style={{ marginBottom: "18px" }} />

          {progress && (
            <div style={{ background: "#FFF0EC", borderRadius: "16px", padding: "16px", fontSize: "17px", color: "#D94F4F", fontWeight: "700", marginBottom: "14px", lineHeight: 1.6 }}>
              {progress}
            </div>
          )}

          <button onClick={doUpload} disabled={!files.length || busy} style={{ ...primaryBtn(files.length && !busy), marginBottom: "10px" }}>
            {busy ? "올리는 중…" : "사진 저장하기"}
          </button>
          <button onClick={() => setView("list")} style={secondaryBtn} disabled={busy}>
            뒤로 가기
          </button>
        </>
      )}

      {view === "detail" && selected && (
        <>
          <div style={{ borderRadius: "24px", overflow: "hidden", background: "#f0ece8", marginBottom: "16px" }}>
            <img src={selected.url} alt="" style={{ width: "100%", display: "block" }} />
          </div>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", marginBottom: "8px", lineHeight: 1.4 }}>
            {selected.title || "제목 없는 사진"}
          </div>
          {selected.period && (
            <div style={{ fontSize: "16px", color: "#D94F4F", fontWeight: "700", marginBottom: "12px" }}>📅 {selected.period}</div>
          )}
          {selected.story && (
            <div style={{ fontSize: "18px", color: "#444", lineHeight: 1.85, marginBottom: "20px", whiteSpace: "pre-wrap" }}>
              {selected.story}
            </div>
          )}
          {!selected.story && (
            <div style={{ fontSize: "16px", color: "#bbb", marginBottom: "20px" }}>아직 이야기가 없어요. 수정에서 적을 수 있어요.</div>
          )}

          <button onClick={startEdit} style={{ ...primaryBtn(true), marginBottom: "10px" }}>
            ✏️ 제목·이야기 수정
          </button>
          <button
            onClick={() => requireFamily(() => setConfirmDelete(true))}
            style={{ ...secondaryBtn, color: "#D94F4F", borderColor: "#F5C6C6", marginBottom: "10px" }}
          >
            사진 삭제하기
          </button>
          <button onClick={() => setView("list")} style={secondaryBtn}>
            목록으로
          </button>

          {confirmDelete && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.45)",
                zIndex: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <div style={{ background: "white", borderRadius: "28px", padding: "32px 28px", width: "100%", maxWidth: "320px" }}>
                <div style={{ fontSize: "22px", fontWeight: "800", textAlign: "center", lineHeight: 1.5 }}>
                  정말 이 사진을
                  <br />
                  지울까요?
                </div>
                <div style={{ fontSize: "16px", color: "#888", textAlign: "center", marginTop: "12px", lineHeight: 1.6 }}>
                  지우면 다시 되돌리기 어려워요
                </div>
                <button onClick={doDelete} disabled={busy} style={{ ...primaryBtn(true), marginTop: "22px", background: "linear-gradient(135deg,#D94F4F,#FF6B6B)" }}>
                  네, 지울게요
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ ...secondaryBtn, marginTop: "10px" }}>
                  아니요, 남겨둘게요
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {view === "edit" && selected && (
        <>
          <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: "24px", fontWeight: "800", textAlign: "center", marginBottom: "20px" }}>
            ✏️ 사진 정보 수정
          </div>
          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>사진 제목</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ marginBottom: "16px" }} />
          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>촬영 시기</label>
          <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} style={{ marginBottom: "16px" }} />
          <label style={{ display: "block", fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>이야기</label>
          <textarea rows={5} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} style={{ marginBottom: "18px" }} />
          <button onClick={saveEdit} disabled={busy} style={{ ...primaryBtn(!busy), marginBottom: "10px" }}>
            {busy ? "저장 중…" : "저장하기"}
          </button>
          <button onClick={() => setView("detail")} style={secondaryBtn}>
            취소
          </button>
        </>
      )}
    </div>
  );
}
