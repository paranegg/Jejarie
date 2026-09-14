# 제자리에 관리자 설정

Vercel 프로젝트의 **Settings → Environment Variables**에서 아래 값을 추가한 뒤 다시 배포합니다.

- `ADMIN_PASSWORD`: 관리자 화면에서 사용할 비밀번호
- `SESSION_SECRET`: 길고 임의적인 문자열 (32자 이상 권장)
- `GITHUB_TOKEN`: `paranegg/Jejarie` 저장소 Contents 읽기/쓰기 권한이 있는 GitHub fine-grained token

필요한 경우에만 아래 값을 추가합니다. 기본값은 현재 저장소에 맞춰져 있습니다.

- `GITHUB_OWNER` (기본값: `paranegg`)
- `GITHUB_REPO` (기본값: `Jejarie`)
- `GITHUB_BRANCH` (기본값: `main`)

설정 후 `https://www.jejarie.com/admin/`에서 로그인할 수 있습니다.
