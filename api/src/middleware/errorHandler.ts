import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import AppError from "../utils/AppError";
import { sendError } from "../utils/response";

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error({ statusCode: err.statusCode, message: err.message });
    return sendError(res, err.message, err.statusCode);
  }

  logger.error(err);
  return sendError(res, "Something went wrong");
};
