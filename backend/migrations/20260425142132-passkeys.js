var dbm
var type
var seed

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = (options, seedLink) => {
	dbm = options.dbmigrate
	type = dbm.dataType
	seed = seedLink
}

exports.up = (db) =>
	db.createTable('passkeys', {
		id: {
			type: 'uuid',
			primaryKey: true,
			defaultValue: new String('uuidv7()'),
		},
		public_key: { type: 'blob' },
		account_id: {
			type: 'uuid',
			foreignKey: {
				name: 'passkey_user_account_id_fk',
				table: 'accounts',
				rules: {
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT',
				},
				mapping: 'id',
			},
		},
		webauthn_user_id: { type: 'text' },
		counter: { type: 'bigint' },
		backed_eligible: { type: 'boolean' },
		backed_up: { type: 'boolean' },
		transports: { type: 'varchar(255)' },
		created_at: { type: 'timestamptz', defaultValue: String('now()') },
		last_login: { type: 'timestamptz', defaultValue: String('now()') },
		last_ip: { type: 'string' },
	})

exports.down = (db) => db.dropTable('passkeys')

exports._meta = {
	version: 1,
}
