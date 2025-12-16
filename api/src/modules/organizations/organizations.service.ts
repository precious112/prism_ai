import { prisma } from "../../utils/prisma";
import AppError from "../../utils/AppError";
import crypto from "crypto";
import { sendInvitationEmail } from "../../utils/email";

export const updateOrganization = async (orgId: string, data: { name: string }) => {
  return await prisma.organization.update({
    where: { id: orgId },
    data: { name: data.name },
  });
};

export const getOrganizationsOwnedByUser = async (userId: string) => {
  return await prisma.organization.findMany({
    where: { createdById: userId },
  });
};

export const inviteUserToOrganization = async (orgId: string, email: string, inviterId: string) => {
  const existingMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      user: { email },
    },
  });

  if (existingMember) {
    throw new AppError(409, "User is already a member of this organization.");
  }

  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      organizationId: orgId,
      email,
      acceptedAt: null,
      expiredAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    throw new AppError(409, "User has already been invited.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: orgId,
      email,
      token,
      inviterUserId: inviterId,
      expiredAt,
    },
    include: {
      organization: true,
    },
  });

  await sendInvitationEmail(email, token, invitation.organization.name);

  return invitation;
};

export const acceptInvitation = async (token: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) {
    throw new AppError(404, "Invalid invitation token.");
  }

  if (invitation.expiredAt < new Date()) {
    throw new AppError(400, "Invitation has expired.");
  }

  if (invitation.acceptedAt) {
    throw new AppError(400, "Invitation has already been accepted.");
  }

  const existingMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId: invitation.organizationId,
      userId,
    },
  });

  if (existingMember) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date(), acceptedByUserId: userId },
    });
    return { organization: invitation.organization };
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const member = await tx.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: "MEMBER",
        isActive: true,
        invitedById: invitation.inviterUserId,
        invitedAt: invitation.createdAt,
        joinedAt: new Date(),
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date(), acceptedByUserId: userId },
    });

    return member;
  });

  return { organization: invitation.organization, member: result };
};

export const updateMemberRole = async (orgId: string, memberUserId: string, role: string) => {
  const member = await prisma.organizationMember.findFirst({
    where: { organizationId: orgId, userId: memberUserId },
  });

  if (!member) {
    throw new AppError(404, "Member not found.");
  }

  const updatedMember = await prisma.organizationMember.update({
    where: { id: member.id },
    data: { role },
  });

  return updatedMember;
};
