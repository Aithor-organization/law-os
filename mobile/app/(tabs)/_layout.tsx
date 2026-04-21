import { Tabs } from "expo-router";
import { View } from "react-native";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";

type TabIconKey = "chat" | "search" | "library" | "profile";

// Dark Academia Pro 탭 바. SVG mono icons (Ionicons outline) via Icon wrapper.
// Active tab uses violet-glow; inactive uses dim. Icon subtree is hidden from
// a11y tree to avoid duplication with Tabs.Screen.tabBarAccessibilityLabel.
function TabIcon({ name, focused }: { name: TabIconKey; focused: boolean }) {
  return (
    <View
      className="items-center justify-center pt-1"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Icon name={name} size={22} color={focused ? ICON_COLOR.violetGlow : ICON_COLOR.dim} />
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
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "검색",
          tabBarAccessibilityLabel: "검색",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "서재",
          tabBarAccessibilityLabel: "서재",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="library" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarAccessibilityLabel: "프로필",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
