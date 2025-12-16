import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { prisma } from "../utils/prisma";
import { checkChatPolicy, checkOrganizationPolicy, checkUserPolicy, getOrganizationMembership, Resource } from "../utils/authorization";

export const authorize = (action: string, resourceType: string, idParam: string = "id") => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user!;
        const resourceId = req.params[idParam];

        if (!resourceId) {
            return next(); 
        }

        let resource;
        let membership = null;

        switch (resourceType) {
            case Resource.CHAT:
                resource = await prisma.chat.findUnique({ where: { id: resourceId } });
                if (resource) {
                    if (resource.organizationId) {
                        membership = await getOrganizationMembership(user.id, resource.organizationId);
                    }
                    
                    const allowed = checkChatPolicy(user, action, resource, membership);
                    if (!allowed) throw new AppError(403, "You do not have permission to perform this action.");
                } else {
                    throw new AppError(404, "Chat not found");
                }
                break;

            case Resource.ORGANIZATION:
                resource = await prisma.organization.findUnique({ where: { id: resourceId } });
                if (resource) {
                    membership = await getOrganizationMembership(user.id, resourceId);
                    const allowed = checkOrganizationPolicy(user, action, resource, membership);
                    if (!allowed) throw new AppError(403, "You do not have permission to perform this action.");
                } else {
                    throw new AppError(404, "Organization not found");
                }
                break;

            case Resource.USER:
                resource = await prisma.user.findUnique({ where: { id: resourceId } });
                if (resource) {
                    const allowed = checkUserPolicy(user, action, resource);
                    if (!allowed) throw new AppError(403, "You do not have permission to perform this action.");
                } else {
                    throw new AppError(404, "User not found");
                }
                break;
        }

        next();
    });
};
