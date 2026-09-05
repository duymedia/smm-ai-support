import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtUserPayload } from "../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
  dbUser?: any;
}

/**
 * Middleware requiring valid JWT token and existing User in MySQL Database
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      code: "UNAUTHENTICATED",
      message: "Yêu cầu đăng nhập. Không tìm thấy token xác thực.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      code: "TOKEN_INVALID",
      message: "Phiên đăng nhập đã hết hạn hoặc token không hợp lệ.",
    });
  }

  try {
    const numUserId = Number(decoded.userId);
    const orClauses: any[] = [];
    if (!Number.isNaN(numUserId) && numUserId > 0) {
      orClauses.push({ id: numUserId });
    }
    if (decoded.email) {
      orClauses.push({ email: decoded.email });
    }
    if (decoded.username) {
      orClauses.push({ username: decoded.username });
    }

    const dbUser = orClauses.length > 0 ? await prisma.user.findFirst({
      where: { OR: orClauses },
    }) : null;

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Tài khoản người dùng không tồn tại trong cơ sở dữ liệu. Phiên làm việc đã bị hủy.",
      });
    }

    if (dbUser.status === 'banned' || dbUser.status === 'suspended') {
      return res.status(403).json({
        success: false,
        code: "USER_BANNED",
        message: "Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.",
      });
    }

    req.user = decoded;
    req.dbUser = dbUser;
    next();
  } catch (err) {
    console.error("Auth middleware DB lookup error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xác thực tài khoản trong cơ sở dữ liệu.",
    });
  }
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
