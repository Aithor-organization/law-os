import { supabase } from "./supabase";

export type RelatedStatuteSummary = {
  id: string;
  label: string;
  subtitle: string | null;
};

export type CaseDetail = {
  id: string;
  caseNo: string;
  court: string;
  decidedAt: string;
  category: string;
  summary: string | null;
  judgmentPoints: string[];
  fullText: string | null;
  relatedStatutes: RelatedStatuteSummary[];
};

function splitJudgmentPoints(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n|\n(?=\[[0-9]+\]|[0-9]+\.|[①-⑳])/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function getCaseDetail(id: string): Promise<{
  data: CaseDetail | null;
  error: Error | null;
}> {
  const { data: row, error } = await supabase
    .from("cases")
    .select(
      "id, case_no, court, decided_at, category, summary, judgment_points, full_text, related_statute_ids",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error as Error };
  }
  if (!row) {
    return { data: null, error: new Error("case_not_found") };
  }

  const statuteIds = (row.related_statute_ids ?? []).filter(Boolean);
  let relatedStatutes: RelatedStatuteSummary[] = [];
  if (statuteIds.length > 0) {
    const { data: statutes, error: statuteError } = await supabase
      .from("statutes")
      .select("id, code_kr, article_no, title")
      .in("id", statuteIds);

    if (statuteError) {
      return { data: null, error: statuteError as Error };
    }

    relatedStatutes = (statutes ?? []).map((item) => ({
      id: item.id,
      label: `${item.code_kr} ${item.article_no}`,
      subtitle: item.title,
    }));
  }

  return {
    data: {
      id: row.id,
      caseNo: row.case_no,
      court: row.court,
      decidedAt: row.decided_at,
      category: row.category,
      summary: row.summary,
      judgmentPoints: splitJudgmentPoints(row.judgment_points),
      fullText: row.full_text,
      relatedStatutes,
    },
    error: null,
  };
}
