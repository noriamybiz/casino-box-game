// authStorage.js

export function saveToken(token, expiresInSeconds) {
  const expiryTime = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem("auth_token", JSON.stringify({ token, expiryTime }));
}

export function getToken() {
  const data = localStorage.getItem("auth_token");
  if (!data) return null;

  const { token, expiryTime } = JSON.parse(data);

  // check if expired
  if (Date.now() > expiryTime) {
    localStorage.removeItem("auth_token");
    return null;
  }
  return token;
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}
