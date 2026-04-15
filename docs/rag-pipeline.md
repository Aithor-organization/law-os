# LAW.OS — RAG Pipeline

> **Version**: 1.0
> **Vector Store**: pgvector (Supabase Postgres 15)
> **Embedding Model**: OpenAI text-embedding-3-large (3072 dim)
> **Reranker**: Cohere Rerank-3.5
> **LLM**: Claude Sonnet 4.5 / Opus 4.6

---

## 파이프라인 개요

```
[법령/판례 원천]
      ↓
  수집 (Ingestion) — 국가법령정보센터 API + 대법원 종합법률정보
      ↓
  청킹 (Chunking) — 조문/판례 단위
      ↓
  임베딩 (Embedding) — OpenAI 3-large
      ↓
  저장 (Storage) — pgvector + BM25 full-text index
      ↓
─── 검색 단계 ───
      ↓
  쿼리 확장 (Query Expansion) — LLM 기반 선택적
      ↓
  하이브리드 검색 (Hybrid) — BM25 + Vector (RRF fusion)
      ↓
  재랭킹 (Rerank) — Cohere Rerank-3.5
      ↓
  프롬프트 주입 (Prompt) — Citation-required 템플릿
      ↓
  LLM 생성 (Generation) — 스트리밍 응답
      ↓
  Citation 추출 & 검증 (Post-process)
```

---

## 1. 수집 (Ingestion)

### 1.1 데이터 소스

| 소스 | 종류 | 빈도 | 저장 위치 |
|------|------|------|----------|
| 국가법령정보센터 OpenAPI | 민법/형법/헌법/상법 조문 | 일 1회 cron | `statutes` |
| 대법원 종합법률정보 | 판례 전문 | 주 1회 cron | `cases` |
| 헌법재판소 결정례 | 결정문 | 주 1회 cron | `cases` (court="constitutional") |

### 1.2 동기화 전략

```
QStash cron → worker
  ↓
  1. 법령 목록 조회 (API)
  2. 각 법령의 lastModified 체크
  3. textHash 비교 → 변경된 조문만 업데이트
  4. 신규 조문 → 임베딩 생성 → insert
  5. 변경 조문 → 임베딩 재생성 → update
```

### 1.3 Rate Limiting & Backoff

- 국가법령정보센터 API: 1,000 req/day 제한
- 429 응답 → exponential backoff (1s → 2s → 4s → 8s, max 5회)
- 실패 시 Sentry 알림 + 다음 cron에서 재시도

---

## 2. 청킹 (Chunking)

### 2.1 조문 (Statute)

**전략**: **1 article = 1 chunk** (분할하지 않음)

이유:
- 법학에서 조문은 **최소 인용 단위** — 분할 시 문맥 손실
- 평균 조문 길이 약 200자 — 임베딩 한계 내
- 긴 조문(>2000자)은 예외적으로 `항(項)` 단위로 분할

```ts
interface StatuteChunk {
  id: string;                 // "civil-750" or "civil-750-1" (항 분할)
  code: string;
  articleNo: string;
  title: string | null;
  text: string;
  metadata: {
    part: string | null;
    chapter: string | null;
    section: string | null;
  };
}
```

### 2.2 판례 (Case)

**전략**: **3개 필드 분리 임베딩**
- `summary` (요지) — 검색 우선순위 1
- `judgmentPoints` (판시사항) — 검색 우선순위 2
- `fullText` (전문) — 필요 시 fallback

각 필드를 별도 벡터로 저장하고, 검색 시 결합.

**긴 fullText 처리**: 8K 토큰 초과 시 **sliding window 512 토큰, overlap 64 토큰**으로 청킹. 청크 ID: `{caseId}_full_{offset}`

---

## 3. 임베딩 (Embedding)

### 3.1 모델
- **OpenAI text-embedding-3-large**
- 차원: 3072
- 이유: 한국어 품질 + 저비용 + Matryoshka representation 지원

### 3.2 한국어 전처리
- **공백 정규화**: 연속 공백 → 단일 공백
- **전각 → 반각** 변환
- **조문 번호 정규화**: "750조" / "제750조" / "750 조" → `제750조`
- **사건번호 정규화**: "2018다 12345" → `2018다12345`

