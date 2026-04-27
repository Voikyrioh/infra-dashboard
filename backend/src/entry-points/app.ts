import config from '@config'
import { handleHttpErrors } from '@errors/handle-http-errors'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoute from './routes/auth'
import metricsRoute from './routes/metrics'
import visitsRoute from './routes/visits'

const app = new Hono().basePath('/api/v1')

app.use(cors({ origin: config.Server.ClientUrls, credentials: true }))
app.onError(handleHttpErrors)

app.route('/', authRoute)
app.route('/', metricsRoute)
app.route('/', visitsRoute)

export default app
