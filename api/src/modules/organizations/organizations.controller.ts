import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/response";
import { createChat, getChatsByOrganization } from "../chat/chat.service";
import { 
  updateOrganization, 
  inviteUserToOrganization, 
  acceptInvitation, 
  updateMemberRole 
} from "./organizations.service";
import { prisma } from "../../utils/prisma";
import AppError from "../../utils/AppError";

export const createOrganizationChatController = catchAsync(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const user = req.user!;

  const chatData = { ...req.body, organizationId: orgId };
  const chat = await createChat(user.id, chatData);
  
  sendSuccess(res, { chat }, 201);
});

export const getOrganizationChatsController = catchAsync(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const user = req.user!;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const { chats, total } = await getChatsByOrganization(user.id, orgId, page, limit);
  
  sendSuccess(res, { chats }, 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const updateOrganizationController = catchAsync(async (req: Request, res: Response) => {
  const org = await updateOrganization(req.params.orgId, req.body);
  sendSuccess(res, { organization: org });
});

export const createInvitationController = catchAsync(async (req: Request, res: Response) => {
  const invitation = await inviteUserToOrganization(req.params.orgId, req.body.email, req.user!.id);
  sendSuccess(res, { invitation }, 201);
});

export const acceptInvitationController = catchAsync(async (req: Request, res: Response) => {
  const result = await acceptInvitation(req.params.token, req.user!.id);
  sendSuccess(res, result);
});

export const updateMemberRoleController = catchAsync(async (req: Request, res: Response) => {
  const member = await updateMemberRole(req.params.orgId, req.params.userId, req.body.role);
  sendSuccess(res, { member });
});
