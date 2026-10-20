# 🎬 무비로그 — JWT 인증 영화 리뷰 게시판

웹서비스설계 JWT 게시판 과제입니다.

## 작성자와 서비스 소개

- 학번 / 이름: 202413123 / 조이진
- 서비스 목적과 대상 사용자: 영화를 본 뒤 감상을 짧게 남기고 다른 사람의 리뷰를 둘러보고 싶은 관람객을 위한 리뷰 게시판입니다. 누구나 로그인 없이 리뷰를 읽을 수 있고, 로그인한 사용자만 리뷰를 쓸 수 있습니다. 작성한 리뷰는 본인만 수정·삭제할 수 있으며, 이 권한은 화면뿐 아니라 서버에서 JWT로 확인합니다.
- 선택한 기술: React + FastAPI
- 주요 기능: 공개 리뷰 목록·상세 조회, 이메일/비밀번호 로그인과 JWT 발급, 내 정보 조회, 본인 리뷰 작성·수정·삭제, 토큰 만료·변조 시 자동 로그아웃 안내, 로그아웃

## 보고서와 테스트 증거

- [구현 보고서 PDF](docs/report.pdf)
- [테스트 증거](docs/evidence/)
  - [`Test/results.md`](docs/evidence/Test/results.md): T07·T08 재조회, T10~T17, 오류 우선순위 검사의 요청별 HTTP 상태·code·헤더 표
  - `Test/T01.png` ~ `Test/T11.png`: T01~T11 요청·응답 캡처(토큰 원문은 가림), `T10.png`는 만료 후 화면 처리
  - `Test/T02_screen.png`, `Test/T16_before.png`, `Test/T16_after.png`: 4173 빌드 화면의 로그인 표시와 새로고침 후 로그인 해제
  - `Test/browser_T02_T11_T16.txt`: 브라우저 요청의 Authorization 헤더 유무와 응답 로그
  - `Test/check_api_final_1019.txt`: 공통 API 자동 검사 40개 통과(2026-10-19)
  - `Test/check_claims_1019.txt`: 클레임별 거부 검사 18개 통과(2026-10-19)
  - `Test/build_log.txt`, `Test/fresh_install_log.txt`: 프론트 빌드 로그, 새 폴더 설치·빌드·실행 재현 로그
  - `check_api_final_expiry.txt`, `check_claims.txt`: 2026-10-12 구현 완료 시점의 자동 검사 결과(만료 포함 48개, 클레임 18개)

## 프로젝트 구조

```text
.
├── README.md
├── .gitignore
├── frontend/              # React + Vite
│   ├── src/api.js         # 토큰 메모리 보관, Authorization 헤더, 상태 코드 처리 (FE-01~03)
│   ├── src/main.jsx       # 화면, canEdit·로그아웃·오류 안내 (FE-03~04)
│   ├── src/style.css
│   ├── package.json / package-lock.json
│   └── vite.config.js     # /api → 127.0.0.1:8000 프록시 (dev·preview)
├── backend/               # FastAPI
│   ├── app.py             # 라우트, 입력 검사, 오류 응답 변환
│   ├── auth.py            # JWT 발급·검증, 작성자 권한 검사 (BE-01~03)
│   ├── users.py           # 테스트 계정, scrypt 비밀번호 검증
│   ├── store.py           # SQLite 저장소 (data/board.sqlite 자동 생성)
│   ├── errors.py
│   ├── .env.example       # 환경설정 예시 (실제 .env는 제출하지 않음)
│   └── requirements.txt
├── tools/
│   ├── check_api.py       # 제공된 공통 API 검사 스크립트
│   └── check_claims.py    # 추가: 클레임 검증 보조 검사
└── docs/
    ├── report.pdf
    ├── evidence/
    └── 01~07_*.md         # 과제 제공 문서
```

## 실행 환경

| 항목 | 사용 버전 |
|---|---|
| 운영체제 | Windows 11 Education |
| 프론트 런타임 Node.js | v24.15.0 (npm 11.12.1), 요구사항 20.19 이상 |
| 백엔드 런타임 | Python 3.12 (가상환경), 요구사항 3.10 이상 |
| 프레임워크 | React 19.3.0, Vite 8.3.4 / FastAPI 0.143.0, Uvicorn 0.54.0, PyJWT 2.15.1, python-dotenv 1.2.4 |
| 데이터 저장 | SQLite (Python 표준 라이브러리 sqlite3) |

## 설치와 실행

터미널 두 개를 사용합니다. 터미널 A는 백엔드, 터미널 B는 프론트입니다.

### 1 저장소 복제

```sh
git clone https://github.com/zohijin-k/MovieLog
cd MovieLog
```

### 2 백엔드 준비와 실행 (터미널 A)

Windows PowerShell:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(32))"
# 출력된 64자리 값을 .env의 JWT_SECRET= 뒤에 붙여 넣고 저장
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

macOS / Linux:

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
.venv/bin/python -c "import secrets; print(secrets.token_hex(32))"
# 출력된 64자리 값을 .env의 JWT_SECRET= 뒤에 붙여 넣고 저장
.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

