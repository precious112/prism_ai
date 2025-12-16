import { prisma } from "../../utils/prisma";
import AppError from "../../utils/AppError";

export const addResearchResult = async (requestId: string, content: any) => {
  const request = await prisma.researchRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, "Research request not found");

  return await prisma.$transaction(async (tx: any) => {
    // Update request status
    await tx.researchRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });

    // Create result
    return await tx.researchResult.create({
      data: {
        researchRequestId: requestId,
        content,
      },
    });
  });
};

export const getResearchRequestById = async (requestId: string) => {
  const request = await prisma.researchRequest.findUnique({
    where: { id: requestId },
    include: { researchResult: true },
  });
  if (!request) throw new AppError(404, "Research request not found");
  return request;
};

export const retryResearchRequest = async (requestId: string) => {
  const request = await prisma.researchRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, "Research request not found");

  // Logic to re-queue... 
  // For now just update status to PENDING so worker picks it up again? 
  // Ideally we'd republish to message broker here.

  return await prisma.researchRequest.update({
    where: { id: requestId },
    data: { status: "PENDING" },
  });
};
