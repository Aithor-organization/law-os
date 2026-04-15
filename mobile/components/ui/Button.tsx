import { Pressable, Text, View, ViewStyle } from "react-native";
import { cssInterop } from "nativewind";

type Variant = "primary" | "ghost" | "mono";

interface ButtonProps {
  variant?: Variant;
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

// Dark Academia Pro 버튼. 최대 radius 6px, ghost border, 바이올렛 글로우.
export function Button({
  variant = "primary",
  onPress,
  children,
  className = "",
  disabled,
  icon,
}: ButtonProps) {
  const base =
    "flex-row items-center justify-center px-6 h-14 rounded-[6px]";

  const variantClass: Record<Variant, string> = {
    primary: "bg-violet",
    ghost: "bg-transparent border border-white/10",
    mono: "bg-surface-high",
  };

  const textClass: Record<Variant, string> = {
    primary: "text-white font-kr text-base font-semibold",
    ghost: "text-fg font-kr text-base",
    mono: "text-fg font-mono text-xs uppercase tracking-wider",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${variantClass[variant]} ${
        disabled ? "opacity-40" : ""
      } ${className}`}
      style={
        variant === "primary"
          ? ({
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 8,
            } as ViewStyle)
          : undefined
      }
    >
      {icon ? <View className="mr-2">{icon}</View> : null}
      <Text className={textClass[variant]}>{children}</Text>
    </Pressable>
  );
}
