import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
  createUserChatController,
  getUserChatsController,
  getUserOwnedOrganizationsController,
} from "./users.controller";
import { authHandler } from "../../middleware/authHandler";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createUserSchema, updateUserSchema } from "./users.validation";
import { createChatSchema } from "../chat/chat.validation";
import { Action, Resource } from "../../utils/authorization";

const router = Router();

router.post("/", validate(createUserSchema), createUserController);
router.get("/:id", authHandler, authorize(Action.READ, Resource.USER), getUserController);
router.put("/:id", authHandler, authorize(Action.WRITE, Resource.USER), validate(updateUserSchema), updateUserController);

// Nested Chat Routes
router.post("/:id/chats", authHandler, authorize(Action.WRITE, Resource.USER), validate(createChatSchema), createUserChatController);
router.get("/:id/chats", authHandler, authorize(Action.READ, Resource.USER), getUserChatsController);

router.get("/:id/organizations/owned", authHandler, authorize(Action.READ, Resource.USER), getUserOwnedOrganizationsController);

export { router as usersRouter };
