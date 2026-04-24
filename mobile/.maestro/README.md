# LAW.OS Mobile E2E Tests (Maestro)

Maestro 를 선택한 이유:
- Detox 대비 설치·유지보수 비용 낮음 (단일 YAML, 네이티브 빌드 수정 없음)
- iOS Simulator · Android Emulator · 실기기 동일 스크립트
- CI 통합 쉬움 (`maestro test .maestro/`)

## 실행

### 1. Maestro CLI 설치 (로컬 1회)

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
maestro --version   # 검증
```

### 2. 앱 빌드 후 시뮬레이터 설치

```bash
cd mobile
npx expo prebuild    # 최초 1회만 (ios/, android/ 디렉토리 생성)
npx expo run:ios     # Simulator 에 dev 빌드 설치
```

### 3. 테스트 실행

```bash
cd mobile
maestro test .maestro/auth-flow.yaml
maestro test .maestro/               # 전체
```

## 테스트 시나리오

| 파일 | 흐름 | 소요 (추정) |
|------|------|-------------|
| `auth-flow.yaml` | 회원가입 → 첫 채팅 전송 → 디스클레이머 배너 확인 | 90s |
| `bookmark-flow.yaml` | 조문 검색 → 북마크 토글 → 프로필 카운트 갱신 확인 | 60s |
| `delete-account-flow.yaml` | 로그인 → 계정 삭제 흐름 → 재로그인 불가 확인 | 45s |

## 테스트 데이터

- `appId: kr.lawos.app` — app.json 과 일치해야 함
- 테스트 계정: `e2e-<timestamp>@lawos-test.kr` — 충돌 회피
- 테스트 격리: 각 테스트 종료 시 `delete-account-flow.yaml` 동일 RPC 호출로 정리

## CI 통합

`.github/workflows/mobile-ci.yml` 에 `e2e` job 을 추가하려면:
1. macOS runner 사용 (ubuntu 는 iOS Simulator 불가)
2. `runs-on: macos-14`
3. Xcode · Maestro 설치 step 추가
4. `npx expo run:ios --device` 후 `maestro test .maestro/`

현재는 로컬 수동 실행만 문서화 (CI runner 비용 vs 신뢰성 trade-off — 출시 직전에 활성화 권장).
