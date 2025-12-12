import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import AppError from "../../utils/AppError";

export const createUser = async (userPayload: any) => {
  const { email, password, firstName, lastName, organizationName } = userPayload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(409, "User with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (organizationName) {
    return await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          createdById: user.id,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER",
          isActive: true,
        },
      });

      return user;
    });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return user;
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const updateUser = async (userPayload: any, id: string) => {
  const { email, password, oldPassword, firstName, lastName } = userPayload;
  let hashedPassword;

  if (password) {
    if (!oldPassword) {
      throw new AppError(400, "Old password is required to change password.");
    }

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser || !currentUser.password) {
      throw new AppError(404, "User not found.");
    }

    const isMatch = await bcrypt.compare(oldPassword, currentUser.password);
    if (!isMatch) {
      throw new AppError(401, "Incorrect old password.");
    }

    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      ...(email ? { email } : {}),
      ...(password ? { password: hashedPassword } : {}),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return user;
};