### 3.3 배치 처리
- OpenAI API batch: 100개/요청
- 비용: ~$0.13 / 1M tokens
- 초기 전체 인덱싱 추정: 12,847 statutes + 2,341 cases × 3 fields = ~20K 임베딩 → **약 $5**

---

## 4. 저장 (Storage)

### 4.1 pgvector 인덱스

```sql
-- 조문
create index statutes_embedding_idx
  on statutes using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 판례 (summary, judgment_points, full_text 각각)
create index cases_summary_embedding_idx
  on case_embeddings (summary_embedding vector_cosine_ops)
  with (lists = 100);
```

**IVFFlat 파라미터**:
- `lists = sqrt(N)` — 15K rows → lists=100 정도
- `probes = 10` (검색 시) — 정확도/속도 트레이드오프
- 1M+ 로우 도달 시 **HNSW**로 전환

### 4.2 BM25 (Full-Text Search)

Postgres `tsvector` 사용:
```sql
alter table statutes add column text_tsv tsvector
  generated always as (to_tsvector('simple', text)) stored;
create index statutes_tsv_idx on statutes using gin (text_tsv);
```

한국어 tokenizer는 별도: **mecab-ko** 또는 **Postgres 기본 simple** (초기 MVP는 simple로 충분).

---

## 5. 쿼리 확장 (Optional)

복잡한 질문에만 적용:
```
User: "집주인이 보증금 안 돌려주면 어떻게 해?"
  ↓ Claude Haiku (저비용)
Expanded:
  - "임대차 보증금 반환 청구"
  - "임대인 보증금 반환 의무"
  - "주택임대차보호법 보증금"
```

**트리거 조건**:
- 질문이 법률 용어를 포함하지 않음
- 첫 번째 검색 결과 top-k 점수가 임계값(0.6) 미만

---

## 6. 하이브리드 검색

### 6.1 RRF (Reciprocal Rank Fusion)

```
score(doc) = Σ 1 / (k + rank_i(doc))
  i
```
- `k = 60` (표준)
- `rank_i`: BM25 순위, Vector 순위 각각

### 6.2 단계별 k

| 단계 | k | 목적 |
|------|---|------|
| BM25 retrieval | 50 | 키워드 기반 후보 |
| Vector retrieval | 50 | 의미 기반 후보 |
| RRF fusion → top | 20 | 재랭킹 입력 |
| Cohere Rerank → top | 5 | 최종 컨텍스트 |

### 6.3 메타데이터 필터
질문에서 법령 코드가 감지되면 사전 필터링:
- "민법" 언급 → `code = 'civil'` 필터
- "형법 250조" → `code='criminal' AND article_no_int=250` 정확 매칭

---

## 7. 재랭킹

### 7.1 Cohere Rerank-3.5
```ts
const reranked = await cohere.rerank({
  model: "rerank-multilingual-v3.0",
  query: userQuestion,
  documents: candidates.map(c => c.text),
  topN: 5,
  returnDocuments: false,
});
```

- 한국어 지원: multilingual-v3.0 사용
- 비용: $2 / 1K searches
- 임계값: score < 0.3 → 컨텍스트에서 제외

---

## 8. 프롬프트 템플릿

### 8.1 시스템 프롬프트 (일반 채팅)

```
당신은 한국 법학도를 위한 AI 학습 튜터입니다.

규칙:
1. 모든 답변은 제공된 컨텍스트(조문/판례)를 근거로 작성합니다.
2. 컨텍스트에 없는 내용은 "해당 내용은 제가 확인할 수 없습니다"라고 답합니다.
3. 모든 주장에 출처를 명시합니다. 형식: [민법 제750조] 또는 [대법원 2018다12345]
4. 이것은 법률 상담이 아닌 학습 도구입니다. 실제 분쟁은 변호사와 상의하세요.
5. 한국어로 답변하며, 법률 용어는 정확히 사용합니다.

== 컨텍스트 ==
{{retrieved_context}}

== 사용자 질문 ==
{{user_question}}
```

### 8.2 컨텍스트 포맷
```
[조문 1] 민법 제750조 (불법행위의 내용)
고의 또는 과실로 인한 위법행위로 타인에게 손해를 가한 자는 그 손해를 배상할 책임이 있다.

[판례 1] 대법원 2018다12345 (2020-03-15 선고)
요지: 불법행위의 성립요건은 ...
```

