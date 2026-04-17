-- ============================================================================
-- LAW.OS — 002_sample_statutes.sql
-- Purpose: Insert a minimal set of representative Korean civil/criminal/
--          constitutional articles for end-to-end smoke testing before the
--          full RAG seed lands.
--
-- No embeddings are populated here — the `embedding` column stays NULL.
-- Apply AFTER 001_initial_schema.sql.
--
-- NOTE: article texts below are simplified paraphrases for testing only and
-- are NOT a verified legal text source. Replace with the authoritative text
-- from 국가법령정보센터 (law.go.kr) before any production use.
-- ============================================================================

insert into public.statutes (id, code, code_kr, article_no, article_no_int, title, body, text_hash, part, chapter)
values
  -- ─── 민법 ──────────────────────────────────────────────────────────────
  ('civil-2', 'civil', '민법', '제2조', 2, '신의성실',
    '권리의 행사와 의무의 이행은 신의에 좇아 성실히 하여야 한다. 권리는 남용하지 못한다.',
    'sample-civil-2', '제1편 총칙', '제1장 통칙'),

  ('civil-3', 'civil', '민법', '제3조', 3, '권리능력의 존속기간',
    '사람은 생존한 동안 권리와 의무의 주체가 된다.',
    'sample-civil-3', '제1편 총칙', '제2장 인'),

  ('civil-103', 'civil', '민법', '제103조', 103, '반사회질서의 법률행위',
    '선량한 풍속 기타 사회질서에 위반한 사항을 내용으로 하는 법률행위는 무효로 한다.',
    'sample-civil-103', '제1편 총칙', '제5장 법률행위'),

  ('civil-390', 'civil', '민법', '제390조', 390, '채무불이행과 손해배상',
    '채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는 채권자는 손해배상을 청구할 수 있다. 그러나 채무자의 고의나 과실 없이 이행할 수 없게 된 때에는 그러하지 아니하다.',
    'sample-civil-390', '제3편 채권', '제1장 총칙'),

  ('civil-750', 'civil', '민법', '제750조', 750, '불법행위의 내용',
    '고의 또는 과실로 인한 위법행위로 타인에게 손해를 가한 자는 그 손해를 배상할 책임이 있다.',
    'sample-civil-750', '제3편 채권', '제5장 불법행위'),

  ('civil-840', 'civil', '민법', '제840조', 840, '재판상 이혼원인',
    '부부의 일방은 다음 각 호의 사유가 있는 경우에는 가정법원에 이혼을 청구할 수 있다. 1. 배우자에 부정한 행위가 있었을 때 ...',
    'sample-civil-840', '제4편 친족', '제3장 혼인'),

  -- ─── 형법 ──────────────────────────────────────────────────────────────
  ('criminal-13', 'criminal', '형법', '제13조', 13, '고의',
    '죄의 성립요소인 사실을 인식하지 못한 행위는 벌하지 아니한다. 다만, 법률에 특별한 규정이 있는 경우에는 예외로 한다.',
    'sample-criminal-13', '제1편 총칙', '제2장 죄'),

  ('criminal-21', 'criminal', '형법', '제21조', 21, '정당방위',
    '자기 또는 타인의 법익에 대한 현재의 부당한 침해를 방위하기 위한 행위는 상당한 이유가 있는 때에는 벌하지 아니한다.',
    'sample-criminal-21', '제1편 총칙', '제2장 죄'),

  ('criminal-250', 'criminal', '형법', '제250조', 250, '살인',
    '사람을 살해한 자는 사형, 무기 또는 5년 이상의 징역에 처한다.',
    'sample-criminal-250', '제2편 각칙', '제24장 살인의 죄'),

  -- ─── 헌법 ──────────────────────────────────────────────────────────────
  ('constitutional-10', 'constitutional', '헌법', '제10조', 10, '인간의 존엄과 가치, 행복추구권',
    '모든 국민은 인간으로서의 존엄과 가치를 가지며, 행복을 추구할 권리를 가진다. 국가는 개인이 가지는 불가침의 기본적 인권을 확인하고 이를 보장할 의무를 진다.',
    'sample-const-10', '제2장 국민의 권리와 의무', ''),

  ('constitutional-37', 'constitutional', '헌법', '제37조', 37, '국민의 자유와 권리의 존중·제한',
    '국민의 자유와 권리는 헌법에 열거되지 아니한 이유로 경시되지 아니한다. 국민의 모든 자유와 권리는 국가안전보장·질서유지 또는 공공복리를 위하여 필요한 경우에 한하여 법률로써 제한할 수 있으며, 제한하는 경우에도 자유와 권리의 본질적인 내용을 침해할 수 없다.',
    'sample-const-37', '제2장 국민의 권리와 의무', '')

on conflict (id) do nothing;

-- ============================================================================
-- Verification query (run manually after insert):
--   select code_kr, article_no, title from public.statutes order by code, article_no_int;
-- Expected: 11 rows (6 civil + 3 criminal + 2 constitutional)
-- ============================================================================
