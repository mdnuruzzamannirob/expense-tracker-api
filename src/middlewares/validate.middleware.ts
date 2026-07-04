import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../utils/response.js";

type RequestParts = {
  body?: unknown;
  params?: Request["params"];
  query?: Request["query"];
};

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parsed.success) {
      return next(new AppError(400, "Validation failed"));
    }

    const data = parsed.data as RequestParts;

    req.body = data.body ?? req.body;
    req.params = data.params ?? req.params;
    req.query = data.query ?? req.query;
    next();
  };
