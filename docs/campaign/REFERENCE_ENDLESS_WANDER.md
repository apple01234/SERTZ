# Endless Wander 참고 적용 — 2026-11-17

대상: 사용자 제공 `Endless-Wander-v4.2.1-mod-apkvision.apk` → `apple01234/SERTZ`, 기준 커밋 `5f6a31359bfba8b3f5a37e707eb35e1899171e68`. 사용자가 이 대화에서 APK 분석 허가를 확인했다. Godot 포트는 수정하지 않았다.

## 관찰과 해석

증거 원문은 [REFERENCE_ENDLESS_WANDER_EVIDENCE.json](REFERENCE_ENDLESS_WANDER_EVIDENCE.json)에 파일 SHA-256, 크기, ZIP 멤버, IL2CPP 문자열의 정확한 파일 오프셋과 함께 기록했다.

| 증거 | 직접 확인한 사실 | 적용 판단 |
| --- | --- | --- |
| EW-ARCH-01 | `libunity.so`, `libil2cpp.so`, 메타데이터 버전 31 | Unity IL2CPP 빌드라는 정적 구조 확인. Phaser 게임을 다른 엔진으로 바꿀 이유는 없다. |
| EW-SYM-01~02 | `BufferActionIfRelevant`, `_timeToBufferAction` 식별자 | 행동 예약이라는 설계 방향의 단서. 실제 메서드 구현·예약 시간·우선순위는 확인하지 못했다. |
| EW-SYM-03~04 | `RefreshCharacterSkillCooldownAndCharges`, `SetSkillRemainingCooldown` 식별자 | 쿨다운 관리 구조의 단서. SERTZ의 실제 쿨다운과 UI 입력을 일치시키는 개선을 선택했다. |
| EW-ASSET-01, EW-SYM-05~07 | 속성별 번들 8개와 `AffixSchool`, `AffixesAndUpgradesBySchool`, `BiElemSynergy` 식별자 | 속성별 강화/시너지 구조가 있다는 단서. SERTZ에 이미 속성·잠재옵션·세트 효과가 있으므로 별도 중복 성장 시스템은 추가하지 않았다. |

식별자 존재와 엔진 구성은 직접 관찰로 신뢰도가 높다. 식별자만으로 추정하는 플레이 동작은 미확인이다. 제공 파일은 수정 배포본이며 공식 버전 전체의 동작으로 일반화할 수 없다. REA MCP/CLI는 연결되지 않아 사용하지 않았고, Linux 작업 공간의 Python 표준 라이브러리 `zipfile`, `struct`, `hashlib`로 정적 확인했다. APK 설치·실행·서버 접속·메서드 전체 역컴파일은 하지 않았다.

## SERTZ 변경

1. **쿨다운 종료 직전 입력 보관.** 기존 `SkillInputBuffer`가 `idle`만 검사한 뒤 입력을 소비하던 문제를 고쳤다. 스킬 6종 모두 실제 남은 쿨다운이 0이 될 때까지 요청을 유지한다. 300ms 보관 시간, 최신 입력 우선, 발동 전 비우기, MP/해금 조건의 Player 재검사를 유지한다. 300ms는 SERTZ의 기존 값이며 APK에서 복원한 수치가 아니다.
2. **키보드와 터치 경로 통합.** 키보드 6종은 버퍼를 우회해 `Player.useSkillN()`을 직접 호출하고 있었다. 기존 터치 이벤트와 같은 `queueSkill()`을 사용한다. 대화·수면·전환·채팅·패널·텍스트 입력 중에는 예약을 제거하고, 입력 리셋과 씬 정리에서도 비운다.
3. **사용 가능 상태 구분.** 충분한 MP가 있을 때 쿨다운 마지막 300ms의 터치 입력을 받되 실제 발동 시점은 게임이 판정한다. MP 부족 배지, 재사용 대기 설명, 1초 미만 소수 초를 표시한다. 접근성 이름/툴팁과 네이티브 버튼 키보드 활성화도 지원하며 포인터 클릭이 두 번 발동하지 않게 한다.

원본 게임의 코드·이미지·음악·번들을 SERTZ에 편입하지 않았다. 새 게임 의존성, 세이브 필드, 전직·데미지·MP 소비량·쿨다운 수치 변경도 없다.

## 검증

- 수정 전 입력 추출 검사 12개 통과. 수정 후 같은 검사와 쿨다운 회귀 검사 14개 통과.
- `node --test --import ./tests/ts-resolve-hook.mjs tests/*.test.mjs`: 45개 중 43개 통과. 나머지 두 파일은 기존 `/root/workspace/CERTZ/` 절대 import 때문에 실행 실패했으며, 임시 Node resolve hook으로 현재 체크아웃에 매핑해 각각 통과했다. 추적 테스트의 기존 절대 경로는 변경하지 않았다.
- 신규 버튼 렌더 검사: 300ms 경계·소수 초·MP 부족 차단/설명 통과.
- `npx prisma generate`, `npx tsc --noEmit`, `npm run build:next` 통과.
- 변경한 TS/TSX 4개 파일의 ESLint `--max-warnings 0` 통과.
- 프로덕션 standalone 서버와 Chromium에서 7개 브라우저 시나리오 통과: 쿨다운 대기, 단일 대시/MP 차감, 실제 키보드 매핑의 모션 중 예약, 입력 잠금/리셋, Enter·Space 단일 활성화와 채팅 충돌 방지, MP 부족 표시/차단, 844×390 터치 입력. 페이지 JavaScript 예외 0개. 온라인 API 인증/연결 성공을 의미하지 않는다.
- 전체 `npm run lint:strict`는 수정하지 않은 DialogueBox/HUD/UnionPanel의 5개 오류와 AuthPanel/ChatBox의 경고 2개로 실패한다. 원본 파일과 설치된 린터 조합의 기존 결과이며 이 변경으로 해결했다고 주장하지 않는다.
- 기존 `npm test` 스크립트는 `--test` 없이 따옴표로 감싼 glob을 Node에 넘겨 실행되지 않는다. 위의 명시적 테스트 명령으로 검증했다.

브라우저 검증 명령: 프로덕션 서버 실행 후 `node scripts/re/verify_skill_input.cjs`. `SERTZ_TEST_URL`, `SERTZ_CHROMIUM`, `SERTZ_TEST_OUT`으로 로컬 테스트 주소·Chromium 경로·산출물 위치를 지정할 수 있다. 기본 산출물은 Git 제외된 `.fxtest/skill-input/`에 기록한다. 월드 진입 뒤 Phaser 루프를 멈추고 실제 DOM/이벤트 핸들러와 명시적 쿨다운 변경을 사용해 검증하며, 마지막 화면 캡처 전 루프를 재개한다. 일반 플레이의 성능 측정은 아니다.

온라인 계정·결제·네이티브 APK 설치·운영 배포 검증은 범위 밖이다.

## 되돌리기

이 변경의 커밋만 `git revert`하면 기존 입력/버튼으로 복구된다. 세이브 마이그레이션은 필요하지 않다. 분석 대상 APK와 중간 추출물은 저장소 밖에 보관한다.
