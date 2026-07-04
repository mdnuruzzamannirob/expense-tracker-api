import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type RequestParts = {
  body?: unknown;
  params?: Request["params"];
  query?: Request["query"];
};

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as RequestParts;

    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;
    next();
  };
