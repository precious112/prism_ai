import { prisma } from "./prisma";
import AppError from "./AppError";

export const Action = {
    READ: 'read',
    WRITE: 'write',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage' // All
} as const;

export const Resource = {
    CHAT: 'Chat',
    MESSAGE: 'Message',
    ORGANIZATION: 'Organization',
    USER: 'User'
} as const;

// --- Pure Policy Logic ---

export const checkChatPolicy = (user: { id: string }, action: string, chat: any, membership?: any): boolean => {
    // 1. Personal Ownership
    if (chat.userId === user.id) {
        return true;
    }
    
    // 2. Organization Access
    if (chat.organizationId && membership) {
        if (action === Action.DELETE) {
            // Only Owner/Admin can delete organization chats
            return ['OWNER', 'ADMIN'].includes(membership.role);
        }

        if (action === Action.UPDATE) {
            if (['OWNER', 'ADMIN'].includes(membership.role)){
                return true;
            }
            if (membership.userId === chat.userId){
                return true;
            }
            return false;
        }
        // All members can Read/Write (create messages)
        return true; 
    }

    return false;
};

export const checkOrganizationPolicy = (user: { id: string }, action: string, organization: any, membership?: any): boolean => {
    if (!membership) return false;

    if (action === Action.UPDATE || action === Action.DELETE) {
        return ['OWNER', 'ADMIN'].includes(membership.role);
    }
    
    return true; 
};

export const checkUserPolicy = (user: { id: string }, action: string, resource: any): boolean => {
    return user.id === resource.id;
};

// --- Helper to fetch membership (used by middleware) ---
export const getOrganizationMembership = async (userId: string, organizationId: string) => {
    return await prisma.organizationMember.findFirst({
        where: { 
            organizationId: organizationId,
            userId: userId 
        }
    });
};
