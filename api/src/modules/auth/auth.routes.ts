import { Router } from "express";
import {
  loginController,
  refreshTokenController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from "./auth.controller";
import { validate } from "../../middleware/validate";
import { loginSchema } from "./auth.validation";

const router = Router();

router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export { router as authRouter };
