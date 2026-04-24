import { HttpCodes } from '@errors/http.error'

type AppErrorLevel = "Error" | "Fatal";

export type ErrorCodes =
    'no-data' |
    'not-found' |
    'invalid-payload' |
    'internal-server-error'

export class AppError extends Error {
    type: ErrorCodes;
    constructor(type: ErrorCodes, message: string) {
        super(message);
        this.type = type;
    }

    toHttpCode(): HttpCodes {
        switch (this.type) {
            case 'no-data':
                return HttpCodes.NO_CONTENT;
            case 'not-found':
                return HttpCodes.NOT_FOUND;
            case 'invalid-payload':
                return HttpCodes.BAD_REQUEST;
            default:
                return HttpCodes.INTERNAL_SERVER_ERROR;
        }
    }
}
