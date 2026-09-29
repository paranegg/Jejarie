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

## 2차 운영 구조

- `/work/`: 게시 상태의 전체 시공사례와 카테고리 필터
- `/work/detail/?id=...`: 개별 시공사례
- `/admin/`: 시공사례 CRUD, 후기, 메인 노출, GAS 업무 가계부 연결
- `cases.json`: HOME과 WORK가 함께 사용하는 단일 콘텐츠 원본
- `site-settings.json`: 업무 가계부 연결 주소

현재 사진은 브라우저에서 긴 변 기준 1600px, 약 1MB 이하 JPEG로 최적화한 뒤 GitHub `uploads/`에 저장합니다. 별도 서비스 비용이 없고 현재 배포 구조와 가장 단순하게 맞습니다. 저장소가 커져 운영이 느려지는 시점에는 프로젝트 스키마를 유지한 채 이미지 주소만 Vercel Blob, Cloudinary 또는 S3 호환 저장소로 옮길 수 있습니다.

## WORK 정적 상세페이지

Vercel은 배포할 때 `node scripts/build-work-pages.js`를 실행합니다. 이 스크립트는 게시된 `cases.json` 데이터를 읽어 `/work/{slug}/index.html`과 `sitemap.xml`을 생성합니다. 따라서 관리자가 시공사례를 게시하면 별도 HTML 수정 없이 검색 가능한 상세 문서와 sitemap이 함께 갱신됩니다.

- `slug`는 영문 소문자, 숫자, 하이픈만 사용합니다.
- 한번 공개한 slug는 기존 링크 보존을 위해 가급적 변경하지 않습니다.
- slug가 없는 이전 데이터는 `project-{id 앞 8자리}`로 안전하게 생성됩니다.
- `seoTitle`과 `metaDescription`을 비우면 제목·카테고리·설명에서 자동 생성합니다.
- `/work/detail/?id=...` 기존 링크는 공개 데이터에서 slug를 찾아 새 URL로 이동합니다.

`비공개`는 웹사이트 노출 제어입니다. 공개 GitHub 저장소에는 민감한 내부 정보나 고객 개인정보를 기록하지 않습니다.
