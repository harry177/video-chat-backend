import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyAccessToken(token);
  } catch {
    req.user = undefined;
  }

  return next();
}
