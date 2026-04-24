import { inspect } from 'node:util'
import { AppError } from '@errors/app.error'
import { ErrorsCodes, HttpCodes } from '@errors/http.error'
import Logger from '@logger'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod/v4'

export function handleHttpErrors(error: unknown, c: Context) {
    let parsedError: HTTPException;
    if (error instanceof Error) {
        if (error instanceof ZodError)
            parsedError = new HTTPException(
                HttpCodes.BAD_REQUEST,
                {
                    message: ErrorsCodes.BAD_REQUEST,
                    cause: error.issues,
                }
            )
        else if (error instanceof AppError)
            parsedError = new HTTPException(
                error.toHttpCode() as ContentfulStatusCode,
                { message: error.message }
            )
        else if (error instanceof HTTPException) parsedError = error
        else {
            Logger.error(`Unhandled error : ${ inspect(error) }`)
            parsedError = new HTTPException(
                HttpCodes.INTERNAL_SERVER_ERROR,
                { message: ErrorsCodes.INTERNAL_SERVER_ERROR }
            )
        }
        return parsedError.getResponse()
    }

    Logger.error(`Unknown error : ${inspect(error)}`)
    return c.text(ErrorsCodes.INTERNAL_SERVER_ERROR)
}
