export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("smartAgriAuth") === "true";
}

export function login() {
  localStorage.setItem("smartAgriAuth", "true");
}

export function logout() {
  localStorage.removeItem("smartAgriAuth");
}

export function requireAuthOrRedirect(routerPush: (path: string) => void) {
  if (!isLoggedIn()) routerPush("/auth/login");
}