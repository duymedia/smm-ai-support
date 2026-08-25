import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtUserPayload } from "../lib/auth";

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

/**
 * Middleware requiring valid JWT token in Authorization Header or HttpOnly Cookie
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check Cookie if no header
  if (!token && req.cookies) {
    token = req.cookies.jwt_token || req.cookies.session_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in to access this resource.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please log in again.",
    });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware checking for specific roles (e.g. 'admin')
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have permission to perform this action.",
      });
    }
    next();
  };
}
