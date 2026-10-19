#!/usr/bin/env python3
"""JWT 클레임 검증 보조 검사.

로컬 실습 키(backend/.env의 JWT_SECRET)로 직접 서명한 토큰을 만들어
서명은 정상이지만 클레임이 잘못된 경우를 서버가 거부하는지 확인합니다.
backend 가상환경의 Python(PyJWT 포함)으로 실행합니다.

    backend/.venv/Scripts/python.exe tools/check_claims.py   (Windows)
    backend/.venv/bin/python tools/check_claims.py           (macOS/Linux)
"""
import base64, json, sys, time, urllib.error, urllib.request, warnings
from pathlib import Path

import jwt

warnings.filterwarnings("ignore", category=jwt.warnings.InsecureKeyLengthWarning)

BASE = "http://127.0.0.1:8000/api"
env = Path(__file__).resolve().parent.parent / "backend" / ".env"
values = dict(
    line.split("=", 1)
    for line in env.read_text(encoding="utf-8").splitlines()
    if "=" in line and not line.lstrip().startswith("#")
)
KEY = bytes.fromhex(values["JWT_SECRET"].strip())
ISS = values.get("JWT_ISSUER", "webservice-class").strip()
AUD = values.get("JWT_AUDIENCE", "board-api").strip()


def call(method, path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token is not None:
        headers["Authorization"] = token
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read() or "null"), r.headers
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or "null"), e.headers


def claims(**override):
    base = dict(sub="1", iss=ISS, aud=AUD, exp=int(time.time()) + 60)
    base.update(override)
    return {k: v for k, v in base.items() if v is not None}


def sign(payload, alg="HS256", key=KEY):
    return jwt.encode(payload, key, algorithm=alg)


def b64(obj):
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=").decode()


cases = [
    ("정상 토큰(대조군)", "Bearer " + sign(claims()), 200, None),
    ("HS512 알고리즘", "Bearer " + sign(claims(), "HS512"), 401, "INVALID_TOKEN"),
    ("alg=none 서명 없음", "Bearer " + b64({"alg": "none", "typ": "JWT"}) + "." + b64(claims()) + ".", 401, "INVALID_TOKEN"),
    ("다른 키로 서명", "Bearer " + sign(claims(), key=b"x" * 32), 401, "INVALID_TOKEN"),
    ("iss 불일치", "Bearer " + sign(claims(iss="evil-issuer")), 401, "INVALID_TOKEN"),
    ("aud 불일치", "Bearer " + sign(claims(aud="other-api")), 401, "INVALID_TOKEN"),
    ("exp 누락", "Bearer " + sign(claims(exp=None)), 401, "INVALID_TOKEN"),
    ("sub 누락", "Bearer " + sign(claims(sub=None)), 401, "INVALID_TOKEN"),
    ("iss 누락", "Bearer " + sign(claims(iss=None)), 401, "INVALID_TOKEN"),
    ("aud 누락", "Bearer " + sign(claims(aud=None)), 401, "INVALID_TOKEN"),
    ("sub가 숫자형(문자열 아님)", "Bearer " + jwt.api_jws.encode(json.dumps(claims(sub=1)).encode(), KEY, "HS256"), 401, "INVALID_TOKEN"),
    ("sub 형식 오류(abc)", "Bearer " + sign(claims(sub="abc")), 401, "INVALID_TOKEN"),
    ("없는 사용자 sub=999", "Bearer " + sign(claims(sub="999")), 401, "INVALID_TOKEN"),
    ("만료된 정상 서명", "Bearer " + sign(claims(exp=int(time.time()) - 10)), 401, "TOKEN_EXPIRED"),
    ("Authorization 헤더 없음", None, 401, "TOKEN_REQUIRED"),
    ("Bearer 접두사 없음", sign(claims()), 401, "TOKEN_REQUIRED"),
    ("Basic 방식", "Basic YWxpY2U6cHc=", 401, "TOKEN_REQUIRED"),
    ("Bearer undefined", "Bearer undefined", 401, "INVALID_TOKEN"),
]

failed = 0
for label, header, status, code in cases:
    actual, data, headers = call("GET", "/me", header)
    ok = actual == status and (code is None or data.get("code") == code)
    if status == 401:
        ok = ok and headers.get("WWW-Authenticate", "").lower().startswith("bearer")
    failed += not ok
    shown = data.get("code") if isinstance(data, dict) and "code" in data else "-"
    print(f"{'PASS' if ok else 'FAIL'}  {label:<26} → {actual} {shown}")

print(f"\n{len(cases) - failed}/{len(cases)} passed")
sys.exit(1 if failed else 0)
