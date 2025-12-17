const pool = require('../src/db');

const run = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(100),
        user_query TEXT,
        llm_response TEXT,
        response_time INT,
        \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // If an older schema used `created_at`, attempt to rename it to `timestamp` safely
    try {
      await pool.query("ALTER TABLE logs CHANGE COLUMN created_at `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      console.log('✅ Renamed logs.created_at to logs.`timestamp`');
    } catch (e) {
      // If rename fails, it's likely because the column doesn't exist already — ignore
    }

    console.log('✅ Database tables ensured (articles, logs)');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize DB tables:', err);
    process.exit(1);
  }
};

run();
