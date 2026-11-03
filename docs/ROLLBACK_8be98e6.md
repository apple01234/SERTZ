# 2026-11-03 사용자 지정 복원

게임 소스, 원본 런타임 에셋, 패키지와 빌드 설정을 커밋
`8be98e655a22099f95e9e44b16d25839e977e4d9` 시점으로 복원했다.
이후 변경을 제거한 새 커밋으로 반영하므로 기존 Git 이력은 유지한다.

보존한 리버스 엔지니어링 자료:

- `docs/campaign/REFERENCE_ANALYSIS.md`, `REFERENCE_DEEP_ANALYSIS.md`
- `docs/campaign/REFERENCE_LEDGER.json`, `REFERENCE_DEEP_EVIDENCE.json`, `JENNY_EVIDENCE.json`
- `skills/`의 REA 스킬·참조 문서·라이선스와 기존 개발 스킬
- `.mcp.json`, `scripts/rea-mcp.mjs`, `scripts/campaign-mcp.mjs`
- `worklog.md`의 기존 분석·검증 이력

이 문서들은 이전 구현의 분석/검증 기록이다. 문서가 참조하는 새 캠페인 코드나
테스트는 현재 복원본에 없을 수 있으며, 현재 게임 동작을 보증하지 않는다.
REA 적용 코드를 포함한 복원 직전 전체 소스는 SERTZ의
`backup/before-8be98e6-rollback-20261103` 브랜치에 보존한다
(기준 `b4631b74dc5cbf6e6efd37bfec52120df9556eaf`).
로컬의 원본 다운로드·추출물과 REA 설치 디렉터리는 변경하지 않았다.
