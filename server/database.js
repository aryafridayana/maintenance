const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Use DB_PATH from env, fallback to data/liftcare.db
const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : path.join(__dirname, 'data', 'liftcare.db');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`📁 Created database directory: ${dbDir}`);
}

console.log(`📂 Database path: ${dbPath}`);

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error(`❌ Failed to open database at ${dbPath}:`, err.message);
  console.error('   Pastikan better-sqlite3 sudah di-install di VPS dengan: npm rebuild better-sqlite3');
  throw err;
}

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('superadmin','admin','teknisi')) NOT NULL,
      phone TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('cargo','passenger')) NOT NULL,
      merk TEXT,
      model TEXT,
      cabang TEXT,
      location TEXT,
      floors INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lift_id INTEGER REFERENCES lifts(id) ON DELETE CASCADE,
      technician_id INTEGER REFERENCES users(id),
      scheduled_date DATE NOT NULL,
      status TEXT CHECK(status IN ('scheduled','in_progress','completed','cancelled')) DEFAULT 'scheduled',
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qr_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lift_id INTEGER REFERENCES lifts(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      expires_at DATETIME,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER REFERENCES schedules(id),
      lift_id INTEGER REFERENCES lifts(id) ON DELETE CASCADE,
      technician_id INTEGER REFERENCES users(id),
      type TEXT CHECK(type IN ('cargo','passenger')),
      checklist_data TEXT NOT NULL,
      remarks TEXT,
      temperature TEXT,
      voltage TEXT,
      technician_sign TEXT,
      manager_sign TEXT,
      customer_sign TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)'
  );
  insertUser.run('Super Administrator', 'superadmin@liftcare.com', hash('admin123'), 'superadmin', '');
  console.log('✅ Database initialized with Super Admin account');
}

module.exports = { db, initializeDatabase };
