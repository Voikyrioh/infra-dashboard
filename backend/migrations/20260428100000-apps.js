var dbm
var type
var seed

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
}

exports.up = (db) =>
  db
    .createTable('apps', {
      id: {
        type: 'uuid',
        primaryKey: true,
        defaultValue: new String('uuidv7()'),
      },
      repo_name: { type: 'string', notNull: true },
      repo_url: { type: 'string', notNull: true },
      display_name: { type: 'string' },
      type: { type: 'string' },
      container_name: { type: 'string' },
      configured: { type: 'boolean', notNull: true, defaultValue: false },
      last_synced_at: { type: 'timestamptz' },
      created_at: { type: 'timestamptz', defaultValue: String('now()') },
      updated_at: { type: 'timestamptz', defaultValue: String('now()') },
    })
    .then(() =>
      db.runSql(
        'CREATE UNIQUE INDEX apps_repo_name_unique ON apps (repo_name)',
      ),
    )

exports.down = (db) => db.dropTable('apps')

exports._meta = { version: 1 }
