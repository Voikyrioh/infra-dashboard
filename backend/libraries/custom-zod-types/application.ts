import { z } from 'zod/v4'

const port = z.number().int().min(1024).max(65535)


export const application = { port }
