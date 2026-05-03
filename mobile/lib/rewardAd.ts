import { supabase } from "./supabase";

// AdMob 리워드 광고 통합 — Phase 3c.
//
// 현재 상태: STUB. 실제 SDK는 react-native-google-mobile-ads로 EAS 빌드 시점에
// 통합 (config plugin). 이 stub은 사용자 결정 (AdMob, 일일 5회 광고 상한)을
// 반영한 인터페이스를 먼저 노출해두고, native 코드만 추후 교체할 수 있게 함.
//
// 실제 구현 시 교체 지점:
//   import { RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
//   const ad = RewardedAd.createForAdRequest(unitId);
//   ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => { ... });
//   await new Promise((res) => { ad.addAdEventListener(RewardedAdEventType.CLOSED, res); });
//   ad.load(); ad.show();
//
// 단, 본 stub도 grant_ad_bonus RPC는 실제로 호출하므로 백엔드 검증은 가능.

export type RewardResult = {
  granted: boolean;
  reason?: "daily_ad_limit" | "ad_failed" | "no_session";
  bonus?: number;
  adViews?: number;
};

export async function watchRewardedAdAndGrantBonus(): Promise<RewardResult> {
  // STUB: 실제 광고 표시 대신 즉시 grant_ad_bonus 호출.
  // 운영에서는 광고 시청 완료 콜백 안에서만 호출되어야 함.
  if (__DEV__) {
    // dev에서는 즉시 grant
  } else {
    // production stub — TODO: AdMob native call here
  }

  const { data, error } = await supabase.rpc("grant_ad_bonus");
  if (error) {
    return { granted: false, reason: "ad_failed" };
  }
  const r = data as
    | { granted: boolean; reason?: string; bonus?: number; ad_views?: number }
    | null;
  if (!r) return { granted: false, reason: "ad_failed" };
  return {
    granted: r.granted,
    reason: r.reason as "daily_ad_limit" | undefined,
    bonus: r.bonus,
    adViews: r.ad_views,
  };
}
