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
  await db.run('DROP TABLE IF EXISTS Accounts;');// VERY INSECURE, ONLY FOR DEMO PURPOSES, USE ENCRYPTION / OAUTH IN PRODUCTION
  await db.run(`
    CREATE TABLE Accounts (
      accountName char(25) NOT NULL,
      accountPassword char(25) NOT NULL,  
      totalQuestionsAnswerd INTEGER DEFAULT 0,
      totalCorrectAnswers INTEGER DEFAULT 0,
      lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (accountName)
    );
  `);
  await db.run(`
    INSERT INTO Accounts (accountName, accountPassword) VALUES
    ('sneaky', 'sneaky'),
    ('ashe', 'ashe'),
    ('jess', 'jess'),
    ('lars', 'lars'),
    ('redjive', 'redjive'),
    ('nord', 'nord'),
    ('zod', 'zod'),
    ('test', 'test'),
    ('user', 'user');
  `);
  await db.run('DROP TABLE IF EXISTS Friends');
  await db.run(`
    CREATE TABLE Friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1 TEXT NOT NULL,
      user2 TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run('DROP TABLE IF EXISTS FriendRequests');
  await db.run(`
    CREATE TABLE FriendRequests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      requestee TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database set up!');
}


initDataBase();
