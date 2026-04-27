import { z } from 'zod/v4'

export const PasskeySchema = z.object({
	// WebAuthn credential ID (base64url), ex: "AQIDBAUGBwgJ..."
	credentialId: z.base64url(),
	// SQL: Store raw bytes as BYTEA. Stored as signed bytes for compatibility.
	publicKey: z.array(z.number().int().min(-128).max(127)),
	// Internal account UUID
	accountId: z.uuidv6(),
	// SQL: Store as TEXT. Index this column.
	webauthnUserID: z.base64url(),
	// SQL: BIGINT
	counter: z.bigint(),
	// singleDevice | multiDevice
	deviceType: z.union([z.literal('singleDevice'), z.literal('multiDevice')]),
	backedUp: z.boolean(),
	// CSV string split into array: ['ble', 'cable', 'hybrid', 'internal', ...]
	transports: z.array(z.string()),
})

export type PasskeyEntity = z.infer<typeof PasskeySchema>
