import { Redirect } from "expo-router";

// 앱 최초 진입 → Splash → (1.8s 후) Login 또는 Tabs
export default function Index() {
  return <Redirect href="/splash" />;
}
