import Logger from '@logger'
import { type ServerType, serve } from '@hono/node-server'
import app from './entry-points/app'
import process from 'node:process'
import config from "@config";

let index: ServerType;
function graceFullStart() {
    return serve(
        {
            fetch: app.fetch,
            hostname: config.Server.Host,
            port: config.Server.Port,
        },
        (info) => {
            Logger.info('======== Server started ========')
            Logger.info(`Server is running on https://${ info.address }${info.port ? `:${ info.port }` : ''}`)
            Logger.info(`================================`)
        },
    )
}

function graceFullStop(errorCode: number) {
    index?.close((err) => {
        console.log(err);
        Logger.info('======== Server stopped ========')
        process.exit(errorCode)
    })
}
index = graceFullStart()
process.on('SIGINT', graceFullStop)
