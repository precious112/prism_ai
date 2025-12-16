import request from "supertest";
import app from "../../app";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../auth/token.utils";

describe("Chat & Research Modules", () => {
  let user: any;
  let token: string;
  let userId: string;
  let chatId: string;
  let requestId: string;

  beforeEach(async () => {
      // Order matters for FK constraints
      await prisma.researchResult.deleteMany();
      await prisma.researchRequest.deleteMany();
      await prisma.message.deleteMany();
      await prisma.chat.deleteMany();
      await prisma.organizationMember.deleteMany();
      await prisma.organization.deleteMany();
      await prisma.passwordResetToken.deleteMany();
      await prisma.refreshToken.deleteMany();
      await prisma.user.deleteMany();

      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
          data: {
              email: "chat-test@example.com",
              password: hashedPassword,
              firstName: "Chat",
              lastName: "Tester",
          },
      });
      userId = user.id;
      token = generateAccessToken(user.id);
  });

  describe("Chat Flow", () => {
      it("should create a new chat via user endpoint", async () => {
          const res = await request(app)
              .post(`/api/users/${userId}/chats`)
              .set("Authorization", `Bearer ${token}`)
              .send({ title: "My Research Chat" });

          expect(res.status).toBe(201);
          expect(res.body.data.chat.title).toBe("My Research Chat");
          chatId = res.body.data.chat.id;
      });

      it("should list user chats", async () => {
          // Create a chat first
          const chat = await prisma.chat.create({
              data: { userId, title: "Existing Chat" }
          });

          const res = await request(app)
              .get(`/api/users/${userId}/chats`)
              .set("Authorization", `Bearer ${token}`);
          
          expect(res.status).toBe(200);
          expect(res.body.data.chats).toHaveLength(1);
          expect(res.body.data.chats[0].title).toBe("Existing Chat");
      });

      it("should add a message and trigger research request", async () => {
           const chat = await prisma.chat.create({
              data: { userId, title: "Research Chat" }
          });
          chatId = chat.id;

          const res = await request(app)
              .post(`/api/chats/${chatId}/messages`)
              .set("Authorization", `Bearer ${token}`)
              .send({ content: "Tell me about quantum computing" });

          expect(res.status).toBe(201);
          expect(res.body.data.message.content).toBe("Tell me about quantum computing");
          
          // Verify research request
          const researchReq = await prisma.researchRequest.findFirst({
              where: { messageId: res.body.data.message.id }
          });
          expect(researchReq).toBeDefined();
          expect(researchReq?.status).toBe("PENDING");
          requestId = researchReq!.id;
      });

      it("should list messages with research details", async () => {
           const chat = await prisma.chat.create({
              data: { userId, title: "Research Chat" }
          });
          const message = await prisma.message.create({
              data: { userId, chatId: chat.id, content: "Hello", role: "user" }
          });
          await prisma.researchRequest.create({
              data: { messageId: message.id, status: "PENDING" }
          });

          const res = await request(app)
              .get(`/api/chats/${chat.id}/messages`)
              .set("Authorization", `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.data.messages).toHaveLength(1);
          expect(res.body.data.messages[0].researchRequests).toHaveLength(1);
          expect(res.body.data.messages[0].researchRequests[0].status).toBe("PENDING");
      });

      it("should delete a chat and cascade delete messages", async () => {
           const chat = await prisma.chat.create({
              data: { userId, title: "Delete Me" }
          });
          const message = await prisma.message.create({
              data: { userId, chatId: chat.id, content: "Message", role: "user" }
          });
          await prisma.researchRequest.create({
              data: { messageId: message.id, status: "PENDING" }
          });

          const res = await request(app)
              .delete(`/api/chats/${chat.id}`)
              .set("Authorization", `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.data.message).toBe("Chat deleted");

          // Verify cascade
          const messages = await prisma.message.findMany({ where: { chatId: chat.id } });
          expect(messages).toHaveLength(0);
      });

      it("should allow worker to add AI message without triggering research", async () => {
           const chat = await prisma.chat.create({
              data: { userId, title: "AI Chat" }
          });
          
          const res = await request(app)
              .post(`/api/chats/${chat.id}/messages/worker`)
              .set("x-worker-secret", process.env.WORKER_SECRET!)
              .send({ content: "I am AI", role: "assistant" });

          expect(res.status).toBe(201);
          expect(res.body.data.message.role).toBe("assistant");
          
          // Verify NO research request created
          const requests = await prisma.researchRequest.findMany({
              where: { messageId: res.body.data.message.id }
          });
          expect(requests).toHaveLength(0);
      });
  });

  describe("Research Flow", () => {
      beforeEach(async () => {
          // Setup a chat, message and request
           const chat = await prisma.chat.create({
              data: { userId, title: "Worker Chat" }
          });
          const message = await prisma.message.create({
              data: { userId, chatId: chat.id, content: "Analyze this", role: "user" }
          });
          const req = await prisma.researchRequest.create({
              data: { messageId: message.id, status: "PENDING" }
          });
          requestId = req.id;
      });

      it("should allow worker to add research result", async () => {
          const res = await request(app)
              .post(`/api/research/worker/result/${requestId}`)
              .set("x-worker-secret", process.env.WORKER_SECRET!)
              .send({ content: { summary: "Analysis complete" } });

          expect(res.status).toBe(200);
          
          const updatedRequest = await prisma.researchRequest.findUnique({
              where: { id: requestId },
              include: { researchResult: true }
          });
          expect(updatedRequest?.status).toBe("COMPLETED");
          expect(updatedRequest?.researchResult).toHaveLength(1);
          expect(updatedRequest?.researchResult[0].content).toEqual({ summary: "Analysis complete" });
      });

      it("should allow getting research request details", async () => {
          const res = await request(app)
              .get(`/api/research/${requestId}`)
              .set("Authorization", `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.data.request.id).toBe(requestId);
      });
  });
});
