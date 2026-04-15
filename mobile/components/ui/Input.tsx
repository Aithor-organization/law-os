import { useState } from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Dark Academia Pro 입력 필드. 하단 언더라인, focus 시 바이올렛 글로우.
export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-2 font-mono text-[10px] uppercase tracking-wider text-dim">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center border-b ${
          focused ? "border-violet" : "border-white/10"
        } ${error ? "border-danger" : ""}`}
        style={
          focused
            ? {
                shadowColor: "#A855F7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }
            : undefined
        }
      >
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}
        <TextInput
          {...props}
          placeholderTextColor="#71717A"
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className="flex-1 py-3 font-kr text-base text-fg"
          style={{ outlineStyle: "none" } as any}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1 font-mono text-xs text-danger">[!] {error}</Text>
      ) : null}
    </View>
  );
}
