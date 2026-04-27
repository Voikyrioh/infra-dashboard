'use strict'

exports.up = function (db) {
	return db.addColumn('passkeys', 'credential_id', {
		type: 'text',
		notNull: false,
		defaultValue: null,
	})
}

exports.down = function (db) {
	return db.removeColumn('passkeys', 'credential_id')
}
