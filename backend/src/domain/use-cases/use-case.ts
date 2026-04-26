import Logger from '@logger'

type StepFunction<T> = (...args: any[]) => Promise<T> | T

/**
 * Basic class for executing use cases.
 * Will log each step in debug, can be configured for making steps in tools for logging like APM
 */
export abstract class UseCase<TReturn = unknown> {
	// biome-ignore lint/suspicious/noExplicitAny: We expect any type of argument
	abstract Execute(...args: any[]): Promise<TReturn>
	async runStep<T>(stepName: string, stepFn: StepFunction<T>): Promise<T> {
		Logger.debug(`Running Step: ${stepName}`)
		const value = stepFn()
		if (value instanceof Promise) {
			const nValue = await value
			Logger.debug(`Step: ${stepName} completed`)
			return nValue
		} else {
			Logger.debug(`Step: ${stepName} completed`)
			return Promise.resolve(value)
		}
	}
}
