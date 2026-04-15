import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      tag="// settings"
      stitchId="5c48c432277b4fc09302be09201dbe2d"
      title="설정"
      subtitle="계정 · 알림 · 화면 · 데이터 · 법적 · 정보"
      description="Stitch: 5c48c432... · 설정 섹션 전체"
      links={[
        { label: "프로필 편집", href: "/profile/edit" },
        { label: "알림 설정", href: "/profile/notifications" },
        { label: "화면 설정", href: "/profile/appearance" },
        { label: "데이터 내보내기", href: "/modals/export" },
        { label: "법적 정보", href: "/profile/legal" },
        { label: "버전 정보", href: "/profile/about" },
        { label: "로그아웃", href: "/modals/logout" },
      ]}
    />
  );
}
