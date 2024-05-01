import { QUnit } from 'qunit';
import * as accounts from './accounts.mjs';
import * as sockets from './sockets.mjs';
import * as quizes from './quizes.mjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { init } from './setup.mjs';
import sinon from 'sinon';
import Filter from 'bad-words';
const filter = new Filter();
filter.addWords('leagueoflegends');


const connect = init();
console.log('=======================================================');

QUnit.module('Accounts Module');
function add(a, b) {
  return a + b;
}
QUnit.test('Example test', (assert) => {
  assert.ok(true, 'This test should pass if everything is set up correctly');
  assert.equal(add(1, 2), 3, '1 + 2 should equal 3');
});

QUnit.test('Login test', async (assert) => {
  const result = await accounts.login('test', 'test');
  assert.ok(result, 'Login should succeed with correct credentials');
  const result2 = await accounts.login('test', 'wrongpassword');
  assert.notOk(result2, 'Login should fail with incorrect password');
});

QUnit.test('Register test', async (assert) => {
  const db = await connect;
  await db.run('DELETE FROM Accounts WHERE accountName = ?', ['QUnit']);

  const result = await accounts.register('test', 'test');
  assert.equal(result, 'UserAlreadyExists', 'Register should fail if the user already exists');
  const result2 = await accounts.register('QUnit', 'test');
  assert.equal(result2, 'Success', 'Register should succeed if the user does not exist');
});

QUnit.test('Send friend request test', async (assert) => {
  const db = await connect;
  await db.run('DELETE FROM Friends WHERE user1 = ? OR user2 = ?', ['QUnit', 'QUnit']);
  await db.run('DELETE FROM FriendRequests WHERE user = ? OR requestee = ?', ['QUnit', 'QUnit']);
  await db.run('INSERT INTO Friends (user1, user2) VALUES (?, ?)', ['QUnit', 'sneaky']);
  assert.equal(await accounts.sendFriendRequest('test', 'test'), 'Cannot add self', 'Cannot add self as a friend');
  assert.equal(await accounts.sendFriendRequest('test', 'QUnit'), 'Success', 'Friend request should succeed');
  assert.equal(await accounts.sendFriendRequest('QUnit', 'sneaky'), 'User and requestee are already friends', 'Cannot add the same friend twice');
  assert.equal(await accounts.sendFriendRequest('test', 'QUnit2'), 'User does not exist', 'Cannot friend request a user that does not exist');
  assert.equal(await accounts.sendFriendRequest('test', 'QUnit'), 'Friend request already sent', 'Cannot send the same friend request twice');
  assert.equal(await accounts.sendFriendRequest('QUnit', 'test'), 'Success', 'Friend request should succeed');
});
QUnit.test('Accept friend request test', async (assert) => {
  const db = await connect;
  await db.run('DELETE FROM Friends WHERE user1 = ? OR user2 = ?', ['QUnit', 'QUnit']);
  await db.run('DELETE FROM FriendRequests WHERE user = ? OR requestee = ?', ['QUnit', 'QUnit']);
  await db.run('INSERT INTO FriendRequests (user, requestee) VALUES (?, ?)', ['test', 'QUnit']);
  assert.equal(await accounts.acceptFriendRequest('test', 'QUnit'), 'Success', 'Accept friend request should succeed');
  assert.equal(await accounts.acceptFriendRequest('test', 'QUnit'), 'No friend request from that user', 'Cannot accept a friend request that does not exist');
  assert.equal(await accounts.acceptFriendRequest('test', 'QUnit2'), 'No friend request from that user', 'The friend request should not exist after being accepted');
});

QUnit.test('Ignore friend request test', async (assert) => {
  const db = await connect;
  await db.run('DELETE FROM FriendRequests WHERE user = ? OR requestee = ?', ['QUnit', 'QUnit']);
  await db.run('INSERT INTO FriendRequests (user, requestee) VALUES (?, ?)', ['test', 'QUnit']);
  assert.equal(await accounts.ignoreFriendRequest('test', 'QUnit'), 'Success', 'Ignore friend request should succeed');
  assert.equal(await accounts.ignoreFriendRequest('test', 'QUnit'), 'No friend request from that user', 'Cannot ignore a friend request that does not exist');
});