- 환경설정 예시 파일: `backend/.env.example`
- JWT_SECRET 설정 방법: 위 명령으로 32바이트 난수를 64자리 16진수로 만들어 `backend/.env`에 넣습니다. `app.py`가 시작할 때 `load_dotenv()`로 읽습니다. 키가 비어 있거나 예시 값(`REPLACE_WITH_...`)이거나 64자리 16진수가 아니면 **서버가 시작되지 않고** `RuntimeError`로 종료됩니다. 실제 키는 커밋하지 않습니다.
- TOKEN_TTL: 기본 90초. 만료 테스트는 `.env`에서 `TOKEN_TTL=3`으로 바꾸고 서버를 재시작합니다. 테스트 후 90으로 되돌립니다.
- 백엔드 주소: http://127.0.0.1:8000
- 정상 실행 확인: http://127.0.0.1:8000/api/health → `{"status":"ok","stack":"fastapi"}`

### 3 프론트 빌드와 로컬 실행 (터미널 B)

백엔드를 켜 둔 채 새 터미널에서 실행합니다. Windows와 macOS/Linux 명령이 같습니다.

```sh
cd frontend
npm ci
npm run build
npm run preview
```

- 최종 확인 주소: http://127.0.0.1:4173
- 개발 중 실행: `npm run dev`, http://127.0.0.1:5173
- API 연결 방식: 브라우저는 같은 출처의 `/api/...`로 요청하고, Vite preview(4173)·dev(5173) 서버가 `vite.config.js`의 프록시 설정으로 `http://127.0.0.1:8000`에 전달합니다. 백엔드 포트를 바꾸면 `server.proxy`와 `preview.proxy`를 함께 수정합니다.
- 종료: 프론트와 백엔드를 실행한 각 터미널에서 Ctrl+C
- 코드 변경 후 재실행: 프론트는 preview를 종료하고 `npm run build` → `npm run preview`, 백엔드는 Ctrl+C 후 uvicorn 명령을 다시 실행합니다.

### 4 테스트 계정과 DB

| 사용자 | ID | 이메일 | 실습용 비밀번호 |
|---|---|---|---|
| Alice | 1 | alice@class.test | Classroom!2026 |
| Bob | 2 | bob@class.test | Classroom!2026 |

- SQLite 파일 위치: `backend/data/board.sqlite`. 서버를 처음 시작할 때 폴더와 `posts` 테이블이 자동 생성됩니다. 테스트 계정은 서버 시작 시 메모리에 준비됩니다.
- DB 초기화: 백엔드를 Ctrl+C로 종료한 뒤 `backend/data/board.sqlite`만 삭제하고 다시 실행합니다. 모든 리뷰가 지워집니다.
- 서버 재시작 후 데이터 유지: 백엔드를 종료하고 다시 실행한 뒤 기존 리뷰(작성자 Alice, 제목·내용)가 그대로 조회되는 것을 확인했습니다. 2026-10-19 T15에서 15번 글의 제목·작성자·updatedAt이 재시작 전후로 같았습니다(`docs/evidence/Test/results.md`).

위 계정은 과제 전용 테스트 계정입니다.

## 구현 완료 범위

| 기능 | 완료 여부 | 주요 파일 또는 함수 |
|---|---|---|
| 공개 목록과 상세 | 완료 | `backend/app.py` `list_posts`·`get_post` / `frontend/src/api.js` `api.list`·`api.detail` |
| 로그인과 JWT 발급 | 완료 | `backend/auth.py` `issue_token`, `_load_secret` / `frontend/src/api.js` `login` |
| JWT 검증과 내 정보 조회 | 완료 | `backend/auth.py` `current_user_id`, `_bearer_token` / `backend/app.py` `me` |
| 글 작성과 작성자 저장 | 완료 | `backend/app.py` `create` (작성자 = 검증된 sub) |
| 본인 글 수정·삭제 | 완료 | `backend/auth.py` `assert_owner` / `frontend/src/api.js` `canEdit` |
| 토큰 만료와 로그아웃 | 완료 | `frontend/src/api.js` `request`(401 시 `clearSession`) / `frontend/src/main.jsx` `logout` |
| 입력 오류와 권한 오류 처리 | 완료 | `backend/app.py` `fields`·예외 처리기 / `frontend/src/main.jsx` `describe` |

알려진 문제와 미완성 기능: 없음

## 테스트 방법과 결과 요약

- 실행한 검사 명령과 실행 위치 (저장소 루트, 백엔드 실행 중):
  - `python tools/check_api.py --mode final` → 40개 통과
  - 백엔드를 `TOKEN_TTL=3`으로 재시작 후 `python tools/check_api.py --mode final --expiry` → 48개 통과
  - `backend/.venv/Scripts/python.exe tools/check_claims.py` → 18개 통과 (macOS/Linux는 `backend/.venv/bin/python`)
