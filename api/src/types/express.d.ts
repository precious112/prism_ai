import { User } from "@prisma/client";
import * as express from "express";

declare module "express" {
  export interface Request {
    user?: User;
  }
}
