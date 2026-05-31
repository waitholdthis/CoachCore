import type { User, TeamWithMeta } from "./types";

const TOKEN_KEY = "season_token";
const USER_KEY = "season_user";
const TEAM_KEY = "season_active_team";

export function getToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function getUser(): User | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TEAM_KEY);
  } catch {
    // ignore
  }
}

export function getActiveTeam(): TeamWithMeta | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(TEAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TeamWithMeta;
  } catch {
    return null;
  }
}

export function setActiveTeam(team: TeamWithMeta): void {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch {
    // ignore
  }
}

export function clearActiveTeam(): void {
  try {
    localStorage.removeItem(TEAM_KEY);
  } catch {
    // ignore
  }
}
