import { HttpCodes } from "@errors/http.error";
import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { z } from "zod";

export function customValidator<T extends z.ZodSchema, Target extends keyof ValidationTargets>(target: Target, schema: T) {
    return zValidator(target, schema, (result, ctx) => {
        if ( !result.success ) {
            const errors = result.error.issues.map((issue) => ({field: issue.path[0], code: issue.code}))

            return ctx.json({errors}, HttpCodes.BAD_REQUEST);
        }
    })
}
