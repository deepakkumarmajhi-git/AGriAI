export function getMvpUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smartAgriUserId");
}

export function setMvpUserId(id: string) {
  localStorage.setItem("smartAgriUserId", id);
}