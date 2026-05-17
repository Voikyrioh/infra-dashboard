import { z } from 'zod/v4'
import { predefinedTagSchema } from './predefined-tag'

export const appEntitySchema = z.object({
  id: z.uuid(),
  repoName: z.string(),
  repoUrl: z.string(),
  displayName: z.string().nullable(),
  type: z.enum(['frontend', 'backend', 'fullstack']).nullable(),
  containerName: z.string().nullable(),
  configured: z.boolean(),
  appName: z.string().nullable(),
  imageName: z.string().nullable(),
  autoDeployEnabled: z.boolean().default(false),
  lastSyncedAt: z.date().nullable(),
  createdAt: z.date(),
  tags: z.array(predefinedTagSchema).default([]),
})

export const appWithStatusSchema = appEntitySchema.extend({
  containerStatus: z.enum(['running', 'stopped', 'unknown']).nullable().default(null),
  deployedVersion: z.string().nullable().default(null),
})

export type AppEntity = z.infer<typeof appEntitySchema>
export type AppWithStatus = z.infer<typeof appWithStatusSchema>
