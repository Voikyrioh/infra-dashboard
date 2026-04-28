import { z } from 'zod/v4'

export const appModelSchema = z.object({
  id: z.string(),
  repo_name: z.string(),
  repo_url: z.string(),
  display_name: z.string().nullable(),
  type: z.string().nullable(),
  container_name: z.string().nullable(),
  configured: z.boolean(),
  last_synced_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type AppModel = z.infer<typeof appModelSchema>
