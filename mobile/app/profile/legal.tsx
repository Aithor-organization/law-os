import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const SECTIONS = [
  {
    tag: "// disclaimer",
    title: "법적 고지",
    body: "LAW.OS는 법학 학습 도구이며 법률 자문이 아닙니다. 이 앱의 답변은 교육 및 참고 목적으로만 제공되며, 구체적인 법률 문제나 개인 사건에 대한 판단·조언으로 사용될 수 없습니다. 실제 법률 문제가 있는 경우 반드시 변호사에게 상담하세요.",
  },
  {
    tag: "// 변호사법 compliance",
    title: "변호사법 제109조",
    body: "변호사가 아닌 자가 금품 등을 받고 법률사무를 취급하는 것은 금지되어 있습니다. LAW.OS는 이 규정을 준수하기 위해 개인 사건에 대한 자문·대리·중재·화해·청탁은 제공하지 않습니다. 답변은 일반 법령·판례에 대한 교육 정보로만 한정됩니다.",
  },
  {
    tag: "// accuracy",
    title: "정확성 고지",
    body: "AI가 생성하는 답변에는 오류가 있을 수 있습니다. 시험·실무에 사용하기 전 반드시 원문(조문·판례)과 대조 확인하세요. 모든 답변에는 출처가 함께 제공됩니다.",
  },
  {
    tag: "// data",
    title: "데이터 수집",
    body: "개인 학습 기록(대화, 노트, 사용량)은 서비스 제공 목적으로만 수집됩니다. 제3자에게 제공되지 않으며, 계정 삭제 시 즉시 파기됩니다. 자세한 내용은 개인정보 처리방침을 참고하세요.",
  },
];

// In-app routes take precedence. External URLs are kept as fallback for
// items that require a canonical public version (e.g. OSS license list).
const LEGAL_HOST = "https://lawos.kr/legal";

type LegalLink =
  | { label: string; internal: string }
  | { label: string; url: string };

const LINKS: LegalLink[] = [
  { label: "이용약관 전문", internal: "/profile/tos" },
  { label: "개인정보 처리방침", internal: "/profile/privacy" },
  { label: "오픈소스 라이선스", url: `${LEGAL_HOST}/oss` },
];

async function openExternal(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("링크 열기 실패", url);
    return;
  }
  await Linking.openURL(url);
}

export default function LegalScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // legal & compliance
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
            법적 고지 및{"\n"}준수 사항
          </Text>
        </View>

        <View className="mt-8 gap-5 px-6">
          {SECTIONS.map((s, i) => (
            <View
              key={i}
              className="rounded-[6px] border border-white/10 bg-surface p-5"
            >
              <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                {s.tag}
              </Text>
              <Text className="mt-3 font-kr text-lg font-semibold text-fg">
                {s.title}
              </Text>
              <Text className="mt-3 font-kr text-sm leading-6 text-dim">
                {s.body}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-10 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 관련 문서
          </Text>
          <View className="mt-4 gap-2">
            {LINKS.map((l) => {
              const isInternal = "internal" in l;
              const key = isInternal ? l.internal : l.url;
              return (
                <Pressable
                  key={key}
                  onPress={() =>
                    isInternal ? router.push(l.internal as any) : void openExternal(l.url)
                  }
                  accessibilityRole="link"
                  accessibilityLabel={l.label}
                  className="flex-row items-center justify-between rounded-[6px] border border-white/10 bg-surface-high px-4 py-4"
                >
                  <Text className="font-kr text-sm text-fg">{l.label}</Text>
                  <Text className="font-mono text-xs text-dim">{isInternal ? "→" : "↗"}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text className="mt-10 text-center font-mono text-[10px] text-dim">
          // © 2026 LAW.OS · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
