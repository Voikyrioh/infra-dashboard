import pino, { type LoggerOptions } from 'pino'
import config from "@config"

const isProd = config.Server.Environment === 'production'

export const loggerOptions: LoggerOptions = isProd
    ? {
        transport: {
            target: 'pino/file',
            options: { destination: config.Server.LogFile },
        },
    }
    : {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                include: 'level,time',
                levelKey: 'level',
            },
        },
    }

const logger = pino(loggerOptions)
export default logger
