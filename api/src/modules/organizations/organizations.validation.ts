import { z } from "zod";

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

export const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "MEMBER"]),
  }),
});
