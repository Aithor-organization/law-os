import { Redirect } from "expo-router";

// MVP: 첫 진입은 Login으로. 추후 세션 체크 로직 연결.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
