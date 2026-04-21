import { Tabs } from "expo-router";
import { Text, View } from "react-native";

// Dark Academia Pro 탭 바. 활성 탭은 바이올렛 글로우.
// The inner Text is hidden from the a11y tree to avoid duplication with
// Tabs.Screen.title / tabBarAccessibilityLabel — without this, screen
// readers announce e.g. "대화 chat" twice in a row (observed via
// react-native-web's accessibility tree).
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View
      className="items-center justify-center pt-1"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        className={`font-mono text-[10px] uppercase tracking-wider ${
          focused ? "text-violet-glow" : "text-dim"
        }`}
        accessible={false}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A0A0B",
          borderTopColor: "rgba(255,255,255,0.05)",
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabel: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "대화",
          tabBarAccessibilityLabel: "대화",
          tabBarIcon: ({ focused }) => <TabIcon label="chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "검색",
          tabBarAccessibilityLabel: "검색",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "서재",
          tabBarAccessibilityLabel: "서재",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="library" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarAccessibilityLabel: "프로필",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
