import Config from '@config'

export const rpName = 'Dashboard for handling deployments'

// rpID must be the hostname (not the binding address).
// In production, set HOSTNAME to your actual domain (e.g., "dashboard.example.com").
export const rpID =
	Config.Server.Environment === 'production' ? Config.Server.Host : 'localhost'

// origin must match the browser origin where the passkey is created (the frontend URL).
// Accepts array to support multiple allowed origins.
export const origin: string | string[] = Config.Server.ClientUrls
