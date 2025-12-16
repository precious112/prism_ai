import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { createUser, getUserById, updateUser } from "./users.service";
import { createChat, getChatsByUser } from "../chat/chat.service";
import { getOrganizationsOwnedByUser } from "../organizations/organizations.service";
import { catchAsync } from "../../utils/catchAsync";
import {
  generateAccessToken,
  generateRefreshToken,
  addRefreshTokenToDb,
} from "../auth/token.utils";

export const createUserController = catchAsync(async (req: Request, res: Response) => {
  const user = await createUser(req.body);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await addRefreshTokenToDb(user.id, refreshToken);

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });

  sendSuccess(res, { user, accessToken }, 201);
});

export const getUserController = catchAsync(async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id);
  sendSuccess(res, { user });
});

export const updateUserController = catchAsync(async (req: Request, res: Response) => {
  const user = await updateUser(req.body, req.params.id);
  sendSuccess(res, { user });
});

export const createUserChatController = catchAsync(async (req: Request, res: Response) => {
  const chat = await createChat(req.params.id, req.body);
  sendSuccess(res, { chat }, 201);
});

export const getUserChatsController = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const { chats, total } = await getChatsByUser(req.params.id, page, limit);
  
  sendSuccess(res, { chats }, 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const getUserOwnedOrganizationsController = catchAsync(async (req: Request, res: Response) => {
  const orgs = await getOrganizationsOwnedByUser(req.params.id);
  sendSuccess(res, { organizations: orgs });
});
