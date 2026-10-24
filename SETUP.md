# 사진첩 · 인생 기록장 — Firebase 설정 안내

코드 배포만으로는 Storage·인증·AI가 열리지 않습니다.  
아래를 **Firebase 콘솔**에서 한 번씩 켜 주세요. (프로젝트: `jeongiim-birthday`)

## 1. Authentication

1. **Build → Authentication → Get started**
2. **Sign-in method → Anonymous** → 사용 설정

가족 비밀번호를 맞춘 뒤 익명 로그인으로 사진/이야기를 저장합니다.

## 2. Storage

1. **Build → Storage → Get started**
2. 이 저장소의 `storage.rules` 내용을 콘솔 Rules에 붙여넣고 **게시**
3. 기본 버킷이 `jeongiim-birthday.firebasestorage.app` 인지 확인

## 3. Firestore 규칙

1. **Firestore → Rules**
2. 이 저장소의 `firestore.rules` 내용을 붙여넣고 **게시**
3. (선택) **Firestore → 문서 추가**
   - 컬렉션: `settings`
   - 문서 ID: `access`
   - 필드: `pin` (string) = 가족이 쓸 비밀번호  
   - 없으면 앱 기본값 **`2026`** 이 사용됩니다. 꼭 바꿔 주세요.

## 4. Gemini (AI 질문·글 다듬기)

1. Firebase 콘솔 → **Build → AI** 또는 Google AI / Gemini 연동 안내 따라 사용 설정  
2. 또는 [Google AI Studio](https://aistudio.google.com/)에서 같은 Google 클라우드 프로젝트에 Gemini API 사용 설정  
3. 미설정이어도 사이트는 동작합니다. 이때는 **미리 정해 둔 질문 + 기본 글 정리**로 동작합니다.

## 5. 배포

```bash
cd birthday-site
git add .
git commit -m "feat: 추억 사진첩과 인생 기록장"
git push
```

GitHub Actions가 끝나면 https://유정임.kr 새로고침.

## 6. 어머니 휴대폰에서 확인

| 항목 | 확인 |
|------|------|
| 사진 올리기 | 가족 비밀번호 → 사진 고르기 → 저장 후 다른 기기에서 보이는지 |
| 말로 이야기하기 | Chrome 또는 Safari, 마이크 허용 |
| 이야기 저장 | 미리보기 → 이대로 저장 → 목록에 나타나는지 |
| 기존 기능 | 홈 슬라이드·축하카드·BGM 그대로인지 |

## 보안 참고

- 가족 PIN은 어르신용으로 단순합니다. PIN을 아는 사람만 쓰도록 가족끼리만 공유하세요.
- API 키를 프론트에 새로 넣지 않았습니다. Gemini는 Firebase AI 경로를 씁니다.
- 원본 발화(`rawQa`)와 다듬은 글(`body`)을 Firestore에 함께 보관합니다.
