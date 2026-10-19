# FastAPI 백엔드 (무비로그)

Python 3.10 이상. 이 폴더에서 가상환경을 만들고 실행합니다.

macOS / Linux:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Windows PowerShell에서는 가상환경 활성화 없이 다음처럼 실행할 수 있습니다.

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

주소: http://127.0.0.1:8000/api/health . API 문서는 /docs에서 확인할 수 있으나 요청 본문은 공통 API 명세를 읽으세요. 동적 Request로 입력을 검사하므로 Swagger에 상세 필드가 자동 표시되지는 않습니다.

실행 전에 `.env.example`을 `.env`로 복사하고 JWT_SECRET을 새 난수로 바꾸세요. 키가 비었거나 예시 값·형식 오류이면 서버가 시작되지 않습니다. `python -c "import secrets; print(secrets.token_hex(32))"`로 생성할 수 있습니다. `load_dotenv`가 설정을 읽습니다. auth.py가 키의 16진수를 bytes로 변환해 PyJWT HS256 발급·검증에 사용합니다.

`auth.py`는 JWT 발급·검증과 작성자 권한 검사(BE-01~03), `app.py`는 라우트와 입력 검사, `store.py`는 SQLite 저장, `users.py`는 scrypt 비밀번호 검증입니다.

DB는 `data/board.sqlite`에 생성됩니다. 초기화는 서버 종료 후 이 파일만 삭제한 뒤 재실행합니다. 기존 실습 글이 지워집니다. `.env`의 PORT는 참고값이며 uvicorn 포트는 위 --port 옵션으로 지정합니다.

만료 테스트는 `.env`에서 TOKEN_TTL=3으로 바꾸고 서버를 재시작하거나 프로세스 환경변수로 지정하세요. 일반 사용은 90초로 복구합니다.
