import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.warn(
    "JWT_SECRET is missing or too short. Set JWT_SECRET (min 16 chars) in production."
  );
}

export type JwtPayload = {
  sub: number;
  username: string;
  /** Present on new tokens; legacy tokens may use `email` */
  householdId?: number;
};

function payloadUsername(decoded: object): string | null {
  const u = (decoded as { username?: unknown }).username;
  if (typeof u === "string" && u.length > 0) return u;
  const legacy = (decoded as { email?: unknown }).email;
  if (typeof legacy === "string" && legacy.length > 0) return legacy;
  return null;
}

export function signToken(
  userId: number,
  username: string,
  householdId: number
): string {
  const secret = JWT_SECRET ?? "dev-only-change-me!!";
  return jwt.sign({ sub: userId, username, householdId }, secret, {
    expiresIn: "30d",
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = JWT_SECRET ?? "dev-only-change-me!!";
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "object" && decoded !== null && "sub" in decoded) {
      const sub = (decoded as { sub: unknown }).sub;
      const id = typeof sub === "number" ? sub : typeof sub === "string" ? Number(sub) : NaN;
      const username = payloadUsername(decoded);
      const hid = (decoded as { householdId?: unknown }).householdId;
      const householdId =
        typeof hid === "number" && Number.isFinite(hid)
          ? hid
          : typeof hid === "string" && /^\d+$/.test(hid)
            ? Number(hid)
            : undefined;
      if (Number.isFinite(id) && username) {
        return { sub: id, username, householdId };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export type AuthedRequest = Request & {
  user: { id: number; username: string; householdId: number; isAdmin: boolean };
};

export function attachUserFromToken(
  payload: JwtPayload,
  householdId: number,
  isAdmin: boolean
): AuthedRequest["user"] {
  return {
    id: payload.sub,
    username: payload.username,
    householdId,
    isAdmin,
  };
}
