import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);
const config = {
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : undefined,
};

const connection = await mysql.createConnection(config);

console.log('=== Verifying users table structure ===');
const [result] = await connection.execute('SHOW CREATE TABLE users');
console.log(result[0]['Create Table']);

await connection.end();
