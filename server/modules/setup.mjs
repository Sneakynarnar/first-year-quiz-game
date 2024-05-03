import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { storeQuizFromJson } from './quizes.mjs';
export async function init() {
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
      totalQuestionsAnswered INTEGER DEFAULT 0,
      totalCorrectAnswers INTEGER DEFAULT 0 CHECK (totalCorrectAnswers <= totalQuestionsAnswered),
      lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (accountName)
    );
  `);
  await db.run(`
    INSERT INTO Accounts (accountName, accountPassword, totalQuestionsAnswered, totalCorrectAnswers) VALUES
    ('sneaky', 'sneaky', 400, 369),
    ('ashe', 'ashe', 100, 90),
    ('jess', 'jess', 200, 180),
    ('lars', 'lars', 300, 270),
    ('redjive', 'redjive', 500, 450),
    ('nord', 'nord', 600, 540),
    ('zod', 'zod', 700, 630),
    ('test', 'test', 0, 0),
    ('user', 'user', 0, 0);
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
  await db.run('DROP TABLE IF EXISTS Questions;');
  await db.run(`
    CREATE TABLE Questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      category TEXT NOT NULL,
      choices TEXT NOT NULL,
      answer SMALLINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  storeQuizFromJson();
  console.log('Database set up!');
}


initDataBase();
