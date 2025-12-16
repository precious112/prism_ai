import { Router } from "express";
import { authHandler } from "../../middleware/authHandler";
import { workerAuth } from "../../middleware/workerAuth";
import { validate } from "../../middleware/validate";
import { createResearchResultSchema } from "./research.validation";
import {
  getResearchRequestController,
  retryResearchRequestController,
  addResearchResultController,
} from "./research.controller";

const router = Router();

router.post("/worker/result/:requestId", workerAuth, validate(createResearchResultSchema), addResearchResultController);

router.get("/:requestId", authHandler, getResearchRequestController);
router.post("/:requestId/retry", authHandler, retryResearchRequestController);

export { router as researchRouter };