QUnit.test('Remove friend test', async (assert) => {
  const db = await connect;
  await db.run('DELETE FROM Friends WHERE user1 = ? OR user2 = ?', ['QUnit', 'QUnit']);
  await db.run('INSERT INTO Friends (user1, user2) VALUES (?, ?)', ['test', 'QUnit']);
  assert.equal(await accounts.removeFriend('test', 'QUnit'), 'Success', 'Remove friend should succeed');
  assert.equal(await accounts.removeFriend('test', 'QUnit'), 'No friend found', 'Cannot remove a friend that does not exist');
});

QUnit.module('Sockets Module');

QUnit.test('Socket test', (assert) => {
  assert.ok(sockets, 'Sockets module should be imported');
});

QUnit.test('Generating a room ID test', (assert) => {
  const id1 = sockets.generateRoomId();
  const id2 = sockets.generateRoomId();
  assert.notEqual(id1, id2, 'generateRoomId should return unique IDs');
  assert.equal(id1.length, 6, 'Room IDs should be 6 characters long');
  assert.equal(id2.length, 6, 'Room IDs should be 6 characters long');
});

QUnit.test('Create Room test', (assert) => {
  const socket = { join: sinon.fake() };
  const io = {
    to: sinon.fake.returns({ emit: sinon.fake() }),
  };
  const username = 'test';
  sockets.createRoom(socket, io, username);
  assert.ok(socket.join.calledOnce, 'Socket should join the room');
  assert.ok(io.to.calledOnce, 'Socket should join the room');
  assert.ok(io.to.calledWithMatch(sinon.match.string), 'Socket should join the room');
});

QUnit.test('Join Room test', (assert) => {
  const socket = { emit: sinon.stub(), join: sinon.stub() };
  const io = { to: sinon.stub().returns({ emit: sinon.stub() }) };
  const roomId = '123456';
  const username = 'test';
  sockets.joinRoom(socket, roomId, io, username);
  assert.ok(socket.emit.calledWith('roomError', 'Invalid Room ID'), 'socket.emit should be called with "roomError" and "Invalid Room ID"');
  sockets.roomMembers[roomId] = { users: [username] };
  sockets.activeRooms.set(roomId, true);
  sockets.joinRoom(socket, roomId, io, username);
  assert.ok(socket.emit.calledWith('roomError', 'User already in room'), 'socket.emit should be called with "roomError" and "User already in room"');
});


QUnit.test('Send Message test', (assert) => {
  const socket = { emit: sinon.stub() };
  const io = { to: sinon.stub().returns({ emit: sinon.stub() }) };
  const roomId = '123';
  const messageContent = 'Hello, world!';
  const username = 'test';
  // Setup: add room to activeRooms
  sockets.sendMessage(socket, io, roomId, messageContent, username);
  assert.ok(socket.emit.calledWith('roomError', 'Invalid Room ID'), 'socket.emit should be called with "roomError" and "Invalid Room ID"');
  sockets.activeRooms.set(roomId, true);
  sockets.sendMessage(socket, io, roomId, messageContent, username);
  assert.ok(io.to().emit.calledWith('message', username, 'Hello, world!'), 'io.to().emit should be called with "message", username, and messageContent');
  sockets.sendMessage(socket, io, roomId, 'leagueoflegends is the best game of all time', username);
  assert.ok(io.to().emit.calledWith('message', username, '*************** is the best game of all time'), 'io.to().emit should be called with "message", username, and filtered messageContent');
  sockets.activeRooms.delete(roomId);
});

QUint.test('Storing quiz from json test', async (assert) => {
  const db = await connect;
  await db.run('DELETE FROM Questions');
  await quizes.storeQuizFromJson();
  const questions = await db.all('SELECT * FROM Questions');
  assert.equal(questions.length, 3, 'Three questions should be stored in the database');
  assert.equal(questions[0].question, 'What is the capital of France?', 'First question should be "What is the capital of France?"');
  assert.equal(questions[1].question, 'What is the capital of Spain?', 'Second question should be "What is the capital of Spain?"');
  assert.equal(questions[2].question, 'What is the capital of Germany?', 'Third question should be "What is the capital of Germany?"');
});

// TODO: Add tests for delete room and quit room functions
// QUnit.test('Delete Room test', (assert) => {
//   const socket = { rooms: { find: sinon.stub() }, id: '123' };
//   const io = { emit: sinon.stub() };
//   const roomId = '123';
//   sockets.quitRoom(socket, io);
//   assert.ok(io.emit.calledWith('roomDeleted', roomId), 'io.emit should be called with "roomDeleted" and roomId');
//   assert.equal(sockets.activeRooms.get('123'), 'room should no longer be in activeRooms');
//   sockets.quitRoom
// });
