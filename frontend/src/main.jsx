import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, login, getSession, clearSession, canEdit } from "./api";
import "./style.css";

const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  TOKEN_REQUIRED: "로그인이 필요합니다. 로그인 후 다시 시도하세요.",
  INVALID_TOKEN: "인증 정보가 유효하지 않아 로그아웃되었습니다. 다시 로그인하세요.",
  TOKEN_EXPIRED: "로그인 시간이 만료되어 로그아웃되었습니다. 다시 로그인하세요.",
};

// FE-03: HTTP 상태와 code에 따라 화면 안내 문구를 정합니다.
function describe(error) {
  switch (error.status) {
    case 400:
      return `입력을 확인하세요. (${error.message})`;
    case 401:
      return AUTH_MESSAGES[error.code] || "다시 로그인하세요.";
    case 403:
      return "권한이 없습니다. 본인이 작성한 리뷰만 수정·삭제할 수 있습니다.";
    case 404:
      return "게시글이 없습니다. 목록을 새로 불러왔습니다.";
    default:
      return error.message;
  }
}

function useSecondsLeft(expiresAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
}

function App() {
  const [posts, setPosts] = useState([]),
    [selected, setSelected] = useState(null);
  const [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [editing, setEditing] = useState(null);
  const [email, setEmail] = useState("alice@class.test"),
    [password, setPassword] = useState("Classroom!2026");
  const [user, setUser] = useState(null),
    [message, setMessage] = useState({ text: "리뷰를 불러오는 중입니다.", tone: "info" }),
    [busy, setBusy] = useState(false);
  const secondsLeft = useSecondsLeft(user ? getSession().expiresAt : 0);
  const refresh = async () => setPosts(await api.list());

  async function run(action, success) {
    setBusy(true);
    try {
      await action();
      if (success) setMessage({ text: success, tone: "success" });
    } catch (e) {
      setMessage({ text: describe(e), tone: "error" });
      if (e.status === 404) {
        // 글이 사라졌으면 상세·수정 상태를 정리하고 목록을 갱신합니다.
        setSelected(null);
        reset();
        await refresh().catch(() => {});
      }
      // 400·401·403은 입력값을 그대로 둬서 다시 시도할 수 있게 합니다.
    } finally {
      setUser(getSession().user);
      setBusy(false);
    }
  }

  useEffect(() => {
    run(refresh, "리뷰 목록을 불러왔습니다.");
  }, []);

  function reset() {
    setTitle("");
    setContent("");
    setEditing(null);
  }

  async function save(e) {
    e.preventDefault();
    if (!getSession().user) {
      setMessage({ text: "로그인이 필요합니다. 먼저 로그인하세요.", tone: "error" });
      return;
    }
    const wasEditing = editing;
    await run(async () => {
      const p = wasEditing
        ? await api.update(wasEditing, { title, content })
        : await api.create({ title, content });
      setSelected(p);
      reset();
      await refresh();
    }, wasEditing ? "리뷰를 수정했습니다." : "리뷰를 등록했습니다.");
  }

  function logout() {
    clearSession();
    setUser(null);
    reset();
    setMessage({ text: "로그아웃했습니다. 이 탭의 로그인 정보가 지워졌습니다.", tone: "info" });
  }

  return (
    <main>
      <header className="top">
        <div>
          <span className="eyebrow">MOVIE REVIEW BOARD</span>
          <h1>🎬 무비로그</h1>
          <p className="muted">
            방금 본 영화의 한 줄 평부터 깊은 감상까지, 함께 기록하는 영화 리뷰 게시판
          </p>
        </div>
        <div className="userbox">
          {user ? (
            <>
              <strong>안녕하세요, {user.name}님</strong>
              <small>
                {secondsLeft > 0
                  ? `토큰 유효 시간 약 ${secondsLeft}초`
                  : "토큰 유효 시간이 지났습니다. 다음 요청에서 재로그인 안내가 표시됩니다."}
              </small>
              <div className="actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const me = await api.me();
                      setMessage({
                        text: `내 정보: ${me.name} (${me.email}), ID ${me.id}`,
                        tone: "success",
                      });
                    })
                  }
                >
                  내 정보
                </button>
                <button className="secondary" onClick={logout}>
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <span className="muted">로그인하지 않은 상태 · 리뷰 읽기만 가능</span>
          )}
        </div>
      </header>
      <div role="status" className={`message ${message.tone}`}>
        {message.text}
      </div>
      <div className="grid">
        <aside>
          {!user && (
            <section className="card">
              <h2>로그인</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => login(email, password), "로그인했습니다.");
                }}
              >
                <label>
                  이메일
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  비밀번호
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                <div className="actions">
                  <button disabled={busy}>로그인</button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => run(api.me)}
                  >
                    내 정보 조회
                  </button>
                </div>
              </form>
              <p>
                <small>
                  테스트 계정: alice@class.test / bob@class.test
                  <br />
                  공통 비밀번호: Classroom!2026
                </small>
              </p>
            </section>
          )}
          <section className="card">
            <h2>{editing ? "리뷰 수정" : "새 리뷰 작성"}</h2>
            {user ? (
              <form onSubmit={save}>
                <label>
                  제목 <small>(영화 제목과 한 줄 평)</small>
                  <input
                    maxLength={100}
                    value={title}
                    placeholder="예: 인터스텔라 - 다시 봐도 압도적"
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>
                <label>
                  내용
                  <textarea
                    maxLength={5000}
                    value={content}
                    placeholder="평점, 인상 깊은 장면, 추천 대상 등을 자유롭게 적어 주세요."
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </label>
                <div className="actions">
                  <button disabled={busy}>
                    {editing ? "수정 저장" : "등록"}
                  </button>
                  <button type="button" className="secondary" onClick={reset}>
                    {editing ? "수정 취소" : "입력 초기화"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="muted">
                  로그인이 필요합니다. 리뷰를 쓰려면 먼저 로그인하세요.
                </p>
                <button
                  className="secondary"
                  onClick={() =>
                    setMessage({
                      text: "로그인이 필요합니다. 왼쪽 로그인 폼을 이용하세요.",
                      tone: "error",
                    })
                  }
                >
                  리뷰 쓰기
                </button>
              </>
            )}
          </section>
        </aside>
        <div>
          <section className="card">
            <h2>
              리뷰 목록 <small>{posts.length}개</small>
            </h2>
            {posts.length === 0 ? (
              <p>아직 리뷰가 없습니다. 첫 번째 감상을 남겨 보세요.</p>
            ) : (
              posts.map((p) => (
                <article
                  className={`post${selected?.id === p.id ? " active" : ""}`}
                  key={p.id}
                >
                  <button
                    className="post-title"
                    disabled={busy}
                    onClick={() =>
                      run(
                        async () => setSelected(await api.detail(p.id)),
                        "리뷰를 불러왔습니다.",
                      )
                    }
                  >
                    {p.title}
                  </button>
                  <p>
                    <small>
                      {p.authorName}
                      {user?.id === p.authorId && <span className="mine">내 글</span>}
                      {" · "}
                      {new Date(p.createdAt).toLocaleString()}
                    </small>
                  </p>
                </article>
              ))
            )}
          </section>
          <section className="card">
            <h2>리뷰 상세</h2>
            {selected ? (
              <>
                <h3>{selected.title}</h3>
                <p className="content">{selected.content}</p>
                <p>
                  <small>
                    작성자 {selected.authorName} · 작성{" "}
                    {new Date(selected.createdAt).toLocaleString()}
                    {selected.updatedAt !== selected.createdAt &&
                      ` · 수정 ${new Date(selected.updatedAt).toLocaleString()}`}
                  </small>
                </p>
                {canEdit(selected) && (
                  <div className="actions">
                    <button
                      className="secondary"
                      onClick={() => {
                        setEditing(selected.id);
                        setTitle(selected.title);
                        setContent(selected.content);
                      }}
                    >
                      수정
                    </button>
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => {
                        if (confirm("이 리뷰를 삭제할까요?"))
                          run(async () => {
                            await api.remove(selected.id);
                            setSelected(null);
                            reset();
                            await refresh();
                          }, "리뷰를 삭제했습니다.");
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="muted">목록에서 리뷰 제목을 선택하세요.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);
