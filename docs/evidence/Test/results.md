| ID | 요청 | 사용자/토큰 | 요청 본문 | 예상 | 실제 | 헤더·데이터 | 판정 |
|---|---|---|---|---|---|---|---|
| READY | GET /api/health | 없음 | `-` | 200 | 200 |  | PASS |
| T07 | PUT /api/posts/11 | Bob | `{"content":"hacked","title":"hacked"}` | 403 FORBIDDEN | 403 FORBIDDEN |  | PASS |
| T07 | GET /api/posts/11 | 없음 | `-` | 200 | 200 | id=11 'Alice original' authorId=1 updatedAt=2026-10-19T05:51:35.946765+00:00 | PASS |
| T08 | DELETE /api/posts/11 | Bob | `-` | 403 FORBIDDEN | 403 FORBIDDEN |  | PASS |
| T08 | GET /api/posts/11 | 없음 | `-` | 200 | 200 | id=11 'Alice original' authorId=1 updatedAt=2026-10-19T05:51:35.946765+00:00 | PASS |
| T10 | POST /api/auth/login | Alice | `{"password":"Classroom!2026","email":"alice@cla...` | 200 | 200 | expiresIn=3, user=Alice(id 1) | PASS |
| T10 | POST /api/posts | Alice(만료 전) | `{"content":"x","title":"expiry target"}` | 201 | 201 | id=17 'expiry target' authorId=1 updatedAt=2026-10-19T06:58:47.049658+00:00 Location: /api/posts/17 | PASS |
| T10 | GET /api/me | Alice(만료) | `-` | 401 TOKEN_EXPIRED | 401 TOKEN_EXPIRED | WWW-Authenticate: Bearer | PASS |
| T10 | POST /api/posts | Alice(만료) | `{"content":"x","title":"expired"}` | 401 TOKEN_EXPIRED | 401 TOKEN_EXPIRED | WWW-Authenticate: Bearer | PASS |
| T10 | PUT /api/posts/17 | Alice(만료) | `{"content":"x","title":"expired"}` | 401 TOKEN_EXPIRED | 401 TOKEN_EXPIRED | WWW-Authenticate: Bearer | PASS |
| T10 | DELETE /api/posts/17 | Alice(만료) | `-` | 401 TOKEN_EXPIRED | 401 TOKEN_EXPIRED | WWW-Authenticate: Bearer | PASS |
| T10 | GET /api/posts/17 | 없음 | `-` | 200 | 200 | id=17 'expiry target' authorId=1 updatedAt=2026-10-19T06:58:47.049658+00:00 | PASS |
| T10 | GET /api/posts/11 | 없음 | `-` | 200 | 200 | id=11 'Alice original' authorId=1 updatedAt=2026-10-19T05:51:35.946765+00:00 | PASS |
| T11 | POST /api/auth/login | Alice | `{"password":"Classroom!2026","email":"alice@cla...` | 200 | 200 | expiresIn=90, user=Alice(id 1) | PASS |
| T11 | GET /api/me | 없음(로그아웃 후) | `-` | 401 TOKEN_REQUIRED | 401 TOKEN_REQUIRED | WWW-Authenticate: Bearer | PASS |
| T12 | POST /api/posts | Bob | `{"title":"forged","content":"x","authorId":1}` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T12 | POST /api/posts | Bob | `{"title":"forged","content":"x","userId":1}` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T12 | GET /api/posts | 없음 | `-` | 200 | 200 | 글 5개, 최신 id=14 '마담프루스트의 비밀정원' | PASS |
| T13 | POST /api/posts | Alice | `{"content":"x","title":""}` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T13 | POST /api/posts | Alice | `{"content":"   ","title":"ok"}` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T13 | POST /api/posts | Alice | `{"content":"x","title":"aaaaaaaaaaaaaaaaaaaaaaa...` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T13 | POST /api/posts | Alice | `{"content":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa...` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T13 | PUT /api/posts/11 | Alice | `{"content":"x","title":""}` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T13 | GET /api/posts/11 | 없음 | `-` | 200 | 200 | id=11 'Alice original' authorId=1 updatedAt=2026-10-19T05:51:35.946765+00:00 | PASS |
| T13 | GET /api/posts | 없음 | `-` | 200 | 200 | 글 5개, 최신 id=14 '마담프루스트의 비밀정원' | PASS |
| T14 | GET /api/posts/999999 | 없음 | `-` | 404 NOT_FOUND | 404 NOT_FOUND |  | PASS |
| T14 | PUT /api/posts/999999 | Alice | `{"content":"c","title":"t"}` | 404 NOT_FOUND | 404 NOT_FOUND |  | PASS |
| T14 | DELETE /api/posts/999999 | Alice | `-` | 404 NOT_FOUND | 404 NOT_FOUND |  | PASS |
| T14 | GET /api/posts/abc | 없음 | `-` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T14 | GET /api/posts/0 | 없음 | `-` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| T15 | POST /api/posts | Alice | `{"content":"survives restart","title":"persist ...` | 201 | 201 | id=15 'persist check' authorId=1 updatedAt=2026-10-19T06:46:56.606301+00:00 Location: /api/posts/15 | PASS |
| T15-전 | GET /api/posts/15 | 없음 | `-` | 200 | 200 | id=15 'persist check' authorId=1 updatedAt=2026-10-19T06:46:56.606301+00:00 | PASS |
| T15-후 | GET /api/posts/15 | 없음 | `-` | 200 | 200 | id=15 'persist check' authorId=1 updatedAt=2026-10-19T06:46:56.606301+00:00 | PASS |
| T17 | PUT /api/posts/11 | 없음 | `{"content":"x","title":"x"}` | 401 TOKEN_REQUIRED | 401 TOKEN_REQUIRED | WWW-Authenticate: Bearer | PASS |
| T17 | DELETE /api/posts/11 | 없음 | `-` | 401 TOKEN_REQUIRED | 401 TOKEN_REQUIRED | WWW-Authenticate: Bearer | PASS |
| T17 | POST /api/posts | Bob | `{"content":"by bob","title":"Bob post"}` | 201 | 201 | id=16 'Bob post' authorId=2 updatedAt=2026-10-19T06:47:33.686970+00:00 Location: /api/posts/16 | PASS |
| T17 | PUT /api/posts/16 | Bob | `{"content":"edited","title":"Bob edited"}` | 200 | 200 | id=16 'Bob edited' authorId=2 updatedAt=2026-10-19T06:47:39.814445+00:00 | PASS |
| T17 | DELETE /api/posts/16 | Bob | `-` | 204 | 204 | 빈 본문 | PASS |
| T17 | GET /api/posts/16 | 없음 | `-` | 404 NOT_FOUND | 404 NOT_FOUND |  | PASS |
| 겹침 | PUT /api/posts/999999 | 없음 | `{"content":"c","title":"t"}` | 401 TOKEN_REQUIRED | 401 TOKEN_REQUIRED | WWW-Authenticate: Bearer | PASS |
| 겹침 | PUT /api/posts/999999 | Alice | `{"content":"c","title":"t"}` | 404 NOT_FOUND | 404 NOT_FOUND |  | PASS |
| 겹침 | PUT /api/posts/11 | Bob | `{"content":"c","title":"   "}` | 403 FORBIDDEN | 403 FORBIDDEN |  | PASS |
| 겹침 | PUT /api/posts/11 | Alice | `{"content":"c","title":"   "}` | 400 BAD_INPUT | 400 BAD_INPUT |  | PASS |
| 겹침 | PUT /api/posts/11 | Bob(만료) | `{"content":"x","title":"   "}` | 401 TOKEN_EXPIRED | 401 TOKEN_EXPIRED | WWW-Authenticate: Bearer | PASS |
