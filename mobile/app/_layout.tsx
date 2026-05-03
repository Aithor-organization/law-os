import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { initTelemetry, wrapRoot } from "@/lib/telemetry";

// Sentry init at module load — fires before the first render. No-op when
// EXPO_PUBLIC_SENTRY_DSN is absent or @sentry/react-native is not installed.
initTelemetry();

// Reanimated 4 strict mode는 useSharedValue 접근을 매우 엄격하게 검사하여
// 튜토리얼 페이지의 정상적인 worklet 사용에서도 false-positive warning을
// 우다다 출력. strict=false로 두면 worklet 위반은 여전히 잡되 읽기 시점
// 경고만 억제. 실제 런타임 안전성에는 영향 없음.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

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
