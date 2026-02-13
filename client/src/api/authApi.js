import { get, post, patch } from "./client";



// POST /api/auth/register
export function registerUser(data) {
  return post("/users/register", data);
}

// POST /api/users/login
export function loginUser(data) {
  return post("/users/login", data);
}

// GET /api/users/me (protected route)
export function getMe() {
  return get("/users/me");
}

// POST /api/users/logout
export function logoutUser() {
  return post("/users/logout");
}

// Change Password

export function changePassword(data) {
  return patch("/users/change-password", {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
}
