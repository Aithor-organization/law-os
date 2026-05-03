import { Stack } from "expo-router";

// 튜토리얼은 회원가입 직후 한 번 보는 풀스크린 코스. 헤더/뒤로가기 숨김.
// 사용자가 진행하는 동안 우발적으로 빠져나가지 않도록 gestureEnabled=false.
export default function TutorialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: "#000000" },
        animation: "fade",
      }}
    />
  );
}
