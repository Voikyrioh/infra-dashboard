import { z } from 'zod/v4'

export const PasskeySchema = z.object({
	// SQL: Store as `TEXT`. Index this column
	id: z.base64url(),
	// SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
	//      Caution: Node ORM's may map this to a Buffer on retrieval,
	//      convert to Uint8Array as necessary
	publicKey: z.array(z.number().int().min(-128).max(127)),
	// SQL: Foreign Key to an instance of your internal user model
	user: z.uuidv6(),
	// SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
	//      (webAuthnUserID + user) also achieves maximum user privacy
	webauthnUserID: z.base64url(),
	// SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
	counter: z.bigint(),
	// SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
	// Ex: 'singleDevice' | 'multiDevice'
	deviceType: z.literal('singleDevice'),
	// SQL: `BOOL` or whatever similar type is supported
	backedUp: z.boolean(),
	// SQL: `VARCHAR(255)` and store string array as a CSV string
	// Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
	transports: z.array(z.string()),
})

export type PasskeyEntity = z.infer<typeof PasskeySchema>
