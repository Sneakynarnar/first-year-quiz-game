import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as server from '../server.js';
export async function init() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
    verbose: true,
  });
  return db;
}

const connect = init();


/**
 * Logs in a user with the provided username and password.
 * @param {string} username - The username of the account.
 * @param {string} password - The password of the account.
 * @returns {Promise<boolean>} - A promise that resolves to true if the login is successful, false otherwise.
 */
export async function login(username, password) {
  const db = await connect;
  const record = await db.get(
    'SELECT * FROM Accounts WHERE accountName = ? AND accountPassword = ?',
    [username, password],
  );
  return !!record;
}

/**
 * Registers a new user account.
 * @param {string} username - The username for the new account.
 * @param {string} password - The password for the new account.
 * @returns {Promise<string>} - A promise that resolves to a string indicating the registration status.
 *    Possible values are 'UserAlreadyExists' if the username already exists, and 'Success' if the registration is successful.
 */
export async function register(username, password) {
  const db = await connect;
  const existingUser = await db.get(
    'SELECT * FROM Accounts WHERE accountName = ?', [username],
  );
  if (existingUser) {
    return 'UserAlreadyExists';
  }
  await db.run(
    'INSERT INTO Accounts (accountName, accountPassword) VALUES (?, ?)',
    [username, password],
  );
  return 'Success';
  // TODO: Add error handling for special characters
}

/**
 * Sends a friend request from one user to another.
 * @param {string} username - The username of the user sending the friend request.
 * @param {string} requestee - The username of the user receiving the friend request.
 * @returns {Promise<string>} A promise that resolves to a string indicating the result of the operation.
 */
export async function sendFriendRequest(username, requestee) {
  if (username === requestee) {
    return 'Cannot add self';
  }
  const db = await connect;
  const existingFriendRequests = await db.get(
    'SELECT * FROM FriendRequests WHERE user = ? AND requestee = ?', [username, requestee],
  );
  if (existingFriendRequests) {
    return 'Friend request already sent';
  }
  const existingFriends = await db.get(
    'SELECT * FROM Friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
    [username, requestee, requestee, username],
  );
  if (existingFriends) {
    return 'User and requestee are already friends';
  }
  const user = await db.get(
    'SELECT * FROM Accounts WHERE accountName = ?', [username],
  );
  const requesteeExists = await db.get(
    'SELECT * FROM Accounts WHERE accountName = ?', [requestee],
  );

  if (!user || !requesteeExists) {
    return 'User does not exist';
  }
  await db.run(
    'INSERT INTO FriendRequests (user, requestee) VALUES (?, ?)', [username, requestee],
  );
  server.notifyFriendRequest(requestee);
  return 'Success';
}

/**
 * Accepts a friend request between two users.
 * @param {string} username - The username of the user accepting the friend request.
 * @param {string} requestee - The username of the user who sent the friend request.
 * @returns {Promise<string>} A promise that resolves to a success message if the friend request is accepted, or an error message if no friend request is found.
 */
export async function acceptFriendRequest(username, requestee) {
  const db = await connect;
  const existingFriendRequests = await db.get(
    'SELECT * FROM FriendRequests WHERE user = ? AND requestee = ?', [username, requestee],
  );
  if (!existingFriendRequests) {
    return 'No friend request from that user';
  }
  await db.run(
    'INSERT INTO Friends (user1, user2) VALUES (?, ?)',
    [username, requestee],
  );
  await db.run(
    'DELETE FROM FriendRequests WHERE (user = ? AND requestee = ?)', [username, requestee],
  );
  server.notifyFriendRequestAccepted(requestee, username);
  return 'Success';
}

/**
 * Retrieves friend requests for a given username.
 *
 * @param {string} username - The username for which to retrieve friend requests.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of friend requests.
 */
export async function getFriendRequests(username) {
  const db = await connect;
  const friendRequests = await db.all(
    'SELECT * FROM FriendRequests WHERE requestee = ?', [username],
  );
  return friendRequests;
}

/**
 * Retrieves the friends of a user from the database.
 * @param {Object} res - The response object.
 * @param {string} username - The username of the user.
 * @returns {Array<string>} - An array of usernames representing the user's friends.
 */
export async function getFriends(username) {
  const db = await connect;
  const friendsRows = await db.all(
    'SELECT * FROM friends WHERE user1 = ? OR user2 = ?', [username, username],
  );
  const friends = [];
  for (const friend of friendsRows) {
    if (friend.user1 === username) {
      friends.push(friend.user2);
    } else {
      friends.push(friend.user1);
    }
  }
  return friends;
}

/**
 * Ignores a friend request.
 *
 * @param {Response} res - The response object.
 * @param {string} username - The username of the user receiving the friend request.
 * @param {string} requestee - The username of the user who sent the friend request.
 * @returns {Promise<string>} A promise that resolves to a success message if the friend request is ignored, or an error message if no friend request is found.
 */
export async function ignoreFriendRequest(username, requestee) {
  const db = await connect;
  const existingFriendRequests = await db.get(
    'SELECT * FROM FriendRequests WHERE user = ? AND requestee = ?', [username, requestee],
  );
  if (!existingFriendRequests) {
    return 'No friend request from that user';
  }
  await db.run(
    'DELETE FROM FriendRequests WHERE (user = ? AND requestee = ?)', [username, requestee],
  );
  return 'Success';
}

/**
 * Removes a friend from the database.
 * @param {string} username - The username of the user.
 * @param {string} friend - The username of the friend to be removed.
 * @returns {Promise<string>} A promise that resolves to a success message or an error message.
 */
export async function removeFriend(username, friend) {
  const db = await connect;
  const existingFriend = await db.get(
    'SELECT * FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
    [username, friend, friend, username],
  );
  if (!existingFriend) {
    return 'No friend found';
  }
  await db.run(
    'DELETE FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
    [username, friend, friend, username],
  );
  return 'Success';
}

/**
 * Retrieves the leaderboard from the database.
 * @returns {Promise<Array<Object>>} The leaderboard array containing account information.
 */
export async function getLeaderboard() {
  const db = await connect;
  const leaderboard = await db.all(
    'SELECT * FROM Accounts ORDER BY totalCorrectAnswers DESC',
  );
  return leaderboard;
}
