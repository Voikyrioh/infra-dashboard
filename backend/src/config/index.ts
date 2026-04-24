import { generateConfig } from './generate-config'
import ServerConfig from './params/server.config'

export default {
    Server: generateConfig<typeof ServerConfig, { ClientUrls: string[], Environment: string, Host: string, LogFile: string | null, Port: number }>(ServerConfig)
}

