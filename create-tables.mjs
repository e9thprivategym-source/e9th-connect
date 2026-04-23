import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Parse connection string
const url = new URL(connectionString);
const config = {
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : undefined,
};

console.log('Connecting to database...');
console.log(`Host: ${config.host}, Port: ${config.port}, Database: ${config.database}`);

const connection = await mysql.createConnection(config);

const createTablesSql = `
CREATE TABLE IF NOT EXISTS users (
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
);

CREATE TABLE IF NOT EXISTS meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  meal_date DATE NOT NULL,
  meal_time_category ENUM('朝食', '昼食', '夕食', '間食') NOT NULL,
  food_items_json JSON NOT NULL,
  total_calories DECIMAL(10, 2) NOT NULL,
  total_pfc_json JSON NOT NULL,
  micronutrients_json JSON,
  image_url VARCHAR(2048),
  ai_feedback TEXT,
  trainer_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS trainings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  training_date DATE NOT NULL,
  training_type VARCHAR(255),
  duration_minutes INT,
  calories_burned DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  meal_id INT,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  read_at TIMESTAMP,
  attachment_url VARCHAR(2048),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  target_calories DECIMAL(10, 2),
  target_pfc_json JSON,
  dynamic_macro_enabled BOOLEAN DEFAULT FALSE,
  high_carb_macro_json JSON,
  low_carb_macro_json JSON,
  diet_mode ENUM('通常', 'バルクアップ', 'ケトジェニック') NOT NULL DEFAULT '通常',
  sleep_sync_enabled BOOLEAN DEFAULT FALSE,
  steps_sync_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reward_type ENUM('point', 'badge') NOT NULL,
  description TEXT NOT NULL,
  points INT DEFAULT 0,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

try {
  const statements = createTablesSql.split(';').filter(s => s.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await connection.execute(statement);
      console.log('✓ Success');
    }
  }
  console.log('\n✅ All tables created successfully!');
} catch (error) {
  console.error('❌ Error creating tables:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
