# AdMob 리워드 광고 통합 가이드 (Phase 3c)

> **현재 상태**: Stub 활성. 실제 광고는 표시되지 않고, `grant_ad_bonus` RPC만 호출되어 +2회가 즉시 부여됩니다.
> 운영 전에 아래 단계를 따라 native SDK를 통합해야 합니다.

## 1. 패키지 설치

```bash
cd mobile
npx expo install react-native-google-mobile-ads
```

## 2. AdMob 계정 + 앱 ID 발급

- https://apps.admob.com → 새 앱 등록 (iOS, Android 각각)
- 결과: 두 개의 App ID, 두 개의 Rewarded Ad Unit ID

## 3. `mobile/app.json` plugin 등록

```jsonc
{
  "expo": {
    "plugins": [
      // ...기존 plugins
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXX~ANDROID_APP_ID",
          "iosAppId": "ca-app-pub-XXXX~IOS_APP_ID",
          "userTrackingPermission": "이 앱은 광고 보상을 제공하기 위해 광고 식별자를 사용할 수 있습니다."
        }
      ]
    ]
  }
}
```

## 4. iOS SKAdNetwork ID + ATT

`react-native-google-mobile-ads` 문서에 SKAdNetworkItems 60+개 목록이 있음. `app.json`의 `ios.infoPlist.SKAdNetworkItems`에 복사.

ATT는 `userTrackingPermission` 문구로 plugin이 자동 처리.

## 5. `mobile/lib/rewardAd.ts` 교체

현재 stub 부분을 다음으로 교체:

```ts
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

const REWARDED_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === "ios"
    ? "ca-app-pub-XXX/IOS_REWARDED_UNIT"
    : "ca-app-pub-XXX/ANDROID_REWARDED_UNIT";

export async function watchRewardedAdAndGrantBonus(): Promise<RewardResult> {
  const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);

  return new Promise((resolve) => {
    let earned = false;
    const earnedSub = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => { earned = true; },
    );
    const closedSub = ad.addAdEventListener(
      RewardedAdEventType.CLOSED,
      async () => {
        earnedSub();
        closedSub();
        if (!earned) {
          resolve({ granted: false, reason: "ad_failed" });
          return;
        }
        const { data, error } = await supabase.rpc("grant_ad_bonus");
        if (error || !data) {
          resolve({ granted: false, reason: "ad_failed" });
        } else {
          const r = data as { granted: boolean; reason?: string; bonus?: number; ad_views?: number };
          resolve({
            granted: r.granted,
            reason: r.reason as "daily_ad_limit" | undefined,
            bonus: r.bonus,
            adViews: r.ad_views,
          });
        }
      },
    );
    ad.load();
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
  });
}
```

## 6. EAS Dev Client 재빌드

`react-native-google-mobile-ads`는 native 코드라 dev client 새 빌드 필요:

```bash
eas build --platform ios --profile development
# 또는 production 채널이면:
eas build --platform ios --profile preview
```

이후 시뮬레이터/디바이스에 새 빌드 설치.

## 7. Test 광고 vs 실제 광고

- `__DEV__` (개발): `TestIds.REWARDED` 사용 — Google 공식 테스트 광고
- 운영 빌드: 실제 Ad Unit ID

운영에서 Test ID를 쓰면 노출되지만 수익이 없음. 개발에서 실제 ID를 쓰면 정책 위반 (`Invalid Activity`로 광고 차단됨).

## 8. 검증 체크리스트

- [ ] iOS 시뮬레이터에서 광고 로드 (TestIds.REWARDED)
- [ ] 광고 시청 완료 → `grant_ad_bonus` RPC 호출 확인 (Supabase logs)
- [ ] 1일 5회 광고 후 6번째 시도 → `daily_ad_limit` 거절 확인
- [ ] iOS ATT 팝업 1회 표시 후 권한 거절/허용 모두 광고 표시됨 확인 (광고 추적은 비활성화돼도 광고 자체는 표시됨)

## 9. 정책 주의

- 광고 시청 보상이 "필수 화면"에 게이팅되면 안 됨 (선택 사항이어야 함) — 현재 RateLimitModal에서 BYOK 등록도 같이 제시하므로 OK
- 사용자에게 "광고 시청하면 +2회"라는 보상을 명확히 고지 — 현재 버튼 라벨에 "+2회"로 표기
- 미성년자 타겟 광고 정책: AdMob 콘솔에서 TFCD(Tagged For Child Directed) 비활성화 (LAW.OS는 성인 대상 학습 도구)
