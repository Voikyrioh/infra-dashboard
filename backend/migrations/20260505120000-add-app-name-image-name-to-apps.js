'use strict';

exports.setup = function(options) {};

exports.up = function(db) {
  return db.runSql(`
    ALTER TABLE apps ADD COLUMN IF NOT EXISTS app_name VARCHAR(255);
    ALTER TABLE apps ADD COLUMN IF NOT EXISTS image_name VARCHAR(255);
  `);
};

exports.down = function(db) {
  return db.runSql(`
    ALTER TABLE apps DROP COLUMN IF EXISTS app_name;
    ALTER TABLE apps DROP COLUMN IF EXISTS image_name;
  `);
};

exports._meta = { version: 1 };
