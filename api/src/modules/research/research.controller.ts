import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/response";
import { addResearchResult, getResearchRequestById, retryResearchRequest } from "./research.service";

export const addResearchResultController = catchAsync(async (req: Request, res: Response) => {
  const result = await addResearchResult(req.params.requestId, req.body.content);
  sendSuccess(res, { result });
});

export const getResearchRequestController = catchAsync(async (req: Request, res: Response) => {
  const request = await getResearchRequestById(req.params.requestId);
  sendSuccess(res, { request });
});

export const retryResearchRequestController = catchAsync(async (req: Request, res: Response) => {
  const request = await retryResearchRequest(req.params.requestId);
  sendSuccess(res, { request });
});
