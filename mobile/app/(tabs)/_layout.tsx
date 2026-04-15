import { Tabs } from "expo-router";
import { Text, View } from "react-native";

// Dark Academia Pro 탭 바. 활성 탭은 바이올렛 글로우.
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-1">
      <Text
        className={`font-mono text-[10px] uppercase tracking-wider ${
          focused ? "text-violet-glow" : "text-dim"
        }`}
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
          tabBarIcon: ({ focused }) => <TabIcon label="chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "검색",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "서재",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="library" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
