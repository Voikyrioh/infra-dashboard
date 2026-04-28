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
    .createTable('predefined_tags', {
      id: {
        type: 'uuid',
        primaryKey: true,
        defaultValue: new String('uuidv7()'),
      },
      category: { type: 'string', notNull: true },
      label: { type: 'string', notNull: true },
      color: { type: 'string', notNull: true },
    })
    .then(() =>
      db.runSql(`
        INSERT INTO predefined_tags (category, label, color) VALUES
          ('database', 'PostgreSQL', '#336791'),
          ('database', 'Redis', '#DC382D'),
          ('database', 'MongoDB', '#47A248'),
          ('database', 'MySQL', '#4479A1'),
          ('database', 'SQLite', '#003B57')
      `),
    )

exports.down = (db) => db.dropTable('predefined_tags')

exports._meta = { version: 1 }
