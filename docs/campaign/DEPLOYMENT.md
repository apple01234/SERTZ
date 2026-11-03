# fp 계정의 새 웹 배포

- 소스 저장소: https://github.com/apple01234/SERTZ — main.
- Vercel 팀: fp (apple01234s-projects).
- 새 프로젝트 이름: certz-memory-oath.
- 소스 기준: CERTZ f914541의 검증된 게임. SERTZ 초기 main 이력을 보존해 통합했다. 기존 master 브랜치는 변경하지 않는다.
- 빌드: Node 24.x, npm ci, npm run build:next. 업로드는 .vercelignore를 따르며 .env/비밀키/계정 DB/로컬 빌드를 포함하지 않는다.
- 현재 계정은 GitHub 로그인 연결이 없어 소스를 직접 업로드한다. 이후 GitHub push의 자동 배포는 별도 Git 연결이 필요하다.
- 게스트 스토리는 기기 저장으로 작동한다. 계정·클라우드·결제는 OPERATIONS.md의 설정이 필요하며, 실시간 협동 서버는 Vercel 웹 함수와 별도로 운영해야 한다.

원래 게임의 AGPL 라이선스를 보존한다. SERTZ 초기 저장소의 MIT 문서는 docs/licenses에 보관하며 게임/에셋의 기존 라이선스를 바꾸지 않는다.
