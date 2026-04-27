import { customZod } from '@libraries'
import { z } from 'zod/v4'

export default {
	ClientUrls: {
		name: 'CLIENT_URLS',
		description: 'List of client urls',
		default: {
			_: ['http://localhost:5173'],
		},
		validator: z.preprocess(
			(val) => z.string().parse(val).split(','),
			z.array(z.string()),
		),
	},
	Environment: {
		name: 'NODE_ENV',
		description: 'Running environment for the application',
		default: {
			_: 'development',
			production: 'production',
		},
		validator: z.enum(['development', 'production', 'local']),
	},
	Host: {
		name: 'HOSTNAME',
		description: 'Who to listen to',
		default: {
			_: '127.0.0.1',
			production: '0.0.0.0',
		},
		validator: z.ipv4(),
	},
	LogFile: {
		name: 'LOG_FILE',
		description: 'Path to the log file (production only)',
		default: {
			_: null,
			production: './logs/app.log',
		},
		validator: z.string().nullish().default(null),
	},
	Port: {
		name: 'PORT',
		description: 'Port to run the server',
		default: {
			_: 3000,
			production: 8080,
		},
		validator: customZod.application.port,
	},
	SigningKey: {
		name: 'PRIVATE_KEY',
		description: 'Private key for signing JWT token',
		default: {
			_: './.ssl/id_rsa',
			production: undefined,
		},
		validator: z.string().min(1),
	},
	PublicKey: {
		name: 'PUBLIC_KEY',
		description: 'Path to public key for signing JWT token',
		default: {
			_: './.ssl/id_rsa.pub',
			production: undefined,
		},
		validator: z.string().min(1),
	},
	JwtExpiresMs: {
		name: 'JWT_EXPIRATION_TIME_MS',
		description: 'Path to private key for signing JWT token',
		default: {
			_: 3_600_000,
			production: undefined,
		},
		validator: z.number().int(),
	},
	InitPassword: {
		name: 'INIT_PASSWORD',
		description: 'Password to set for the first user',
		default: {
			_: 'dev-init-pass-test-222&&',
			production: undefined,
		},
		validator: z.string().min(8),
	},
	DockerSocket: {
		name: 'DOCKER_SOCKET',
		description: 'Path to Docker Unix socket',
		default: {
			_: '/var/run/docker.sock',
		},
		validator: z.string().min(1),
	},
	VictoriaMetricsUrl: {
		name: 'VICTORIA_METRICS_URL',
		description: 'Victoria Metrics base URL',
		default: {
			_: null,
		},
		validator: z.string().url().nullish().default(null),
	},
	CfApiToken: {
		name: 'CF_API_TOKEN',
		description: 'Cloudflare API token',
		default: {
			_: null,
		},
		validator: z.string().nullish().default(null),
	},
	CfZoneId: {
		name: 'CF_ZONE_ID',
		description: 'Cloudflare Zone ID',
		default: {
			_: null,
		},
		validator: z.string().nullish().default(null),
	},
	LokiUrl: {
		name: 'LOKI_URL',
		description: 'Loki base URL',
		default: {
			_: null,
		},
		validator: z.string().url().nullish().default(null),
	},
}
