# LAW.OS Mobile — iOS & Android Release Guide

Expo Application Services (EAS) build/submit pipeline.

## One-time Setup

### 1. Accounts

| Store | Account | Cost |
|---|---|---|
| Apple | [Apple Developer Program](https://developer.apple.com/programs/) | $99/year |
| Google | [Google Play Console](https://play.google.com/console) | $25 one-time |
| Expo | [expo.dev](https://expo.dev) | Free |

### 2. Install tooling

```bash
npm i -g eas-cli
eas login
```

### 3. Initialize EAS in this repo

```bash
cd mobile
eas init
# This creates a project on Expo servers and writes the projectId into app.json
# Update app.json:
#   "extra.eas.projectId": "<generated>"
#   "updates.url": "https://u.expo.dev/<generated>"
#   "owner": "<your-expo-username>"
```

### 4. Environment variables

Two ways to configure per-profile env:

**Option A (committed): `eas.json` env blocks** — already set for the 3 profiles (development/preview/production).

**Option B (secret): EAS server-side secrets**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value https://api.lawos.kr
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://...supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your-anon-key>
```
Secrets take precedence over `eas.json` env blocks.

### 5. Store credentials

```bash
# iOS — EAS will walk you through certificate & provisioning profile creation.
eas credentials

# Android — either let EAS generate a keystore (recommended) or upload yours.
# Run during first production build; prompts appear.
```

## Release Workflow

### Development build (debug, on simulator)

```bash
eas build --profile development --platform ios
# Run on iOS Simulator after build completes.

eas build --profile development --platform android
# Install APK on emulator or device.
```

### Preview build (TestFlight / Internal Testing)

```bash
eas build --profile preview --platform all
# Install the resulting .ipa on TestFlight invitees, .apk on Android testers.
```

### Production build (App Store / Play Store)

```bash
# 1. Update version in app.json (manual) — e.g., 1.0.0 → 1.0.1
# 2. Build
eas build --profile production --platform all
# 3. Submit to stores
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

`autoIncrement: true` in `eas.json:production` bumps iOS `buildNumber` and Android `versionCode` automatically on each build.

## Over-the-Air (OTA) Updates — after initial release

For bug fixes without re-submitting to stores:

```bash
# Publish to a channel (matches eas.json channel)
eas update --channel production --message "Fix citation modal crash"

# Rollback if needed
eas update:rollback --branch production
```

OTA can only change JS; native code changes require a new build.

## Release checklist

- [ ] app.json `version` bumped (semver)
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to live Railway URL
- [ ] Backend `/health` returns 200 at that URL
- [ ] Store listings updated (Korean + English, screenshots, description)
- [ ] Privacy policy URL live at `https://lawos.kr/legal/privacy`
- [ ] Terms of service URL live at `https://lawos.kr/legal/tos`
- [ ] App Store review info (test account with sample flows) prepared
- [ ] Export compliance: `usesNonExemptEncryption: false` set (HTTPS only = exempt)
- [ ] TestFlight / Internal Testing: at least 5 testers × 2 days

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| iOS build fails: "Missing entitlements" | Re-run `eas credentials` for iOS. |
| Android build fails: "Keystore not found" | Let EAS generate: `eas credentials → Android → Generate new keystore`. |
| App can't connect to backend | `EXPO_PUBLIC_API_BASE_URL` missing/wrong. Check `eas secret:list`. |
| Apple review rejection: export compliance | Confirm `ITSAppUsesNonExemptEncryption: false` in `ios.infoPlist`. |
| "Cannot read property of undefined" crash on startup | Expo Updates not yet published. First build must complete before `eas update` works. |
