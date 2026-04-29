import process from 'node:process'
import config from '@config'
import { type ServerType, serve } from '@hono/node-server'
import Logger from '@logger'
import logger from '@logger'
import { client } from './data/database/postgres'
import app from './entry-points/app'

let server: ServerType
function graceFullStart() {
	client.test().catch((e) => {
		console.error('STARTUP ERROR:', e)
		logger.error(e)
		graceFullStop(1)
	})
	return serve(
		{
			fetch: app.fetch,
			hostname: config.Server.Host,
			port: config.Server.Port,
		},
		(info) => {
			Logger.info('======== Server started ========')
			Logger.info(
				`Server is running on https://${info.address}${info.port ? `:${info.port}` : ''}`,
			)
			Logger.info(`================================`)
		},
	)
}

function graceFullStop(errorCode: number) {
	server?.close((err) => {
		console.log(err)
		Logger.info('======== Server stopped ========')
		process.exit(errorCode)
	})
}

server = graceFullStart()
process.on('SIGINT', graceFullStop)
