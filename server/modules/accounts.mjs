import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function init() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
    verbose: true,
  });
  return db;
}

const connect = init();


export async function login(res, username, password) {
  const db = await connect;
  const record = await db.get(
    'SELECT * FROM Accounts WHERE accountName = ? AND accountPassword = ?',
    [username, password],
  );

  if (record) {
    res.status(200).send('Login successful');
  } else {
    res.status(401).send('Invalid login');
  }
}

export async function register(res, username, password) {
  const db = await connect;
  await db.run(
    'INSERT INTO Accounts (accountName, accountPassword) VALUES (?, ?)',
    [username, password],
  );
  await db.commit();
  await db.close();
  res.status(200).json('Registration successful');
  // TODO: Add error handling for duplicate usernames / special characters
}
