import { z } from 'zod/v4'

export const accountSchema = z.object({
	id: z.uuid(),
	role: z.enum(['owner', 'user']),
	name: z.string(),
})

export type AccountEntity = z.infer<typeof accountSchema>
