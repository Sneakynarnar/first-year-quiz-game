import sqlite3 from 'sqlite3';

sqlite3.verbose();

// TODO: Hook up an actual database, not defined within the memory.
const db = new sqlite3.Database(':memory');

export default db;