# 기억의 서약 — 원본 에셋과 스타일

새 이미지·캐릭터·동작 프레임·VFX 시트를 생성하지 않는다. 사용자 Drive의 원래 프로젝트 에셋을 재사용하며 원본 픽셀을 다시 그리지 않는다. 배포에서 원래 팩을 잘라내던 pruning과 Vercel 제외 규칙을 철회했다.

- 본편 인물: jobm_guardian/sniper/archmage/nightblade/stormcaptain 원본 28장씩. 실제 이동량과 방향에 따라 idle/walk/상하좌우 공격을 재생한다. 기존 registerBodyAnims를 재사용하며 선택 화면도 같은 몸체 계열을 사용한다.
- 보스: 원래 프로젝트 보스 시트 6종의 idle/공격/특수기 원본 클립. 본편 보스 22개 배치에 연결한다. DCSS 초상과 실제 월드 애니메이션은 구분한다.
- 거점: 원래 Player의 직업·장비·스킬·동작을 직접 사용한다. SD 픽셀 인물과 nearest 렌더를 사용하고 직업별 외형 변화를 유지한다.
- 초상: 기존 DialogueBox와 npcportrait/_map.json의 원본 crop. 얼굴이나 표정 프레임을 합성하지 않는다.
- 건물·가구: 온전한 house_a/house_b, furn_*, fm_*, 검증한 objects/를 사용한다. 잘못 분류한 자판기·시트 조각은 거점에 배치하지 않는다. obj_dungeon_table도 실제 그림은 항아리이므로 원래 탁자 furn_table.webp를 사용한다.
- 지형: Drive의 DCSS 원본 32px(CC0) 10개 재질, 기존 원정 맵과 마을. 바닥·구조물·통행을 분리하고 마을의 분수 중심 광장과 건물로 이어지는 통로를 사용한다. 원래 배치 예산과 출입·목표 보호 규칙을 재사용한다.
- 충돌: 원본 불투명 영역을 읽어 수치 JSON으로 기록했다. 그래픽 파일을 만든 것이 아니다. 발밑 단단한 부분에 충돌을 주고 양초·러그는 통행시킨다. 책장 아래 고립 픽셀 같은 여백을 충돌로 쓰지 않는다.
- VFX: 새로 만들었던 sunburst PNG/atlas는 삭제했다. 원래 slash0..5.webp를 1회 재생하고 종료/전환에서 정리한다. 준비 표시·위험 범위는 판정을 읽기 위한 엔진/UI 도형이며 새 그림 파일이 아니다. 강한 효과는 스킬에 제한한다.
- UI: 기존 Galmuri와 lucide 아이콘. 자체 픽셀 아이콘 생성기를 제거했다. 동작 줄이기와 흔들림 설정을 존중한다.
- 음악: 기존 audio.ts의 곡별 게인·효과음 간격·동시 재생 상한을 재사용한다. 제공 녹음을 한 번에 한 곡씩 스트리밍한다.

public/assets/campaign/drive/manifest.json은 원래 경로·규격·선택 파일 SHA-256과 개별 애니메이션 152장과 원본 보스 시트 6종의 원본 해시를 포함한다. 무결성 기록은 라이선스를 새로 부여하는 문서가 아니다. SPUM 등 유료 팩을 CC0로 표시하지 않는다.

Pixel Frog 공식의 별도 TS_old version_CC0 Licensed ZIP도 다운로드했다. 최신 Tiny Swords 팩과 조건을 혼동하지 않는다. ZIP SHA-256은 e4d79bd4514bad153cfa1cc8f4c8d8bf10ed39bf69bd98b83bdc46c03d14bb9c이다. 해당 다운로드는 보관·검토 상태이며 제품에 편입하지 않았다. game-dev CLI가 없는 환경에서 admission 완료를 주장하지 않는다. 현재 적용 이미지는 사용자 원본이다.

기존 라이선스·구매 기록은 public/assets/CREDITS.md, docs/assets_license/, 배포용 campaign/PROJECT_CREDITS.md를 보존한다. 레퍼런스 게임의 인물·대사·전용 그래픽을 추출했다는 이유로 재사용 가능한 것으로 취급하지 않는다.
