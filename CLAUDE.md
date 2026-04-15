# LAW.OS — Claude Code 작업 규칙

> **🇰🇷 언어**: 항상 **한국어**로 응답
> **Priority**: 이 파일의 규칙은 모든 작업에 예외 없이 적용됩니다.

---

## 🔴 1순위 철칙 — 디자인 우선 + Stitch 100% 일치

### 작업 순서 (Hard Gate)
```
1. Stitch 시안 확인 (mcp__stitch__get_screen)
2. 정적 UI 구현 (mock 데이터, 로딩/빈/에러 모두)
3. Pixel parity 검증
4. 🛑 사용자 컨펌 대기
5. (컨펌 후) 로직 연결
```

### 절대 금지
- ❌ Stitch 시안과 다른 색/간격/폰트/레이아웃
- ❌ 디자인 토큰 외 하드코딩된 스타일 값
- ❌ 사용자 컨펌 없이 API/로직 연결
- ❌ "더 나아 보여서" 식 즉흥적 개선
- ❌ 디자인 PR과 로직 PR 합치기

**상세**: [`docs/design-workflow.md`](./docs/design-workflow.md)

---

## 📚 필수 참조 문서 (작업 시작 전 읽기)

| 상황 | 문서 |
|------|------|
| 모든 작업 | [`docs/design-workflow.md`](./docs/design-workflow.md) |
| 기술 스택 결정 | [`docs/tech-stack.md`](./docs/tech-stack.md) |
| DB 작업 | [`docs/data-model.md`](./docs/data-model.md) |
| API 작업 | [`docs/api-spec.md`](./docs/api-spec.md) |
| LLM/RAG 작업 | [`docs/rag-pipeline.md`](./docs/rag-pipeline.md) |
| 에러/상태 처리 | [`docs/state-flows.md`](./docs/state-flows.md) |
| 법적 리스크 | [`docs/legal-ux.md`](./docs/legal-ux.md) |
| 완료 판정 | [`docs/dod.md`](./docs/dod.md) |
| 환경 세팅 | [`docs/dev-setup.md`](./docs/dev-setup.md) |
| 제품 요구사항 | [`docs/prd.md`](./docs/prd.md) |
| 기능 명세 | [`docs/feature-spec.md`](./docs/feature-spec.md) |

---

## 🎨 Stitch 프로젝트

| 프로젝트 | ID |
|---------|-----|
| 모바일 앱 + 관리자 | `7657386961511176864` |
| 랜딩 페이지 | `5047194537981448179` |

```bash
# 화면 목록
mcp__stitch__list_screens project_id=7657386961511176864

# 화면 상세
mcp__stitch__get_screen project_id=7657386961511176864 screen_id=<id>
```

---

## 🔴 변호사법 리스크

LAW.OS는 **법학 학습 도구**이며 법률 상담이 아님. 개인 사건 조언 요청은 차단한다.
상세: [`docs/legal-ux.md`](./docs/legal-ux.md)

---

## ✅ 모든 작업 완료 판정

[`docs/dod.md`](./docs/dod.md)의 체크리스트 100% 통과 시에만 "완료".
- TaskList의 모든 항목이 completed
- CI 통과
- 디자인 작업은 사용자 컨펌 필수
