'use strict';

exports.setup = function(options) {};

exports.up = function(db) {
  return db.runSql(`
    ALTER TABLE apps ADD COLUMN IF NOT EXISTS auto_deploy_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  `);
};

exports.down = function(db) {
  return db.runSql(`
    ALTER TABLE apps DROP COLUMN IF EXISTS auto_deploy_enabled;
  `);
};

exports._meta = { version: 1 };
