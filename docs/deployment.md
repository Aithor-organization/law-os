# LAW.OS Deployment Guide

> **상태**: 초안 (Phase B1~B5 구현 완료 기준). 출시 전 각 섹션을 실제 계정/프로젝트 정보로 교체하세요.

## 최근 빌드 이력 (2026-04-24)

| 빌드 | ID | 결과 | 아티팩트 |
|------|----|------|----------|
| iOS Simulator (development) | `c30f9218-08e6-4c14-a4d8-9e074edde1a4` | ✅ finished | `https://expo.dev/artifacts/eas/q63tqTRXxqiApyYk4U48tS.tar.gz` |
| Android APK (preview) | 5회 시도 모두 errored | ❌ blocked | SDK 52 + RN 0.76 + react-native-worklets 호환성 드리프트 (상세: Brain `FP-EAS-Android-worklets`) |
| iOS TestFlight (preview) | — | ⚠️ blocked | Apple Developer 계정 필수 (credentials 등록 안 됨) |

**iOS Simulator 빌드 사용법**:
```bash
# Mac에서 다운로드 + 압축 해제
curl -L -o /tmp/law-os.tar.gz "https://expo.dev/artifacts/eas/q63tqTRXxqiApyYk4U48tS.tar.gz"
mkdir -p /tmp/law-os && tar -xzf /tmp/law-os.tar.gz -C /tmp/law-os
# Xcode Simulator 실행 후 .app 드래그 드롭, 또는:
xcrun simctl install booted /tmp/law-os/LAW.OS.app
xcrun simctl launch booted kr.lawos.app
```

**Android 빌드 재시도 조건**:
- Expo SDK 53 이상으로 업그레이드 (`npx expo install expo@latest` + 가이드 마이그레이션)
- 또는 `react-native-worklets@^0.4.0` 으로 pin 시도
- iOS는 동일 코드로 빌드 성공 — 플랫폼 별 네이티브 체크 차이

## 실제 등록된 인프라 (2026-04-24 기준)

| 항목 | 값 |
|------|-----|
| EAS 계정 (owner) | `sioxgap409` |
| EAS Project ID | `3da755bb-da5f-47fe-b265-30da2604b01f` |
| EAS Project URL | https://expo.dev/accounts/sioxgap409/projects/law-os |
| EAS Update URL | `https://u.expo.dev/3da755bb-da5f-47fe-b265-30da2604b01f` |
| iOS Bundle ID | `kr.lawos.app` |
| Android Package | `kr.lawos.app` |
| Expo SDK | 52.0.0 |

위 값들은 `mobile/app.json` 과 `mobile/eas.json` 에 이미 반영되어 있습니다.

## 필요한 사용자 계정 (미등록 상태 체크)

| 계정 | 필요 여부 | 현재 상태 |
|------|----------|-----------|
| Apple Developer Program ($99/년) | iOS 출시 필수 | 미등록 (preview iOS 빌드 시 credentials 오류) |
| Google Play Console ($25 1회) | Android 출시 필수 | 미등록 |
| Sentry | 에러 모니터링 | DSN 미등록 (`eas env:list` 비어있음) |
| Supabase Production 프로젝트 | 프로덕션 DB | 미등록 (dev만 있음) |
| Firebase FCM | Android 푸시 | 미등록 (`google-services.json` 없음) |

## 환경 분리 원칙

세 개의 환경을 분리합니다:

| 환경 | 용도 | 데이터 분리 | 접속자 |
|------|------|------------|--------|
| **development** | 개발자 로컬 / iOS Simulator | dev Supabase 프로젝트 | 개발자 |
| **preview** | 내부 베타 (TestFlight · Play 내부 테스트) | prod Supabase 프로젝트 | 베타 테스터 |
| **production** | 정식 출시 (App Store · Play Store) | prod Supabase 프로젝트 | 일반 사용자 |

development와 production의 Supabase 프로젝트를 **반드시 분리**합니다. 이유:

- 개발 중 잘못된 마이그레이션이 프로덕션 데이터에 영향을 주면 안 됨
- RLS 정책 실험은 격리된 프로젝트에서 수행
- 프로덕션 사용자 데이터는 dev 환경에서 절대 열람되면 안 됨

## 1. Supabase 프로젝트 분리

### 1-1. 두 개 프로젝트 생성

