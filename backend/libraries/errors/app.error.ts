import { HttpCodes } from '@errors/http.error'

type AppErrorLevel = 'Error' | 'Fatal'

export type ErrorCodes =
	| 'no-data'
	| 'not-found'
	| 'invalid-payload'
	| 'unauthorized'
	| 'internal-server-error'

export class AppError extends Error {
	type: ErrorCodes
	cause: Error | undefined

	constructor(type: ErrorCodes, message: string, cause?: Error) {
		super(message)
		this.type = type
		this.cause = cause
	}

	toHttpCode(): HttpCodes {
		switch (this.type) {
			case 'no-data':
				return HttpCodes.NO_CONTENT
			case 'not-found':
				return HttpCodes.NOT_FOUND
			case 'invalid-payload':
				return HttpCodes.BAD_REQUEST
			case 'unauthorized':
				return HttpCodes.UNAUTHORIZED
			default:
				return HttpCodes.INTERNAL_SERVER_ERROR
		}
	}
}
