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

// Box ID and game state management
export function saveBoxSelection(boxId, timestamp = Date.now()) {
  const selection = {
    boxId,
    timestamp,
    status: "pending", // pending, success, failed
  };

  // This will automatically overwrite any existing selection
  localStorage.setItem("last_box_selection", JSON.stringify(selection));
  return selection;
}

export function getLastBoxSelection() {
  const data = localStorage.getItem("last_box_selection");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing box selection:", error);
    return null;
  }
}
