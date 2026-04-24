import { Hono } from 'hono'
import { cors } from 'hono/cors'
import config from '@config'
import exempleRoute from './routes/example-route'
import { handleHttpErrors } from '@errors/handle-http-errors'

const app = new Hono().basePath('/api/v1')

app.use(cors({ origin: config.Server.ClientUrls, credentials: true }))
app.onError(handleHttpErrors)

app.route('/', exempleRoute)

export default app
