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
  await db.run('CREATE TABLE Accounts (accountId char(25), accountName char(25))');
  console.log('Database set up!');
}

initDataBase();
