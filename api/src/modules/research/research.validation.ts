import { z } from "zod";

export const createResearchResultSchema = z.object({
  body: z.object({
    content: z.record(z.string(), z.any()), // JSON content
  }),
});
