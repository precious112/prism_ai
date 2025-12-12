import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import AppError from "../../utils/AppError";
import { prisma } from "../../utils/prisma";

dotenv.config();

export const generateAccessToken = (id: string) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new AppError(400, "Invalid access token secret");
  }
  return jwt.sign({ id: id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30m",
  });
};

export const generateRefreshToken = (id: string) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new AppError(400, "Invalid refresh token secret");
  }
  return jwt.sign({ id: id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

export const deleteAllRefreshTokensForUser = async (userId: string) => {
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
    },
  });
};

export const addRefreshTokenToDb = async (userId: string, token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.refreshToken.create({
    data: {
      userId,
      hashedToken,
    },
  });
};
