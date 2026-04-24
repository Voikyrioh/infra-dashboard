import process from 'node:process'
import { z, type ZodType } from 'zod/v4'
import type { Config, ConfigOption, ConfigValueType } from './types'

export const env = z
    .enum(['development', 'production', 'test'])
    .optional()
    .parse(process.env.NODE_ENV)
const coercibleTypes = ['string', 'number', 'boolean', 'date', 'bigint']
type CoercibleTypes = 'string' | 'number' | 'boolean' | 'date' | 'bigint'

function getConfigDefaultValue(config: ConfigOption, environment: typeof env) {
    const processValue = process.env[config.name]
    if (processValue) {
        if (coercibleTypes.includes(config.validator.def.type)) {
            return z.coerce[config.validator.def.type as CoercibleTypes]().parse(
                processValue,
            )
        } else if (
            config.validator.type === 'array' &&
            processValue.charAt(0) === '['
        ) {
            return JSON.parse(processValue) as z.infer<typeof config.validator>
        } else return processValue
    }
    if (environment) {
        return config.default[environment] ?? config.default._ ?? null
    }
    return config.default._ ?? null
}

export function generateConfig<
    T extends Record<string, ConfigOption>,
    Out extends Config<T>,
>(config: T): Out {
    const schemaObject: Record<string, ZodType> = {}
    const out: Record<string, string> = {}
    const defaults: Record<string, ConfigValueType> = {}

    for (const [key, conf] of Object.entries(config)) {
        schemaObject[conf.name] = conf.validator
        out[conf.name] = key
        defaults[conf.name] = getConfigDefaultValue(conf, env) as ConfigValueType
    }

    return z
        .object(schemaObject)
        .transform((input) => {
            return Object.fromEntries(
                Object.entries(out).map(([key, value]) => [value, input[key]]),
            )
        })
        .parse(defaults) as Out
}
