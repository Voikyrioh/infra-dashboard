import { z } from 'zod/v4'
import { customZod } from '../../../libraries/custom-zod-types'

export default {
    ClientUrls: {
        name: 'CLIENT_URLS',
        description: 'List of client urls',
        default: {
            _: ['http://localhost:3000'],
        },
        validator: z.array(z.union([z.url(), z.ipv4(), z.ipv6()])),
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
}
