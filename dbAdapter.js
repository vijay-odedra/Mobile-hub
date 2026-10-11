const path = require('path');
const fs = require('fs');

class DbAdapter {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.useBuiltin = false;

    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(dbPath);
      this.useBuiltin = true;
      console.log('✅ Connected to SQLite via built-in node:sqlite engine');
    } catch (err) {
      console.warn('⚠️ node:sqlite unavailable, falling back to sqlite3:', err.message);
      const sqlite3 = require('sqlite3').verbose();
      this.db = new sqlite3.Database(dbPath);
      this.useBuiltin = false;
    }
  }

  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    if (this.useBuiltin) {
      if (typeof callback === 'function') {
        try {
          const stmt = this.db.prepare(sql);
          const result = stmt.run(...params);
          callback.call({ lastID: Number(result.lastInsertRowid), changes: Number(result.changes) }, null);
        } catch (err) {
          callback(err);
        }
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const stmt = this.db.prepare(sql);
          const result = stmt.run(...params);
          resolve({ lastID: Number(result.lastInsertRowid), changes: Number(result.changes) });
        } catch (err) {
          reject(err);
        }
      });
    } else {
      if (typeof callback === 'function') {
        return this.db.run(sql, params, callback);
      }
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }

  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    if (this.useBuiltin) {
      if (typeof callback === 'function') {
        try {
          const stmt = this.db.prepare(sql);
          const row = stmt.get(...params);
          callback(null, row || null);
        } catch (err) {
          callback(err);
        }
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const stmt = this.db.prepare(sql);
          const row = stmt.get(...params);
          resolve(row || null);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      if (typeof callback === 'function') {
        return this.db.get(sql, params, callback);
      }
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }

  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    if (this.useBuiltin) {
      if (typeof callback === 'function') {
        try {
          const stmt = this.db.prepare(sql);
          const rows = stmt.all(...params);
          callback(null, rows || []);
        } catch (err) {
          callback(err);
        }
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const stmt = this.db.prepare(sql);
          const rows = stmt.all(...params);
          resolve(rows || []);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      if (typeof callback === 'function') {
        return this.db.all(sql, params, callback);
      }
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
  }

  prepare(sql) {
    if (this.useBuiltin) {
      const stmt = this.db.prepare(sql);
      return {
        run: (...params) => stmt.run(...params),
        finalize: () => {}
      };
    } else {
      return this.db.prepare(sql);
    }
  }

  exec(sql) {
    if (this.useBuiltin) {
      return this.db.exec(sql);
    } else {
      return new Promise((resolve, reject) => {
        this.db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

module.exports = DbAdapter;
