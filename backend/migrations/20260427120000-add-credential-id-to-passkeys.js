'use strict'

exports.up = function (db) {
	return db.addColumn('passkeys', 'credential_id', {
		type: 'text',
		notNull: false,
	})
}

exports.down = function (db) {
	return db.removeColumn('passkeys', 'credential_id')
}
