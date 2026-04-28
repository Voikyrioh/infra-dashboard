import { z } from 'zod/v4'

export const predefinedTagModelSchema = z.object({
  id: z.string(),
  category: z.string(),
  label: z.string(),
  color: z.string(),
})

export type PredefinedTagModel = z.infer<typeof predefinedTagModelSchema>
