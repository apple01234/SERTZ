# fp 계정의 웹 배포

- 게임 공개 주소: https://sertz2.vercel.app
- 소스 저장소: https://github.com/apple01234/SERTZ — main.
- Vercel 팀: fp (apple01234s-projects).
- 프로젝트: sertz.
- 프로젝트 ID: prj_iEfvcVgW790vIycqJBcix7T1R9wR.
- 대시보드: https://vercel.com/apple01234s-projects/sertz
- 최초 확인한 프로덕션 배포: dpl_FnKCF5YjC6XFbCyqstUcMr8QgGzf, READY.
- 해당 배포의 소스 커밋: 727cab78ac64506269c167a9020d82c1b5be4968.
- Git main 푸시 자동 배포 검증: dpl_64iPHqsniQDo9ipscmz4XU8wM5hx, 커밋 4a94b0d4b443dde04268bb7bd1a23087eb9f9d53. GitHub Vercel 검사에서 Deployment has completed / success 확인.

검증된 CERTZ f914541의 게임 로직을 SERTZ 초기 main 이력을 보존해 가져왔다. 기존 master는 변경하지 않았다. 원래 게임의 AGPL 라이선스를 유지하고 초기 SERTZ MIT 문서는 docs/licenses에 별도 보관한다. 에셋 라이선스는 각 팩 조건을 따른다.

Node 24.x, npm ci, npm run build:next를 사용한다. 최초 배포는 .vercelignore에 따라 선별한 추적 파일을 직접 업로드했다. 이후 프로젝트 조회에서 Git 연결 apple01234/SERTZ와 productionBranch main을 확인했다. main 푸시가 실제로 새 프로덕션 배포를 생성하고 성공하는 것까지 확인했다. 토큰은 소스·설정에 저장하지 않는다.

공개 주소는 Vercel 로그인 없이 열리며 이미지/음악 113개가 실제 미디어로 HTTP 200을 반환했다. 해당 배포의 Chromium 검사에서 첫 장 완료·중복 보상 방지·저장 복원·레거시 저장 보존·보스 승리/복귀·모바일 HUD·저장 오류 백업 다운로드를 통과했다. 협동 브라우저 검사는 배포된 프런트엔드와 로컬 테스트 전투 서버/모의 계정 HTTP를 사용하므로, 운영 협동 서버가 배포됐다는 뜻은 아니다.

게스트 본편은 기기 저장으로 플레이한다. 계정·클라우드·실결제 및 상시 협동 서버는 OPERATIONS.md의 운영 설정과 별도 서버가 필요하다. Vercel 배포만으로 해당 운영 서비스가 준비됐다고 표시하지 않는다.

프로젝트 기본 도메인 변경에 따라 최종 공개 주소를 sertz2.vercel.app로 기록했다. 이 주소에서도 캐릭터 생성·안내자 대화·새로고침 후 저장 복원과 에셋 오류 없음의 브라우저 검사를 통과했다.
