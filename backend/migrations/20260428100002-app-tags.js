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
    .createTable('app_tags', {
      app_id: {
        type: 'uuid',
        foreignKey: {
          name: 'app_tags_app_id_fk',
          table: 'apps',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
          mapping: 'id',
        },
      },
      tag_id: {
        type: 'uuid',
        foreignKey: {
          name: 'app_tags_tag_id_fk',
          table: 'predefined_tags',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
          mapping: 'id',
        },
      },
    })
    .then(() =>
      db.runSql(
        'ALTER TABLE app_tags ADD CONSTRAINT app_tags_pkey PRIMARY KEY (app_id, tag_id)',
      ),
    )

exports.down = (db) => db.dropTable('app_tags')

exports._meta = { version: 1 }
