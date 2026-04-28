import { z } from 'zod/v4'

export const predefinedTagSchema = z.object({
  id: z.uuid(),
  category: z.string(),
  label: z.string(),
  color: z.string(),
})

export type PredefinedTagEntity = z.infer<typeof predefinedTagSchema>