- Alice/Bob 권한 구분: Bob 토큰으로 Alice 글 PUT·DELETE → 403 FORBIDDEN, 재조회 시 원문 유지. Bob 화면에서는 Alice 글의 수정·삭제 버튼이 보이지 않음.
- HTTP 상태와 오류 code: 200(조회·로그인·수정), 201(등록), 204(삭제), 400 BAD_INPUT(공백·길이 초과·추가 필드·잘못된 ID), 401 INVALID_CREDENTIALS / TOKEN_REQUIRED / INVALID_TOKEN / TOKEN_EXPIRED, 403 FORBIDDEN, 404 NOT_FOUND 확인.
- 응답 헤더와 본문: 201에 `Location: /api/posts/{id}`, 보호 API 401에 `WWW-Authenticate: Bearer`, 204는 본문 0바이트.
- 우선순위: 토큰 없이 없는 글 수정 → 401 TOKEN_REQUIRED, 정상 토큰으로 없는 글 수정 → 404, Bob이 Alice 글에 공백 제목 → 403, Alice가 자기 글에 공백 제목 → 400.
- 토큰 없음·변조·만료: 각각 401 TOKEN_REQUIRED / INVALID_TOKEN / TOKEN_EXPIRED. HS512·alg=none·다른 키·iss/aud 불일치·exp/sub/iss/aud 누락·없는 사용자도 INVALID_TOKEN.
- 전체 T01~T17 결과와 증거: [보고서 4절](docs/report.pdf), [docs/evidence/](docs/evidence/)

## 핵심 구현 설명

1. **로그인**: 프론트 `login()`이 `POST /api/auth/login`으로 email·password JSON을 보냅니다. 서버는 `verify_credentials`(scrypt)로 확인한 뒤 `issue_token`이 HS256으로 `sub`(사용자 ID 문자열), `iat`, `exp`, `iss=webservice-class`, `aud=board-api`를 담아 서명합니다. 비밀번호·해시는 토큰에 넣지 않습니다.
2. **토큰 보관·전송**: 응답의 `accessToken`과 `user`는 `api.js`의 모듈 변수에만 저장합니다. `authorizationHeaders()`는 토큰이 있을 때만 `Authorization: Bearer <JWT>`를 붙입니다. 새로고침하면 메모리가 비워져 로그아웃됩니다.
3. **서버 검증**: `current_user_id`가 Bearer 형식을 확인하고, `jwt.decode`로 알고리즘(HS256 고정), 서명, `exp`, `iss`, `aud`, 필수 클레임을 검증합니다. 이어서 `sub` 형식과 실제 계정 존재를 확인하고, 그 사용자 ID만 라우트에 넘깁니다.
4. **작성자 권한**: 등록 시 작성자는 요청 본문이 아니라 검증된 사용자 ID로 저장합니다. 본문에 추가 필드가 있으면 400입니다. 수정·삭제는 인증 → 글 존재(404) → `assert_owner`(DB authorId와 비교, 403) → 입력 검증(400) → 변경 순서로 처리합니다.

## AI 활용 요약과 참고 자료

- AI 사용 여부: 사용
- 도구와 사용 목적: Claude Code (Claude Opus 5.5) — 제공 시작 코드 분석, BE-01~03·FE-01~04 구현, 테스트 스크립트 작성과 실행
- 반영 위치: `backend/auth.py`, `backend/app.py`, `backend/.env.example`, `frontend/src/api.js`, `frontend/src/main.jsx`, `frontend/src/style.css`, `tools/check_claims.py`, 이 README
- 직접 수정·검증한 내용: T01~T17을 직접 실행해 HTTP 상태·JSON code·응답 헤더를 확인함(`docs/evidence/Test/results.md`). 테스트 중 T05가 401 TOKEN_EXPIRED로 실패한 원인이 TTL 90초 경과임을 로그인·요청 시각 비교로 확인하고, 테스트 블록마다 토큰을 새로 받도록 절차를 바꿔 재검증함. 자동 검사(check_api 40개, check_claims 18개)를 현재 서버에서 다시 실행해 통과를 확인하고, 실제 파일과 다르던 README 증거 목록을 수정함. GitHub에서 새 폴더로 clone해 README 명령만으로 설치·빌드·실행되는 것을 확인함(2026-10-20).
- 상세 활용 기록: [보고서 5절](docs/report.pdf)
- 참고 자료: 과제 제공 문서(`docs/02_API명세.md` 등), PyJWT 사용법 https://pyjwt.readthedocs.io/en/stable/usage.html, FastAPI 문서 https://fastapi.tiangolo.com/

## 제출 확인

- [x] README의 안내 문구를 실제 내용으로 교체했다.
- [x] 새 폴더에 clone하여 README만으로 설치·환경설정·빌드·로컬 실행했다.
- [x] 4173번 빌드 화면에서 API 연결과 전체 필수 기능을 확인했다.
- [ ] GitHub에서 보고서와 증거 링크가 열린다.
- [ ] 교수자가 저장소를 열람·복제할 수 있다.
- [x] 비밀 키·실제 토큰·DB·node_modules·.venv·target을 커밋하지 않았다(.gitignore 설정).
- [ ] 최종 push 후 저장소 URL과 제출 기준 커밋 SHA를 LMS에 제출했다.
