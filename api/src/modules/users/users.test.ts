import request from "supertest";
import app from "../../app";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../auth/token.utils";

describe("Users Module", () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
      },
    });

    token = generateAccessToken(user.id);
  });

  describe("POST /users", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/api/users").send({
        email: "new@example.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("new@example.com");
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should create a user and an organization when organizationName is provided", async () => {
      const res = await request(app).post("/api/users").send({
        email: "org-user@example.com",
        password: "password123",
        firstName: "Org",
        lastName: "User",
        organizationName: "My Organization",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("org-user@example.com");

      const user = await prisma.user.findUnique({
        where: { email: "org-user@example.com" },
        include: {
          createdOrganizations: true,
          organizationMembers: { include: { organization: true } },
        },
      });

      expect(user?.createdOrganizations).toHaveLength(1);
      expect(user?.createdOrganizations[0].name).toBe("My Organization");
      expect(user?.organizationMembers).toHaveLength(1);
      expect(user?.organizationMembers[0].organization.name).toBe("My Organization");
      expect(user?.organizationMembers[0].role).toBe("OWNER");
    });

    it("should not create a user with an existing email", async () => {
      const res = await request(app).post("/api/users").send({
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      });

      expect(res.status).toBe(409);
    });

    it("should return 400 for invalid input", async () => {
      const res = await request(app).post("/api/users").send({
        email: "not-an-email",
        password: "short",
        firstName: "New",
        lastName: "User",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /users/:id", () => {
    it("should get a user by id", async () => {
      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("test@example.com");
    });

    it("should not get a user without authentication", async () => {
      const res = await request(app).get(`/api/users/${user.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /users/:id", () => {
    it("should update a user", async () => {
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe("Updated");
    });

    it("should not update a user without authentication", async () => {
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(401);
    });

    it("should fail to update password without oldPassword", async () => {
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "newpassword123" });

      expect(res.status).toBe(400);
    });

    it("should fail to update password with incorrect oldPassword", async () => {
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "newpassword123", oldPassword: "wrongpassword" });

      expect(res.status).toBe(401);
    });

    it("should update password with correct oldPassword", async () => {
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "newpassword123", oldPassword: "password123" });

      expect(res.status).toBe(200);
    });
  });
});
