import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../utils/AppError";
import { prisma } from "../utils/prisma";
import { catchAsync } from "../utils/catchAsync";

interface AuthPayload extends JwtPayload {
  id: string;
}

export const authHandler = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new AppError(401, "Authentication token not found.");
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new AppError(500, "Access token secret not configured.");
  }

  const payload = jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET
  ) as AuthPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
  });

  if (!user) {
    throw new AppError(401, "User not found.");
  }

  req.user = user;
  next();
});
