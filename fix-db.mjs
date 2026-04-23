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

try {
  console.log('Fixing users table...');
  
  // Drop the old table and recreate it with correct schema
  await connection.execute('DROP TABLE IF EXISTS users');
  
  const createUsersSQL = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openId VARCHAR(64) NOT NULL UNIQUE,
      name TEXT,
      email VARCHAR(320),
      loginMethod VARCHAR(64),
      role ENUM('customer', 'trainer', 'admin') NOT NULL DEFAULT 'customer',
      assigned_trainer_id INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
  
  await connection.execute(createUsersSQL);
  console.log('✓ users table fixed');
  
  console.log('\n✅ Database schema fixed successfully!');
} catch (error) {
  console.error('❌ Error fixing database:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
