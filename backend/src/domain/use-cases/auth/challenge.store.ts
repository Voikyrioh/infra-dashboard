interface StoredChallenge {
	webauthnUserID: string
	expiry: number
}

const store = new Map<string, StoredChallenge>()

export function storeChallenge(
	challenge: string,
	webauthnUserID: string,
	ttlMs = 5 * 60 * 1000,
) {
	for (const [k, v] of store) {
		if (v.expiry < Date.now()) store.delete(k)
	}
	store.set(challenge, { webauthnUserID, expiry: Date.now() + ttlMs })
}

export function consumeChallenge(challenge: string): { webauthnUserID: string } | null {
	const entry = store.get(challenge)
	if (!entry || entry.expiry < Date.now()) return null
	store.delete(challenge)
	return { webauthnUserID: entry.webauthnUserID }
}
