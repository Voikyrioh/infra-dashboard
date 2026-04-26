import { customZod } from '@libraries'
import { z } from 'zod/v4'

export default {
	Host: {
		name: 'PG_HOST',
		description: 'Postgres host for access to database',
		default: {
			_: 'localhost',
			production: undefined,
		},
		validator: z.string(),
	},
	User: {
		name: 'PG_USER',
		description: 'Postgres user for access to database',
		default: {
			_: 'user',
			production: undefined,
		},
		validator: z.string(),
	},
	Password: {
		name: 'PG_PASSWORD',
		description: 'Postgres password for access to database',
		default: {
			_: 'password',
			production: undefined,
		},
		validator: z.string(),
	},
	Database: {
		name: 'PG_DATABASE',
		description: 'Postgres database for access to database',
		default: {
			_: 'dashboard',
			production: undefined,
		},
		validator: z.string(),
	},
	Port: {
		name: 'PG_PORT',
		description: 'Postgres port for access to database',
		default: {
			_: 5432,
			production: undefined,
		},
		validator: z.number().min(1).max(65535),
	},
}
