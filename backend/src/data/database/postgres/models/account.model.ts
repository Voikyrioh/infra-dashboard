import { z } from 'zod/v4'

export const accountModelSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.number(),
	created_at: z.date(),
})
export type AccountModel = z.infer<typeof accountModelSchema>
