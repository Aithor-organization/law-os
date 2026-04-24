import { useCallback, useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";
import { listConversations } from "@/lib/conversations";
import { subscribeConversationChanged } from "@/lib/conversationEvents";

type TabIconKey = "chat" | "search" | "library" | "profile";

// Dark Academia Pro 탭 바. SVG mono icons (Ionicons outline) via Icon wrapper.
// Active tab uses violet-glow; inactive uses dim. Icon subtree is hidden from
// a11y tree to avoid duplication with Tabs.Screen.tabBarAccessibilityLabel.
//
// Badge overlay (KakaoTalk-style): when `badge > 0`, show a small violet
// circle at the top-right of the icon with the count. Used for signaling
// unread AI responses, pending review cards, etc. — callers pass the count
// from the relevant hook; 0/undefined hides the badge.
function TabIcon({
  name,
  focused,
  badge,
}: {
  name: TabIconKey;
  focused: boolean;
  badge?: number;
}) {
  const showBadge = typeof badge === "number" && badge > 0;
  const badgeLabel = badge && badge > 99 ? "99+" : badge?.toString();
  return (
    <View
      className="items-center justify-center pt-1"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View>
        <Icon name={name} size={22} color={focused ? ICON_COLOR.violetGlow : ICON_COLOR.dim} />
        {showBadge ? (
          <View
            className="absolute -right-2 -top-1 min-w-[16px] h-[16px] items-center justify-center rounded-full bg-violet px-1"
            style={{ borderWidth: 1.5, borderColor: "#0A0A0B" }}
          >
            <Text
              className="font-mono text-[9px] font-bold text-white"
              numberOfLines={1}
            >
              {badgeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  // Chat tab badge — count of active (non-archived) conversations.
  // Fetched once on mount; future iteration can wire a refetch trigger
  // (e.g., from chat-creation screens via a shared store) so the number
  // stays live. For the current scope, an initial snapshot is enough.
  const [chatBadge, setChatBadge] = useState<number | undefined>(undefined);

  const refetchChatBadge = useCallback(async () => {
    const { data, error } = await listConversations();
    if (error) {
      setChatBadge(undefined);
      return;
    }
    const active = data.filter((c) => c.archived_at === null).length;
    setChatBadge(active > 0 ? active : undefined);
  }, []);

  useEffect(() => {
    void refetchChatBadge();
    // Live refresh: any conversation create/delete/archive anywhere in the
    // app emits on the bus; the badge refetches and stays accurate.
    const unsubscribe = subscribeConversationChanged(() => {
      void refetchChatBadge();
    });
    return unsubscribe;
  }, [refetchChatBadge]);

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
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chat" focused={focused} badge={chatBadge} />
          ),
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
