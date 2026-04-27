export type PasskeyModel = {
	id: string
	credential_id: string | null
	public_key: Buffer | string
	account_id: string
	webauthn_user_id: string
	counter: number
	backed_eligible: boolean
	backed_up: boolean
	transports: string
	created_at: Date
	last_login: Date
	last_ip: string
}
