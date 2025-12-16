import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

export const workerAuth = (req: Request, res: Response, next: NextFunction) => {
  const workerSecret = req.headers["x-worker-secret"];

  if (!process.env.WORKER_SECRET) {
    console.error("WORKER_SECRET is not defined in environment variables.");
    return next(new AppError(500, "Internal Server Error"));
  }

  if (!workerSecret || workerSecret !== process.env.WORKER_SECRET) {
    return next(new AppError(401, "Unauthorized: Invalid Worker Secret"));
  }

  next();
};
