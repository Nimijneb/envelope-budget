import crypto from "node:crypto";

/** 12 hex chars — share with family to join the same household. */
export function newInviteCode(): string {
  return crypto.randomBytes(6).toString("hex");
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toLowerCase();
}
