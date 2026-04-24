import type { output, ZodType } from 'zod/v4'

export type EnvsType = 'development' | 'production' | 'test'

export type ConfigValueType =
    | number
    | string
    | boolean
    | Date
    | null
    | Array<number | string>

export interface ConfigOption {
    name: string
    description: string
    validator: ZodType
    default: {
        _: ConfigValueType
    } & Partial<Record<EnvsType, ConfigValueType>>
}

export type Config<T extends Record<string, ConfigOption>> = T extends Record<
        infer K extends string,
        infer U extends ConfigOption
    >
    ? Record<K, output<U['validator']>>
    : never
