import request from "supertest";
import app from "../../app";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../auth/token.utils";

describe("Organization Chats", () => {
  let userToken: string;
  let userId: string;
  let orgId: string;
  let otherUserToken: string;

  beforeEach(async () => {
    await prisma.researchResult.deleteMany();
    await prisma.researchRequest.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const password = await bcrypt.hash("password123", 10);
    const user1 = await prisma.user.create({
      data: { email: "user1@example.com", password, firstName: "User", lastName: "One" }
    });
    userId = user1.id;
    userToken = generateAccessToken(user1.id);

    const org = await prisma.organization.create({
      data: { name: "Test Org", createdById: user1.id }
    });
    orgId = org.id;

    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: user1.id, role: "OWNER", isActive: true }
    });

    const user2 = await prisma.user.create({
      data: { email: "user2@example.com", password, firstName: "User", lastName: "Two" }
    });
    otherUserToken = generateAccessToken(user2.id);
  });

  describe("POST /organizations/:orgId/chats", () => {
    it("should allow member to create chat", async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/chats`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Org Chat" });

      expect(res.status).toBe(201);
      expect(res.body.data.chat.organizationId).toBe(orgId);
    });

    it("should deny non-member", async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/chats`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ title: "Intruder Chat" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /organizations/:orgId/chats", () => {
    it("should list chats for member", async () => {
      await prisma.chat.create({
        data: { userId, organizationId: orgId, title: "Chat 1" }
      });

      const res = await request(app)
        .get(`/api/organizations/${orgId}/chats`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.chats).toHaveLength(1);
    });
  });

  describe("PUT /organizations/:orgId", () => {
    it("should allow owner to update organization name", async () => {
      const res = await request(app)
        .put(`/api/organizations/${orgId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Org Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.organization.name).toBe("Updated Org Name");
    });

    it("should deny non-owner member", async () => {
      const memberUser = await prisma.user.create({ data: { email: "member@example.com", password: "pw" } });
      const memberToken = generateAccessToken(memberUser.id);
      await prisma.organizationMember.create({
          data: { organizationId: orgId, userId: memberUser.id, role: "MEMBER", isActive: true }
      });

      const res = await request(app)
        .put(`/api/organizations/${orgId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ name: "Hacked Name" });

      expect(res.status).toBe(403);
    });
  });

  describe("Invitations & Role Management", () => {
    it("should allow owner to invite a user", async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ email: "invitee@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.data.invitation.email).toBe("invitee@example.com");
      expect(res.body.data.invitation.token).toBeDefined();
    });

    it("should allow user to accept invitation", async () => {
      // 1. Create invitation
      const inviteRes = await request(app)
        .post(`/api/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ email: "invitee@example.com" });
      
      const token = inviteRes.body.data.invitation.token;

      // 2. Accept invitation as a new user
      const res = await request(app)
        .post(`/api/organizations/invitations/${token}/accept`)
        .set("Authorization", `Bearer ${otherUserToken}`); // otherUser accepts

      expect(res.status).toBe(200);
      expect(res.body.data.member).toBeDefined();

      // Verify membership
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: orgId, userId: (await prisma.user.findUnique({ where: { email: "user2@example.com" } }))!.id }
      });
      expect(member).toBeDefined();
      expect(member!.role).toBe("MEMBER");
    });

    it("should allow owner to update member role", async () => {
      // Setup: Add otherUser as MEMBER
      const user2Id = (await prisma.user.findUnique({ where: { email: "user2@example.com" } }))!.id;
      await prisma.organizationMember.create({
        data: { organizationId: orgId, userId: user2Id, role: "MEMBER", isActive: true }
      });

      const res = await request(app)
        .patch(`/api/organizations/${orgId}/members/${user2Id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.data.member.role).toBe("ADMIN");
    });
  });
});
