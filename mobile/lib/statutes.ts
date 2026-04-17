import { supabase } from "./supabase";

export type RelatedCaseSummary = {
  id: string;
  caseNo: string;
  court: string;
  decidedAt: string;
  summary: string | null;
};

export type StatuteDetail = {
  id: string;
  code: string;
  codeKr: string;
  articleNo: string;
  title: string | null;
  body: string;
  part: string | null;
  chapter: string | null;
  relatedCases: RelatedCaseSummary[];
};

type RelatedLinkRow = {
  case_id: string;
  cases:
    | {
        id: string;
        case_no: string;
        court: string;
        decided_at: string;
        summary: string | null;
      }
    | null;
};

export async function getStatuteDetail(id: string): Promise<{
  data: StatuteDetail | null;
  error: Error | null;
}> {
  // Fetch the statute row and related cases (via statute_case_links) in parallel.
  // The link query uses an embedded select so we get cases in a single round-trip.
  const [statuteRes, linksRes] = await Promise.all([
    supabase
      .from("statutes")
      .select("id, code, code_kr, article_no, title, body, part, chapter")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("statute_case_links")
      .select(
        "case_id, cases:cases!statute_case_links_case_id_fkey(id, case_no, court, decided_at, summary)",
      )
      .eq("statute_id", id)
      .order("relevance_score", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  if (statuteRes.error) {
    return { data: null, error: statuteRes.error as Error };
  }
  if (!statuteRes.data) {
    return { data: null, error: new Error("statute_not_found") };
  }
  if (linksRes.error) {
    return { data: null, error: linksRes.error as Error };
  }

  const statute = statuteRes.data as {
    id: string;
    code: string;
    code_kr: string;
    article_no: string;
    title: string | null;
    body: string;
    part: string | null;
    chapter: string | null;
  };

  const links = (linksRes.data as unknown as RelatedLinkRow[] | null) ?? [];
  const relatedCases: RelatedCaseSummary[] = links
    .map((link) => link.cases)
    .filter((row): row is NonNullable<RelatedLinkRow["cases"]> => Boolean(row))
    .sort((a, b) => (b.decided_at ?? "").localeCompare(a.decided_at ?? ""))
    .map((row) => ({
      id: row.id,
      caseNo: row.case_no,
      court: row.court,
      decidedAt: row.decided_at,
      summary: row.summary,
    }));

  return {
    data: {
      id: statute.id,
      code: statute.code,
      codeKr: statute.code_kr,
      articleNo: statute.article_no,
      title: statute.title,
      body: statute.body,
      part: statute.part,
      chapter: statute.chapter,
      relatedCases,
    },
    error: null,
  };
}
