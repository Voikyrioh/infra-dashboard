import { generateConfig } from './generate-config'
import PostgresConfig from './params/postgres.config'
import ServerConfig from './params/server.config'

export default {
	Server: generateConfig<
		typeof ServerConfig,
		{
			ClientUrls: string[]
			Environment: string
			Host: string
			LogFile: string | null
			Port: number
			SigningKey: string
			PublicKey: string
			JwtExpiresMs: number
			InitPassword: string
			DockerSocket: string
			VictoriaMetricsUrl: string | null
			CfApiToken: string | null
			CfZoneId: string | null
			LokiUrl: string | null
			GitHubToken: string | null
			GitHubOwner: string
			GitHubRepo: string
			RpId: string
		}
	>(ServerConfig),
	Postgres: generateConfig<
		typeof PostgresConfig,
		{
			Host: string
			Password: string
			User: string
			Port: number
			Database: string
		}
	>(PostgresConfig),
}
