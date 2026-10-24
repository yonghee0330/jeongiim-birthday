import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBO8cbq0SQliWjvlzztTg05NNua6oj5C8A",
  authDomain: "jeongiim-birthday.firebaseapp.com",
  projectId: "jeongiim-birthday",
  storageBucket: "jeongiim-birthday.firebasestorage.app",
  messagingSenderId: "365127339752",
  appId: "1:365127339752:web:387b0c90b37c2b5171435d",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

const FAMILY_SESSION_KEY = "jeongiim_family_ok";
/** 콘솔 settings/access.pin 이 없을 때 쓰는 기본값 — SETUP.md 참고 */
const DEFAULT_FAMILY_PIN = "2026";

export function isFamilyUnlocked() {
  return sessionStorage.getItem(FAMILY_SESSION_KEY) === "1";
}

export function lockFamily() {
  sessionStorage.removeItem(FAMILY_SESSION_KEY);
}

export async function ensureAnonAuth() {
  if (auth.currentUser) return auth.currentUser;
  await signInAnonymously(auth);
  return auth.currentUser;
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function unlockFamily(pin) {
  const trimmed = String(pin || "").trim();
  if (!trimmed) return { ok: false, message: "비밀번호를 입력해 주세요." };

  let expected = DEFAULT_FAMILY_PIN;
  try {
    const snap = await getDoc(doc(db, "settings", "access"));
    if (snap.exists() && snap.data().pin) expected = String(snap.data().pin);
  } catch (e) {
    console.warn("settings/access 읽기 실패, 기본 PIN 사용:", e);
  }

  if (trimmed !== expected) {
    return { ok: false, message: "비밀번호가 맞지 않아요. 다시 입력해 주세요." };
  }

  try {
    await ensureAnonAuth();
  } catch (e) {
    console.warn("익명 로그인 실패(규칙은 콘솔에서 확인):", e);
  }

  sessionStorage.setItem(FAMILY_SESSION_KEY, "1");
  return { ok: true };
}

// ─── 축하 카드 (기존) ─────────────────────────────────────────

export async function addCard({ name, msg, date, color, decor, createdAt }) {
  await addDoc(collection(db, "cards"), {
    name,
    message: msg,
    date,
    color,
    decor,
    createdAt,
  });
}

export async function loadCards() {
  const q = query(collection(db, "cards"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeCards(callback) {
  const q = query(collection(db, "cards"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const cards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(cards);
  });
}

// ─── 사진첩 ───────────────────────────────────────────────────

function compressImage(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("사진 파일만 올릴 수 있어요."));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error("사진 준비에 실패했어요."));
          else resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽을 수 없어요."));
    };
    img.src = url;
  });
}

export function subscribeAlbum(callback) {
  const q = query(collection(db, "albumPhotos"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error(err);
      callback([]);
    }
  );
}

/**
 * @param {{ file: File, title?: string, period?: string, story?: string, onProgress?: (pct:number)=>void }} opts
 */
export async function uploadAlbumPhoto({ file, title = "", period = "", story = "", onProgress }) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("사진이 너무 커요. 20MB 이하로 올려 주세요.");
  }
  const blob = await compressImage(file);
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `album/${id}.jpg`;
  const storageRef = ref(storage, storagePath);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, { contentType: "image/jpeg" });
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      resolve
    );
  });

  const url = await getDownloadURL(storageRef);
  const docRef = await addDoc(collection(db, "albumPhotos"), {
    title: title.trim(),
    period: period.trim(),
    story: story.trim(),
    url,
    storagePath,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAlbumPhoto(id, { title, period, story }) {
  await updateDoc(doc(db, "albumPhotos", id), {
    title: (title || "").trim(),
    period: (period || "").trim(),
    story: (story || "").trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAlbumPhoto(photo) {
  if (photo.storagePath) {
    try {
      await deleteObject(ref(storage, photo.storagePath));
    } catch (e) {
      console.warn("Storage 삭제 실패(문서는 지웁니다):", e);
    }
  }
  await deleteDoc(doc(db, "albumPhotos", photo.id));
}

// ─── 인생 기록장 ──────────────────────────────────────────────

export function subscribeStories(callback) {
  const q = query(collection(db, "lifeStories"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error(err);
      callback([]);
    }
  );
}

export async function saveStory(story) {
  const payload = {
    themeId: story.themeId,
    themeLabel: story.themeLabel,
    title: story.title,
    body: story.body,
    rawQa: story.rawQa || [],
    photoIds: story.photoIds || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (story.id) {
    const { createdAt, ...rest } = payload;
    await updateDoc(doc(db, "lifeStories", story.id), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
    return story.id;
  }
  const refDoc = await addDoc(collection(db, "lifeStories"), payload);
  return refDoc.id;
}

export async function deleteStory(id) {
  await deleteDoc(doc(db, "lifeStories", id));
}

export async function saveDraft(draftId, data) {
  const id = draftId || `draft_${Date.now()}`;
  await setDoc(
    doc(db, "lifeDrafts", id),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return id;
}

export async function loadDraft(draftId) {
  const snap = await getDoc(doc(db, "lifeDrafts", draftId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function deleteDraft(draftId) {
  await deleteDoc(doc(db, "lifeDrafts", draftId));
}

export function subscribeDrafts(callback) {
  const q = query(collection(db, "lifeDrafts"), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    () => callback([])
  );
}
