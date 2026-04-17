import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getCurrentSession } from "@/lib/auth";

/**
 * Splash Screen — Dark Academia Pro / Sovereign Terminal
 *
 * 최소 1초 대기 후 세션 유무에 따라 분기:
 *  - 세션 있음 → /(tabs)
 *  - 세션 없음 → /(auth)/login
 */
export default function SplashScreen() {
  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    Promise.all([getCurrentSession(), minDelay]).then(([result]) => {
      if (cancelled) return;
      if (result.session) {
        router.replace("/(tabs)" as any);
      } else {
        router.replace("/(auth)/login" as any);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Top mono tag */}
      <View className="px-6 pt-4">
        <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
          // boot sequence · v1.0.0
        </Text>
      </View>

      {/* Center brand */}
      <View className="flex-1 items-center justify-center gap-6">
        <View
          className="items-center"
          style={{
            shadowColor: "#A855F7",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 40,
          }}
        >
          <Text className="font-mono text-[56px] font-bold tracking-tightest text-violet-glow">
            LAW.OS
          </Text>
          <Text className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-cyan">
            sovereign terminal
          </Text>
        </View>

        <View className="mt-8 w-[220px]">
          <Text className="text-center font-kr text-lg text-fg">
            법률 공부,
          </Text>
          <Text className="text-center font-kr text-lg text-fg">
            주머니 속에서
          </Text>
        </View>

        {/* Loading dots */}
        <View className="mt-12 flex-row gap-2">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet"
              style={{ opacity: 0.3 + i * 0.3 }}
            />
          ))}
        </View>
      </View>

      {/* Bottom status bar */}
      <View className="px-6 pb-6">
        <View className="flex-row items-center justify-between">
          <Text className="font-mono text-[10px] text-dim">
            // loading runtime...
          </Text>
          <Text className="font-mono text-[10px] text-dim">v1.0.0 · build 8a7f3c2</Text>
        </View>
        <View className="mt-2 h-px bg-white/5" />
        <View className="mt-2 flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
          <Text className="font-mono text-[10px] uppercase text-dim">
            all systems operational
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
