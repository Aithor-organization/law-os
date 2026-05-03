import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Provider,
  clearByok,
  defaultModelOf,
  loadByok,
  maskKey,
  saveByok,
} from "@/lib/byok";
import { fetchOpenRouterModels, testPing } from "@/lib/byokTestPing";
import {
  ModelPicker,
  PROVIDER_LABEL,
  ProviderPicker,
} from "./_byok-pickers";

export default function ApiKeysScreen() {
  const [provider, setProvider] = useState<Provider>("gemini");
  const [model, setModel] = useState<string>(defaultModelOf("gemini"));
  const [apiKey, setApiKey] = useState("");
  const [storedMask, setStoredMask] = useState<string | null>(null);
  const [orModelCount, setOrModelCount] = useState(0);
  const [pinging, setPinging] = useState(false);
  const [saving, setSaving] = useState(false);

  // 진행 중인 testPing fetch를 unmount 시 취소하기 위한 controller.
  // useRef라 re-render에 영향 없음. abort 후 새 controller로 교체.
  const pingAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadByok().then((stored) => {
      if (stored) {
        setProvider(stored.provider);
        setModel(stored.model);
        setStoredMask(maskKey(stored.apiKey));
      }
    });
    return () => {
      pingAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (provider !== "openrouter") return;
    fetchOpenRouterModels().then((m) => setOrModelCount(m.length));
  }, [provider]);

  const setProviderAndDefaultModel = (p: Provider) => {
    setProvider(p);
    setModel(defaultModelOf(p));
  };

  const handleTestPing = async () => {
    if (!apiKey) {
      Alert.alert("키 입력 필요", "API 키를 먼저 입력해주세요.");
      return;
    }
    pingAbortRef.current?.abort();
    const controller = new AbortController();
    pingAbortRef.current = controller;
    setPinging(true);
    const result = await testPing(provider, apiKey, controller.signal);
    if (pingAbortRef.current === controller) {
      pingAbortRef.current = null;
      setPinging(false);
      Alert.alert(result.ok ? "✅ 검증 성공" : "❌ 검증 실패", result.message);
    }
  };

  const handleSave = async () => {
    if (!apiKey || !model) {
      Alert.alert("입력 필요", "모델과 API 키를 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    pingAbortRef.current?.abort();
    const controller = new AbortController();
    pingAbortRef.current = controller;
    const ping = await testPing(provider, apiKey, controller.signal);
    if (pingAbortRef.current !== controller) {
      // unmounted or superseded — abandon save
      return;
    }
    pingAbortRef.current = null;
    if (!ping.ok) {
      setSaving(false);
      Alert.alert("키 검증 실패", `${ping.message}\n저장하지 않았습니다.`);
      return;
    }
    await saveByok({ provider, model, apiKey });
    setSaving(false);
    setStoredMask(maskKey(apiKey));
    setApiKey("");
    Alert.alert("저장 완료", "이제 본인 API 키로 무제한 사용 가능합니다.");
  };

  const handleRemove = () => {
    Alert.alert("BYOK 키 삭제", "기본 모델로 돌아갑니다 (매일 5회 제한).", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await clearByok();
          setStoredMask(null);
          setModel(defaultModelOf("gemini"));
          setProvider("gemini");
          setApiKey("");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // byok · api keys
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold tracking-tightest text-fg">
            본인 API 키로 무제한
          </Text>
          <Text className="mt-2 font-kr text-sm text-dim">
            기본 모델은 매일 5회 제한이지만, 본인 키를 등록하면 제한이 사라집니다.
            ⚠ 무료 모델이 아닐 경우 API 사용량에 따른 요금이 본인에게 청구될 수 있습니다.
          </Text>
        </View>

        {storedMask ? (
          <View className="mt-6 mx-6 rounded border border-cyan/40 bg-cyan/10 p-4">
            <Text className="font-mono text-[10px] uppercase text-cyan">
              // 등록됨
            </Text>
            <Text className="mt-1 font-kr text-sm text-fg">
              {PROVIDER_LABEL[provider]} · {model}
            </Text>
            <Text className="mt-1 font-mono text-xs text-dim">{storedMask}</Text>
            <Pressable onPress={handleRemove} className="mt-3 self-start">
              <Text className="font-mono text-[10px] uppercase text-danger">
                // 키 삭제
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mt-8 px-6">
          <ProviderPicker value={provider} onChange={setProviderAndDefaultModel} />
        </View>

        <View className="mt-6 px-6">
          <ModelPicker
            provider={provider}
            value={model}
            onChange={setModel}
            openRouterCount={orModelCount}
          />
        </View>

        <View className="mt-6 px-6">
          <Input
            label="// api key (저장되지 않음, 키체인에만 보관)"
            placeholder="sk-... 또는 AIza..."
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            secureTextEntry
          />
        </View>

        <View className="mt-8 gap-3 px-6">
          <Button variant="ghost" onPress={handleTestPing} disabled={pinging || !apiKey}>
            {pinging ? "확인 중..." : "🔍 키 검증"}
          </Button>
          <Button variant="primary" onPress={handleSave} disabled={saving || !apiKey || !model}>
            {saving ? "검증 후 저장 중..." : "저장하고 사용 시작"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
