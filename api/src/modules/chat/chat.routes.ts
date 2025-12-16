import { Router } from "express";
import { authHandler } from "../../middleware/authHandler";
import { authorize } from "../../middleware/authorize";
import { workerAuth } from "../../middleware/workerAuth";
import { validate } from "../../middleware/validate";
import { updateChatSchema, createMessageSchema, createWorkerMessageSchema } from "./chat.validation";
import { Action, Resource } from "../../utils/authorization";
import {
  getChatController,
  updateChatController,
  deleteChatController,
  addMessageController,
  getMessagesController,
  addWorkerMessageController,
} from "./chat.controller";

const router = Router();

router.get("/:id", authHandler, authorize(Action.READ, Resource.CHAT), getChatController);
router.put("/:id", authHandler, authorize(Action.WRITE, Resource.CHAT), validate(updateChatSchema), updateChatController);
router.delete("/:id", authHandler, authorize(Action.DELETE, Resource.CHAT), deleteChatController);

router.post("/:id/messages", authHandler, authorize(Action.WRITE, Resource.CHAT), validate(createMessageSchema), addMessageController);
router.get("/:id/messages", authHandler, authorize(Action.READ, Resource.CHAT), getMessagesController);
router.post("/:id/messages/worker", workerAuth, validate(createWorkerMessageSchema), addWorkerMessageController);

export { router as chatRouter };
