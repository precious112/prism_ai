import { Router } from "express";
import { createUserController, getUserController, updateUserController } from "./users.controller";
import { authHandler } from "../../middleware/authHandler";
import { validate } from "../../middleware/validate";
import { createUserSchema, updateUserSchema } from "./users.validation";

const router = Router();

router.post("/", validate(createUserSchema), createUserController);
router.get("/:id", authHandler, getUserController);
router.put("/:id", authHandler, validate(updateUserSchema), updateUserController);

export { router as usersRouter };
