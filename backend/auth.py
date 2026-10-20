import os, re
from datetime import datetime, timedelta, timezone

import jwt

from errors import ApiError
from users import find_public

ALGORITHM = "HS256"
EXAMPLE_SECRET = "REPLACE_WITH_RANDOM_64_HEX_CHARACTERS"


def _load_secret():
    # 서버 시작 시 한 번 검사: 빈 키, 예시 키, 64자리 16진수가 아닌 키는 거부한다.
    raw = os.getenv("JWT_SECRET", "").strip()
    if not raw or raw == EXAMPLE_SECRET:
        raise RuntimeError(
            "JWT_SECRET이 비어 있거나 예시 값입니다. .env에 새 난수 키를 설정하세요."
        )
    if not re.fullmatch(r"[0-9a-fA-F]{64}", raw):
        raise RuntimeError("JWT_SECRET은 64자리 16진수(32바이트)여야 합니다.")
    key = bytes.fromhex(raw)
    if len(set(key)) == 1:
        raise RuntimeError("JWT_SECRET이 단순 반복 값입니다. 새 난수 키를 사용하세요.")
    return key


def _load_ttl():
    try:
        ttl = int(os.getenv("TOKEN_TTL", "90"))
    except ValueError:
        raise RuntimeError("TOKEN_TTL은 양의 정수(초)여야 합니다.")
    if ttl <= 0:
        raise RuntimeError("TOKEN_TTL은 양의 정수(초)여야 합니다.")
    return ttl


SECRET = _load_secret()
TOKEN_TTL = _load_ttl()
ISSUER = os.getenv("JWT_ISSUER", "webservice-class")
AUDIENCE = os.getenv("JWT_AUDIENCE", "board-api")


def issue_token(user):
    # BE-01: 공개 사용자 정보 중 id만 sub로 넣는다. 비밀번호, 해시는 넣지 않는다.
    now = datetime.now(timezone.utc)
    claims = dict(
        sub=str(user["id"]),
        iat=now,
        exp=now + timedelta(seconds=TOKEN_TTL),
        iss=ISSUER,
        aud=AUDIENCE,
    )
    return jwt.encode(claims, SECRET, algorithm=ALGORITHM)


def _bearer_token(request):
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token or " " in token:
        raise ApiError(401, "TOKEN_REQUIRED", "로그인이 필요합니다.")
    return token


def current_user_id(request):
    # BE-02: Bearer 추출 → 서명/알고리즘/만료/클레임 검증 → 실제 사용자 확인.
    token = _bearer_token(request)
    try:
        claims = jwt.decode(
            token,
            SECRET,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            options={"require": ["exp", "iss", "aud", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise ApiError(
            401, "TOKEN_EXPIRED", "로그인 시간이 만료되었습니다. 다시 로그인하세요."
        )
    except jwt.InvalidTokenError:
        raise ApiError(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다.")
    sub = claims["sub"]
    if not isinstance(sub, str) or not re.fullmatch(r"[1-9][0-9]*", sub):
        raise ApiError(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다.")
    user = find_public(int(sub))
    if not user:
        raise ApiError(401, "INVALID_TOKEN", "사용자를 확인할 수 없습니다.")
    return user["id"]


def assert_owner(user_id, author_id):
    # BE-03: 검증된 로그인 사용자와 DB에 저장된 작성자를 비교한다.
    if user_id != author_id:
        raise ApiError(403, "FORBIDDEN", "본인이 작성한 글만 수정·삭제할 수 있습니다.")
