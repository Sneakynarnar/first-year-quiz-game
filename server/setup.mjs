import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
async function init() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
    verbose: true,
  });
  return db;
}

const connect = init();

async function initDataBase() {
  const db = await connect;
  await db.run('DROP TABLE IF EXISTS Accounts;');
  await db.run(`
    CREATE TABLE Accounts (
      accountName char(25) NOT NULL,
      accountPassword char(25) NOT NULL,  // VERY INSECURE, ONLY FOR DEMO PURPOSES, USE ENCRYPTION / OAUTH IN PRODUCTION
      PRIMARY KEY (accountName)
    );
  `);
  await db.run(`
    INSERT INTO Accounts (accountName, accountPassword) VALUES
    ('sneaky', 'sneaky'),
    ('user', 'user');
    `);
  await db.run('DROP TABLE IF EXISTS friends');
  await db.run(`
    CREATE TABLE friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1 TEXT NOT NULL,
      user2 TEXT NOT NULL
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
 
  console.log('Database set up!');
}

initDataBase();
