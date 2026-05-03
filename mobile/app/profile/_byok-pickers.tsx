import { Pressable, Text, View } from "react-native";
import { Input } from "@/components/ui/Input";
import { DEFAULT_MODELS, Provider } from "@/lib/byok";

export const PROVIDER_LABEL: Record<Provider, string> = {
  gemini: "Gemini",
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
};

interface ProviderPickerProps {
  value: Provider;
  onChange: (p: Provider) => void;
}

export function ProviderPicker({ value, onChange }: ProviderPickerProps) {
  return (
    <View>
      <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
        // provider
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {(Object.keys(PROVIDER_LABEL) as Provider[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            className={`rounded border px-3 py-2 ${
              value === p
                ? "border-violet bg-violet/10"
                : "border-white/10 bg-surface"
            }`}
          >
            <Text
              className={`font-kr text-sm ${
                value === p ? "text-violet-glow" : "text-fg"
              }`}
            >
              {PROVIDER_LABEL[p]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface ModelPickerProps {
  provider: Provider;
  value: string;
  onChange: (m: string) => void;
  openRouterCount: number;
}

export function ModelPicker({
  provider,
  value,
  onChange,
  openRouterCount,
}: ModelPickerProps) {
  if (provider === "openrouter") {
    return (
      <View>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
          // model
        </Text>
        <View className="mt-3">
          <Text className="font-mono text-[10px] text-dim">
            {openRouterCount > 0
              ? `// ${openRouterCount}개 모델 사용 가능 — 직접 입력하세요`
              : "// 모델 목록 fetch 실패 — 직접 입력"}
          </Text>
          <View className="mt-2">
            <Input
              label="// model id"
              placeholder="예: anthropic/claude-3.5-sonnet"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>
    );
  }

  const lineup = DEFAULT_MODELS[provider];

  return (
    <View>
      <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
        // model
      </Text>

      <Text className="mt-3 font-mono text-[10px] uppercase text-violet-glow">
        // current generation
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {lineup.current.map((m) => (
          <ModelChip key={m} model={m} active={value === m} onPress={() => onChange(m)} />
        ))}
      </View>

      <Text className="mt-4 font-mono text-[10px] uppercase text-dim">
        // previous generation
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {lineup.previous.map((m) => (
          <ModelChip key={m} model={m} active={value === m} onPress={() => onChange(m)} />
        ))}
      </View>
    </View>
  );
}

function ModelChip({
  model,
  active,
  onPress,
}: {
  model: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded border px-3 py-2 ${
        active ? "border-violet bg-violet/10" : "border-white/10 bg-surface"
      }`}
    >
      <Text className={`font-mono text-xs ${active ? "text-violet-glow" : "text-fg"}`}>
        {model}
      </Text>
    </Pressable>
  );
}
