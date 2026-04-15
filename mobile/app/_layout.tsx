import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from "@expo-google-fonts/noto-sans-kr";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { View } from "react-native";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // NOTE: Pretendard는 Google Fonts에 없어서 시각적으로 유사한 Noto Sans KR로 대체.
  // 추후 Pretendard ttf를 mobile/assets/fonts/ 에 추가하고 이 훅에서 require로 교체.
  const [fontsLoaded] = useFonts({
    Pretendard: NotoSansKR_400Regular,
    "Pretendard-Medium": NotoSansKR_500Medium,
    "Pretendard-Bold": NotoSansKR_700Bold,
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    JetBrainsMono: JetBrainsMono_400Regular,
    "JetBrainsMono-Bold": JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // 폰트 로딩 중에는 완전 검정 배경 — splash와 이음새 없음
    return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
  }

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