### 8.3 Citation 강제 메커니즘
- 응답에 `[조문 N]` 또는 `[판례 N]` 패턴이 없으면 → 후처리에서 경고 + 재생성
- 3회 재생성 실패 시 → 에러 반환

---

## 9. Deep Debate 프롬프트

### 9.1 공유 시스템 프롬프트
```
당신은 4인 법률 토론 패널의 한 명입니다. 각자 역할에 충실하게 논거를 제시하되,
모든 주장은 제공된 컨텍스트를 근거로 합니다.
```

### 9.2 역할별 추가 지시

**Plaintiff (원고측)**
```
역할: 원고/청구인의 입장에서 가장 강한 논거 구성
우선 인용: 권리 보호 판례, 기본권, 손해배상 법리
금지: 피고 측 방어 논리 전개
```

**Defendant (피고측)**
```
역할: 피고의 입장에서 방어/반박 논거 구성
우선 인용: 면책사유, 항변권, 절차적 하자
금지: 원고 측 청구 논리 전개
```

**Judge (재판관)**
```
역할: 양측 논거를 중립적으로 평가
우선 인용: 대법원 전원합의체, 헌법재판소, 통설
출력: 합리적 결론 + 근거 판례
```

**Narrator (해설자)**
```
역할: 토론 전체를 학습자용으로 요약
출력 형식:
  1. 핵심 쟁점 3줄
  2. 양측 논거 비교표
  3. 결론
  4. 추가 학습 자료 (관련 조문/판례)
```

### 9.3 LangGraph 상태머신
```ts
State = {
  question: string;
  context: RetrievedContext[];
  round: number;
  messages: Array<{ agent: AgentId; content: string; }>;
  final?: string;
};

// Nodes: narrator_intro → plaintiff → defendant → (plaintiff_rebut → defendant_rebut) → judge → narrator_summary
```

---

## 10. Post-processing

### 10.1 Citation 추출
정규식: `/\[(조문|판례)\s*(\d+)\]/g`

추출된 번호로 context에서 원본 lookup → DB의 `Citation` 레코드로 저장.

### 10.2 Guardrails
- **PII 누출 방지**: 응답에 이메일/전화번호 패턴 감지 → 마스킹
- **법률 상담 차단**: "당신의 경우", "소송하세요" 등 직접 조언 감지 → 면책 문구 삽입
- **금지 키워드**: 탈세, 불법 행위 유도 → 거부 응답

---

## 11. 성능 목표

| 지표 | 목표 |
|------|------|
| 검색 latency (p50) | < 150ms |
| 검색 latency (p95) | < 400ms |
| TTFT (Time to first token) | < 2s |
| 답변 완료 (일반 채팅) | < 8s |
| 답변 완료 (Deep Debate) | < 30s |
| Citation accuracy | ≥ 98% (수동 감사) |

---

## 12. 평가 (Evaluation)

### 12.1 Golden Dataset
- **200개 질문-정답 쌍** (변호사 검수)
- 과목별 분배: 민법 80 / 형법 60 / 헌법 40 / 상법 20

### 12.2 메트릭
- **Retrieval**: Recall@5, MRR
- **Generation**: Citation accuracy, Answer correctness (LLM-as-judge + 인간 샘플링)
- **End-to-end**: Faithfulness (RAGAS)

### 12.3 CI Gate
PR 머지 전 golden set 실행 → 이전 대비 Recall@5 -5% 이상 하락 시 블록.

---

## 13. 비용 추정 (MAU 5,000 기준)

| 항목 | 월 비용 (USD) |
|------|--------------|
| Claude Sonnet (일반 채팅) | $180 |
| Claude Opus (Deep Debate) | $120 |
| OpenAI Embeddings (증분) | $5 |
| Cohere Rerank | $30 |
| Supabase Pro | $25 |
| Cloudflare Workers | $5 |
| Upstash (Redis + QStash) | $10 |
| Sentry / PostHog | $30 |
| **합계** | **~$405/월** |

Pro 전환율 8% × ₩9,900 × 5,000 = ₩3,960,000/월 수익 → 흑자 가능.
