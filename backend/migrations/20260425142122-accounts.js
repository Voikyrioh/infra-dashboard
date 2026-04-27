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
	db
		.createTable('accounts', {
			id: {
				type: 'uuid',
				primaryKey: true,
				defaultValue: new String('uuidv7()'),
			},
			role: { type: 'int' },
			name: { type: 'string' },
			created_at: { type: 'timestamptz', defaultValue: String('now()') },
			updated_at: { type: 'timestamptz', defaultValue: String('now()') },
		})
		.then(() => {
			db.insert('accounts', ['role', 'name'], [0, 'owner'])
		})

exports.down = (db) => db.dropTable('accounts')

exports._meta = {
	version: 1,
}
