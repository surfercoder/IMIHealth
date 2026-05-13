// Mirrors the strong-password rule from the web project: at least one lowercase,
// one uppercase, one digit, one symbol, length >= 8.
export const STRONG_PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]).{8,}$/;
