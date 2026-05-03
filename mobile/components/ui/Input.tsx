import { TextInput, TextInputProps, View, Text } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Focus state was removed: causing TextInput to remount on focus under
// NativeWind 4 + Expo Go, leading to immediate blur ("focus flash").
// Visual focus styling can be restored later via Animated API without React state.
export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text className="mb-2 font-mono text-[10px] uppercase tracking-wider text-dim">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 48,
          borderBottomWidth: 1,
          borderBottomColor: error ? "#EF4444" : "rgba(255,255,255,0.1)",
        }}
      >
        {leftIcon ? <View style={{ marginRight: 12 }}>{leftIcon}</View> : null}
        <TextInput
          {...props}
          placeholderTextColor="#71717A"
          style={{
            flex: 1,
            paddingVertical: 12,
            fontSize: 16,
            color: "#F4F4F5",
            fontFamily: "Pretendard",
          }}
        />
        {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1 font-mono text-xs text-danger">[!] {error}</Text>
      ) : null}
    </View>
  );
}
