import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBO8cbq0SQliWjvlzztTg05NNua6oj5C8A",
  authDomain: "jeongiim-birthday.firebaseapp.com",
  projectId: "jeongiim-birthday",
  storageBucket: "jeongiim-birthday.firebasestorage.app",
  messagingSenderId: "365127339752",
  appId: "1:365127339752:web:387b0c90b37c2b5171435d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 카드 저장
export async function addCard({ name, msg, date, color, decor, createdAt }) {
  await addDoc(collection(db, "cards"), {
    name,
    message: msg,
    date,
    color,
    decor,
    createdAt
  });
}

// 카드 불러오기
export async function loadCards() {
  const q = query(collection(db, "cards"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 카드 실시간 구독

export function subscribeCards(callback) {
  const q = query(collection(db, "cards"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(cards);
  });
}