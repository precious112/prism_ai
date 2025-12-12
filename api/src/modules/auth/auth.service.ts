import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import AppError from "../../utils/AppError";
import { generateAccessToken } from "./token.utils";
import { sendPasswordResetEmail } from "../../utils/email";

interface LoginInput {
  email: string;
  password: string;
}

export const login = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

   if (!user || !user.password) {
        throw new AppError(401, "Invalid login credentials");
    }
  
  const isValid = await bcrypt.compare(password, user.password);
  if(!isValid){
    throw new AppError(401,"Incorrect password.");
  }

  await prisma.user.update({
    where:{
      email:user.email,
    },
    data: {
      lastLoginAt: new Date()
    }
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(401, "Refresh token not found.");
  }

  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new AppError(500, "Refresh token secret not configured.");
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET) as { id: string };

  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const existingToken = await prisma.refreshToken.findUnique({
    where: {
      hashedToken,
    },
  });

  if (!existingToken || existingToken.revoked) {
    throw new AppError(401, "Invalid or revoked refresh token.");
  }

  const accessToken = generateAccessToken(decoded.id);

  return accessToken;
}

export const logout = async (refreshToken: string) => {
  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.delete({
    where: {
      hashedToken,
    },
  });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      hashedToken,
      expiresAt,
    },
  });

  await sendPasswordResetEmail(user.email, resetToken);
};

export const resetPassword = async (token: string, password: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: {
      hashedToken,
    },
  });

  if (!passwordResetToken) {
    throw new AppError(400, "Invalid or expired password reset token.");
  }

  if (passwordResetToken.expiresAt < new Date()) {
    throw new AppError(400, "Invalid or expired password reset token.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      id: passwordResetToken.userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  await prisma.passwordResetToken.delete({
    where: {
      hashedToken,
    },
  });
};
