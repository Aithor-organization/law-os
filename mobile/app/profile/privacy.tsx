import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

/**
 * In-app Privacy Policy (개인정보 처리방침) — PLACEHOLDER PENDING LAWYER REVIEW.
 *
 * This draft covers PIPA (개인정보 보호법) §30 required items and Apple/
 * Google store required disclosures. Replace with lawyer-reviewed final
 * before submission.
 *
 * Required by PIPA §30:
 *   1) 수집 항목
 *   2) 수집·이용 목적
 *   3) 보유·이용 기간
 *   4) 제3자 제공 여부
 *   5) 위탁 처리 현황
 *   6) 이용자 권리 및 행사 방법
 *   7) 개인정보 보호책임자
 */

const SECTIONS = [
  {
    tag: "// 1",
    title: "수집하는 개인정보 항목",
    body: "(필수) 이메일 주소, 비밀번호(해시 저장), 이름\n(선택) 사용자 유형(로스쿨/변시/학부/기타), 학년, 프로필 사진\n(자동 수집) 학습 활동 기록(대화·노트·북마크·검색), 기기 식별자(OS/버전/앱 버전)",
  },
  {
    tag: "// 2",
    title: "수집·이용 목적",
    body: "① 회원 인증 및 계정 관리\n② 개인화된 학습 콘텐츠 제공 (맞춤 복습, 스트릭)\n③ 서비스 개선을 위한 통계 분석 (개인 식별 불가능한 형태로 집계)\n④ 법령 개정·중요 공지 전달\n\n본 서비스는 수집한 정보를 마케팅·광고 목적으로 사용하지 않습니다.",
  },
  {
    tag: "// 3",
    title: "보유 및 이용 기간",
    body: "회원 탈퇴 시 모든 개인정보를 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안만 보존합니다.\n\n회원탈퇴 기능은 '프로필 → 내 계정 → 로그아웃' 다음에 제공되는 '계정 삭제'에서 이용할 수 있으며, 삭제 시 대화·노트·북마크·학습 활동 기록이 모두 즉시 영구 삭제됩니다.",
  },
  {
    tag: "// 4",
    title: "제3자 제공 여부",
    body: "본 서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따라 수사기관 등의 정당한 요청이 있는 경우를 제외합니다.",
  },
  {
    tag: "// 5",
    title: "위탁 처리 현황",
    body: "다음 업체에 서비스 제공을 위해 일부 처리를 위탁합니다:\n\n- Supabase (Inc., 미국): 데이터베이스·인증 서비스\n- Anthropic, Inc. (미국): AI 답변 생성 (질문 내용 전송)\n- Google LLC (미국): AI 답변 생성 (Gemini 모델)\n\n위탁 업체는 개인정보 보호를 위한 계약상 의무를 부담합니다. 질문 내용은 모델 학습에 사용되지 않습니다.",
  },
  {
    tag: "// 6",
    title: "이용자의 권리",
    body: "이용자는 언제든지 다음 권리를 행사할 수 있습니다:\n\n① 개인정보 열람 요구 (앱 내 프로필 화면)\n② 개인정보 정정·삭제 요구 (프로필 편집)\n③ 처리 정지 요구 (문의처로 연락)\n④ 계정 및 모든 데이터의 즉시 삭제 (계정 삭제 기능)\n\nPIPA §35에 따라 본인 데이터를 기계가 읽을 수 있는 형식으로 다운로드할 권리는 서비스 정식 출시 시점에 제공됩니다.",
  },
  {
    tag: "// 7",
    title: "개인정보 보호책임자",
    body: "개인정보 보호책임자: (출시 시 지정 예정)\n이메일: privacy@lawos.kr (임시)\n\n개인정보 침해에 대한 신고·상담이 필요한 경우 아래 기관에 문의할 수 있습니다:\n\n- 개인정보분쟁조정위원회: 1833-6972\n- 개인정보침해신고센터: 118\n- 대검찰청 사이버범죄수사단: 1301",
  },
  {
    tag: "// 8",
    title: "쿠키 및 추적 기술",
    body: "본 모바일 앱은 웹 브라우저와 같은 의미의 쿠키를 사용하지 않습니다. 단, 로그인 세션 유지를 위해 보안 저장소(SecureStore)에 인증 토큰을 저장합니다. 광고 추적(IDFA, 광고 식별자)은 수집하지 않습니다.",
  },
  {
    tag: "// 9",
    title: "처리방침의 변경",
    body: "본 처리방침은 법령 변경, 서비스 변경 등으로 내용이 추가·삭제 및 수정될 수 있으며, 변경 시 앱 내 공지 및 별도 알림을 통해 최소 7일 전 고지합니다.",
  },
  {
    tag: "// 부칙",
    title: "시행일",
    body: "본 처리방침은 2026년 월 일부터 시행됩니다. (시행일은 정식 출시 시점에 확정)",
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // privacy policy
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
            개인정보{"\n"}처리방침
          </Text>
          <View className="mt-4 rounded border border-danger/30 bg-danger/5 p-3">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-danger">
              // draft · pending lawyer review
            </Text>
            <Text className="mt-2 font-kr text-xs leading-5 text-dim">
              본 처리방침은 초안이며 출시 전 변호사 검토 후 최종본으로 교체됩니다.
              현재는 데이터 처리 범위 이해를 위한 참고용입니다.
            </Text>
          </View>
        </View>

        <View className="mt-6 gap-4 px-6">
          {SECTIONS.map((s, i) => (
            <View
              key={i}
              className="rounded-[6px] border border-white/10 bg-surface p-5"
            >
              <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                {s.tag}
              </Text>
              <Text className="mt-2 font-kr text-base font-semibold text-fg">
                {s.title}
              </Text>
              <Text className="mt-3 font-kr text-sm leading-6 text-dim">
                {s.body}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mt-10 text-center font-mono text-[10px] text-dim">
          // © 2026 LAW.OS · draft v0.1
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