Supabase Dashboard (https://app.supabase.com) 에서:

- `lawos-dev` — 개발·테스트 용도
- `lawos-prod` — 정식 출시 용도 (무료 플랜에서 Pro 플랜으로 업그레이드 권장, 백업·point-in-time-recovery 활성화)

두 프로젝트에 모두 `docs/supabase/001_initial_schema.sql` 부터 `014_delete_account_rpc.sql` 까지 순서대로 적용합니다. Supabase Dashboard의 SQL Editor 또는 `psql $DATABASE_URL -f ...`.

### 1-2. 각 프로젝트의 키 추출

Dashboard → Settings → API 에서:

- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `Project API keys → anon (publishable)` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` 키는 서버 전용 — 모바일/웹 앱에 절대 넣지 않음

### 1-3. 로컬 .env.local 설정

개발자 로컬에서 기본적으로 dev 프로젝트에 연결:

```bash
cp .env.local.example .env.local
# .env.local 을 편집해서 dev 프로젝트 키 입력
```

`.env.local` 은 이미 `.gitignore` 에 포함되어 있습니다.

## 2. EAS Build 환경 설정

### 2-1. EAS 초기 설정 (최초 1회)

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure  # eas.json 기존 파일 덮어쓰지 말 것
```

`app.json` 의 `extra.eas.projectId` 와 `updates.url` 이 자동 채워집니다. 저장 후 commit.

### 2-2. 프로덕션 환경 변수 주입

EAS Secret 으로 주입하면 `.env.production` 파일을 저장소에 올리지 않아도 됩니다:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-PROD-REF.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <prod-anon-key>
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value https://XXXX@sentry.io/YYYY
eas secret:list   # 검증
```

`eas.json` 의 production/preview 프로필에서 `env` 블록에 선언하지 않더라도 EAS가 빌드 시 자동 주입합니다.

### 2-3. 빌드 실행

```bash
eas build --profile preview --platform ios     # TestFlight 내부 베타
eas build --profile production --platform all  # App Store + Play Store
```

## 3. Sentry 활성화

### 3-1. 프로젝트 생성

https://sentry.io 에서 `React Native` 프로젝트를 생성합니다. DSN 을 복사:

```
https://<random>@o<org>.ingest.sentry.io/<project-id>
```

### 3-2. SDK 설치

```bash
cd mobile
npm install @sentry/react-native
npx expo prebuild   # native 폴더를 관리하는 경우만
```

`lib/telemetry.ts` 는 이미 통합되어 있습니다. DSN 이 설정되면 자동 활성화됩니다.

### 3-3. EAS Secret 로 DSN 주입 (위 2-2 참조)

프로덕션 빌드는 `EXPO_PUBLIC_SENTRY_DSN` 환경변수만 있으면 자동 활성화됩니다.

### 3-4. 업로드 소스맵 (선택)

스택 트레이스에 원본 파일명·라인 매핑하려면 Sentry CLI 를 빌드 스크립트에 추가. `app.json` plugins 섹션에 `"@sentry/react-native/expo"` 플러그인을 추가하면 EAS Build 가 자동 업로드합니다.

## 4. 푸시 알림 (Apple / Google)

### 4-1. APNs (iOS)

1. Apple Developer Console → Certificates, Identifiers & Profiles
2. Identifier `kr.lawos.app` 에 Push Notifications capability 활성화
3. Keys → 새 Key 생성 → APNs 체크 → .p8 파일 다운로드
4. EAS 에 등록: `eas credentials` → iOS → Push Notifications → Upload Key

### 4-2. FCM (Android)

1. Firebase Console 에서 새 프로젝트 생성
2. Android 앱 등록 (`package name = kr.lawos.app`)
3. `google-services.json` 다운로드 후 `mobile/google-services.json` 에 배치
4. `app.json` android.googleServicesFile 에 경로 추가 (아래 예시)

```json
"android": {
  "package": "kr.lawos.app",
  "googleServicesFile": "./google-services.json"
}
```

### 4-3. Server-side 전송 키

프로덕션 백엔드에서 푸시를 보내려면 Expo Push Token 을 저장하는 `push_tokens` 테이블(015 마이그레이션)을 사용합니다. 자세한 흐름은 `mobile/lib/pushTokens.ts` 주석 참조.

## 5. App Store / Play Store 제출

`eas.json` 의 `submit.production.ios` 에서 `appleId`, `ascAppId`, `appleTeamId` 를 실제 값으로 교체한 뒤:

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

**제출 전 체크**: `docs/production-readiness-checklist.md` 의 출시 체크포인트를 모두 통과해야 합니다.

## 6. 롤백 전략

EAS Update 채널을 사용하면 OTA 로 즉시 롤백 가능:

```bash
eas update:list --channel production
eas update:republish --channel production --group <previous-update-id>
```

심각한 네이티브 레벨 버그는 OTA 로 고칠 수 없으므로 App Store Connect 에서 이전 빌드를 "expedited review" 로 재제출해야 합니다.

---

## 검증 체크리스트

- [ ] `.env.local` 은 dev 프로젝트, `.env.production` 은 prod 프로젝트를 가리키는지 확인
- [ ] EAS Secret 목록에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN` 존재
- [ ] dev/prod Supabase 프로젝트 모두 001~014 마이그레이션 적용 완료
- [ ] App Store Connect 에 `kr.lawos.app` 앱 생성
- [ ] Google Play Console 에 `kr.lawos.app` 앱 생성
- [ ] Sentry RN 프로젝트 생성 + DSN EAS Secret 등록
