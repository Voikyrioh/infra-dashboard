import Config from '@config'
import { AppError } from '@errors/app.error'
import logger from '@logger'
import postgres from 'postgres'

type ClientOptions = {
	host: string
	port: number
	database: string
	password: string
	username: string
}

class PostgresClient {
	#client

	constructor(options: ClientOptions) {
		this.#client = postgres({
			host: options.host,
			port: options.port,
			database: options.database,
			username: options.username,
			password: options.password,
			debug: (_, query, parameters) => logger.info(query, parameters),
		})
	}

	get sql() {
		return this.#client
	}

	async test() {
		return this.sql<{ result: number }[]>`SELECT 1 as result`
			.catch((err) => {
				logger.error(err)
				throw new AppError(
					'internal-server-error',
					'Database connection failed',
					err,
				)
			})
			.then((res) => Boolean(res[0].result))
	}
}

export const client = Object.freeze(
	new PostgresClient({
		database: Config.Postgres.Database,
		host: Config.Postgres.Host,
		password: Config.Postgres.Password,
		port: Config.Postgres.Port,
		username: Config.Postgres.User,
	}),
)
