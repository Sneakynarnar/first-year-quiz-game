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

export async function sendFriendRequest(res, username, requestee) {
  const db = await connect;
  const existingFriendRequests = await db.get(
    'SELECT * FROM friend_requests WHERE user = ? AND requestee = ?', [username, requestee],
  );
  if (existingFriendRequests) {
    res.status(400).json('Friend request already sent');
    return;
  }
  const user = await db.get(
    'SELECT * FROM Accounts WHERE accountName = ?', [username],
  );
  if (!user) {
    res.status(400).json('User does not exist');
    return;
  }
  await db.run(
    'INSERT INTO friend_requests (user, requestee) VALUES (?, ?)', [user, requestee],
  );
  res.status(200).json('Friend request sent to');
}

export async function acceptFriendRequest(res, username, requestee) {
  const db = await connect;
  await db.run(
    'INSERT INTO friends (user1, user2) VALUES (?, ?)',
  );
  await db.run(
    'DELETE FROM friend_requests WHERE (user = ? AND requestee = ?)', [requestee, username],
  );
  res.status(200).json('Friend request accepted');
}

export async function getFriendRequests(res, username) {
  const db = await connect;
  const friendRequests = await db.all(
    'SELECT * FROM friend_requests WHERE requestee = ?', [username],
  );
  res.status(200).json(friendRequests);
}

export async function getFriends(res, username) {
  const db = await connect;
  const friends = await db.all(
    'SELECT * FROM friends WHERE user1 = ? OR user2 = ?', [username, username],
  );
  res.status(200).json(friends);
}

export async function ignoreFriendRequest(res, username, requestee) {
  const db = await connect;
  await db.run(
    'DELETE FROM friend_requests WHERE (user = ? AND requestee = ?)', [requestee, username],
  );
  res.status(200).json('Friend request ignored');
}

export async function removeFriend(res, username, friend) {
  const db = await connect;
  await db.run(
    'DELETE FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
    [username, friend, friend, username],
  );
  res.status(200).json('Friend removed');
}

export async function getLeaderboard(res) {
  const db = await connect;
  const leaderboard = await db.all(
    'SELECT * FROM Accounts ORDER BY totalCorrectAnswers DESC',
  );
  res.status(200).json(leaderboard);
}