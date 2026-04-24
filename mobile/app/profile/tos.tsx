import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

/**
 * In-app Terms of Service (이용약관) — PLACEHOLDER PENDING LAWYER REVIEW.
 *
 * This copy is a working draft intended to cover the essentials required
 * by Apple App Review (5.1.1) and Korean consumer law (전자상거래법 §13,
 * 약관법 §3). It MUST be replaced with a lawyer-reviewed final version
 * before App Store / Play Store submission.
 *
 * Checklist for the final pass (see docs/production-readiness-checklist.md):
 *   - 외부 변호사 검토 (변호사법 §109 관점)
 *   - 한국 소비자 법령 (전자상거래법, 약관법, PIPA) 준수
 *   - Apple App Review 5.1.1 (User-Generated Content 및 개인정보)
 */

const SECTIONS = [
  {
    tag: "// 제1조",
    title: "목적",
    body: "본 약관은 LAW.OS(이하 '서비스')가 제공하는 법학 학습 보조 서비스의 이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
  },
  {
    tag: "// 제2조",
    title: "서비스의 성격",
    body: "본 서비스는 법령·판례 검색과 AI 기반 학습 보조를 제공하는 교육 목적의 도구입니다. 본 서비스는 법률 자문을 제공하지 않으며, 이용자의 구체적 법률 문제에 대한 상담·대리·중재·화해 등은 수행하지 않습니다. (변호사법 제109조)",
  },
  {
    tag: "// 제3조",
    title: "회원가입 및 계정 관리",
    body: "14세 미만의 미성년자는 회원가입을 할 수 없습니다. 이용자는 계정 정보를 스스로 관리해야 하며, 계정 유출로 인한 손해에 대해서는 회사가 책임지지 않습니다. 로그인 정보는 본 기기에 안전하게 저장됩니다.",
  },
  {
    tag: "// 제4조",
    title: "이용자의 의무",
    body: "이용자는 본 서비스를 교육·학습 목적 외에 오용해서는 안 됩니다. 특히 본 서비스의 답변을 실제 사건의 법률 자문으로 사용하거나 제3자에게 유상으로 제공해서는 안 됩니다.",
  },
  {
    tag: "// 제5조",
    title: "AI 답변의 정확성",
    body: "본 서비스의 AI는 일반 법령·판례에 대한 교육용 답변을 생성합니다. 답변에 오류가 있을 수 있으니 실무·시험에 사용하기 전 반드시 원문(조문·판례)과 대조하십시오. AI 답변의 오류로 인한 직접적·간접적 손해에 대해 회사는 배상 책임을 지지 않습니다.",
  },
  {
    tag: "// 제6조",
    title: "서비스 이용 제한",
    body: "다음 행위 시 사전 통보 없이 이용을 제한할 수 있습니다: (1) 자동화된 방법으로 서비스를 남용하는 경우, (2) 타인의 계정으로 접근하는 경우, (3) 서비스를 상업적 목적으로 재판매하는 경우, (4) 기타 관련 법령을 위반하는 경우.",
  },
  {
    tag: "// 제7조",
    title: "요금 및 결제",
    body: "현재 본 서비스는 무료(FREE)로 제공됩니다. 향후 유료 플랜 도입 시 별도 약관 동의 절차를 거치며, 사전 고지 없이 기존 이용자에게 결제를 청구하지 않습니다.",
  },
  {
    tag: "// 제8조",
    title: "개인정보 보호",
    body: "개인정보의 수집·이용·보관에 관한 사항은 별도의 「개인정보 처리방침」에 따릅니다. 이용자는 언제든지 계정 삭제를 통해 자신의 개인정보를 즉시 삭제 요청할 수 있습니다.",
  },
  {
    tag: "// 제9조",
    title: "약관의 변경",
    body: "회사는 관련 법령과 서비스 운영 현황에 따라 본 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 공지합니다. 중대한 변경의 경우 30일 전에 고지하며, 이용자는 변경에 동의하지 않을 경우 탈퇴할 수 있습니다.",
  },
  {
    tag: "// 제10조",
    title: "책임 제한",
    body: "회사는 천재지변, 통신 장애, 제3자의 행위 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다. 또한 이용자가 서비스를 통해 얻은 정보를 사용하여 발생한 손해에 대해서도 제5조의 범위 내에서 책임을 제한합니다.",
  },
  {
    tag: "// 부칙",
    title: "시행일",
    body: "본 약관은 2026년 월 일부터 시행됩니다. (시행일은 정식 출시 시점에 확정)",
  },
];

export default function TosScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // terms of service
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
            이용약관
          </Text>
          <View className="mt-4 rounded border border-danger/30 bg-danger/5 p-3">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-danger">
              // draft · pending lawyer review
            </Text>
            <Text className="mt-2 font-kr text-xs leading-5 text-dim">
              본 약관은 초안이며 출시 전 변호사 검토 후 최종본으로 교체됩니다.
              현재는 서비스 성격 이해를 위한 참고용입니다.
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
