// 로그인 상태는 이 모듈 변수(메모리)에만 보관합니다. localStorage·sessionStorage는 사용하지 않으므로
// 새로고침하면 로그인이 해제됩니다.
let session = { accessToken: "", user: null, expiresAt: 0 };
export const getSession = () => session;
export function clearSession() {
  session = { accessToken: "", user: null, expiresAt: 0 };
}
function authorizationHeaders() {
  // FE-02: 토큰이 있을 때만 Bearer 헤더를 만듭니다. "Bearer undefined"를 보내지 않습니다.
  return session.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};
}
async function readBody(response) {
  // FE-03: 204는 본문이 없으므로 JSON 파싱을 하지 않습니다.
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authorizationHeaders(),
        ...options.headers,
      },
    });
  } catch {
    const error = new Error("서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인하세요.");
    error.status = 0;
    throw error;
  }
  const data = await readBody(response);
  // request() 내부
  if (!response.ok) {
    // FE-03: 401이면 메모리의 로그인 상태를 해제합니다. 403은 로그인 상태를 유지합니다.
    if (response.status === 401) clearSession();
    const error = new Error(
      data?.message || data?.code || `HTTP ${response.status}`,
    );
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}
export async function login(email, password) {
  // FE-01: POST /auth/login → 응답의 토큰과 사용자 정보를 메모리 session에 저장합니다.
  clearSession();
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  session = {
    accessToken: data.accessToken,
    user: data.user,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
  return data.user;
}
export function canEdit(post) {
  // FE-04: 로그인 사용자와 작성자가 같을 때만 버튼을 보입니다. 실제 권한은 서버가 다시 검사합니다.
  return Boolean(session.user && post && session.user.id === post.authorId);
}
export const api = {
  list: () => request("/posts"),
  detail: (id) => request(`/posts/${id}`),
  create: (input) =>
    request("/posts", { method: "POST", body: JSON.stringify(input) }),
  update: (id, input) =>
    request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  me: () => request("/me"),
};
