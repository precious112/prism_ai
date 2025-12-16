import request from "supertest";
import app  from "../../app";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

jest.mock("../../utils/email");

describe("Auth Module", () => {
  beforeEach(async () => {
    await prisma.researchResult.deleteMany();
    await prisma.researchRequest.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /auth/login", () => {
    it("should login a user with correct credentials", async () => {
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: "test@example.com",
          password: hashedPassword,
          firstName: "Test",
          lastName: "User",
        },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should not login with incorrect password", async () => {
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: "test@example.com",
          password: hashedPassword,
          firstName: "Test",
          lastName: "User",
        },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid input", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email" }); // Missing password

      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh the access token", async () => {
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: "test@example.com",
          password: hashedPassword,
          firstName: "Test",
          lastName: "User",
        },
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password });

      const refreshToken = loginRes.headers["set-cookie"][0]
        .split(";")[0]
        .split("=")[1];

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `refresh_token=${refreshToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout the user", async () => {
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: "test@example.com",
          password: hashedPassword,
          firstName: "Test",
          lastName: "User",
        },
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password });

      const refreshToken = loginRes.headers["set-cookie"][0]
        .split(";")[0]
        .split("=")[1];

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", `refresh_token=${refreshToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"][0]).toContain("refresh_token=;");
    });

    it("should return 400 if refresh token is missing", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should send a password reset email", async () => {
      await prisma.user.create({
        data: {
          email: "test@example.com",
          password: "password123",
          firstName: "Test",
          lastName: "User",
        },
      });

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("Password reset email sent");
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should reset the password", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          password: "password123",
          firstName: "Test",
          lastName: "User",
        },
      });

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          hashedToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: resetToken, password: "newpassword" });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("Password reset successfully");
    });
  });
});
