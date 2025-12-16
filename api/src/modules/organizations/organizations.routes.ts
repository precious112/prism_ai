import { Router } from "express";
import { authHandler } from "../../middleware/authHandler";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createChatSchema } from "../chat/chat.validation";
import { 
  updateOrganizationSchema, 
  createInvitationSchema, 
  updateMemberRoleSchema 
} from "./organizations.validation";
import { Action, Resource } from "../../utils/authorization";
import { 
  createOrganizationChatController, 
  getOrganizationChatsController, 
  updateOrganizationController,
  createInvitationController,
  acceptInvitationController,
  updateMemberRoleController
} from "./organizations.controller";

const router = Router();

// Invitation Acceptance (Public/User scope, doesn't require org membership check beforehand)
router.post("/invitations/:token/accept", authHandler, acceptInvitationController);

// Organization Routes
router.put("/:orgId", authHandler, authorize(Action.UPDATE, Resource.ORGANIZATION, "orgId"), validate(updateOrganizationSchema), updateOrganizationController);

// Chat Routes
router.post("/:orgId/chats", authHandler, authorize(Action.WRITE, Resource.ORGANIZATION, "orgId"), validate(createChatSchema), createOrganizationChatController);
router.get("/:orgId/chats", authHandler, authorize(Action.READ, Resource.ORGANIZATION, "orgId"), getOrganizationChatsController);

// Member Management Routes
router.post("/:orgId/invitations", authHandler, authorize(Action.UPDATE, Resource.ORGANIZATION, "orgId"), validate(createInvitationSchema), createInvitationController);
router.patch("/:orgId/members/:userId", authHandler, authorize(Action.UPDATE, Resource.ORGANIZATION, "orgId"), validate(updateMemberRoleSchema), updateMemberRoleController);

export { router as organizationsRouter };
