import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initTelemetry, wrapRoot } from "@/lib/telemetry";

// Sentry init at module load — fires before the first render. No-op when
// EXPO_PUBLIC_SENTRY_DSN is absent or @sentry/react-native is not installed.
initTelemetry();

/**
 * 폰트 로딩:
 * - 웹: global.css의 @import로 Google Fonts CDN에서 자동 로드
 *   (Pretendard Variable, Inter, JetBrains Mono)
 * - 네이티브(iOS/Android): 시스템 폰트 fallback (추후 expo-font + 로컬 ttf 추가 시 교체)
 *
 * 이 방식은 추가 npm 의존성 없이 웹 미리보기에서 즉시 디자인 시스템을 보여줍니다.
 */
function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}

// Sentry.wrap() enables touch/navigation breadcrumbs + performance tracing
// when Sentry is installed; falls through as identity when it is not.
export default wrapRoot(RootLayout);
