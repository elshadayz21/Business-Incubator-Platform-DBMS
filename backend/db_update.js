import pool from "./config/db.js";

async function updateDb() {
  try {
    // 1. Add category column if it doesn't exist
    await pool.query(`
      ALTER TABLE workshops 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General'
    `);
    console.log("Column 'category' verified/added to workshops table.");

    // 2. Update workshop categories based on title matches
    const updates = [
      { category: 'product', titleLike: '%MVP%' },
      { category: 'product', titleLike: '%UI/UX%' },
      { category: 'product', titleLike: '%SaaS%' },
      { category: 'product', titleLike: '%Product Management%' },
      { category: 'marketing', titleLike: '%Growth%' },
      { category: 'marketing', titleLike: '%Marketing%' },
      { category: 'marketing', titleLike: '%Analytics%' },
      { category: 'marketing', titleLike: '%Success & Retention%' },
      { category: 'finance', titleLike: '%Financial%' },
      { category: 'finance', titleLike: '%Fundraising%' },
      { category: 'legal', titleLike: '%Legal%' },
      { category: 'strategy', titleLike: '%Pitch Deck%' },
      { category: 'strategy', titleLike: '%Customer Discovery%' },
      { category: 'strategy', titleLike: '%Technical Due Diligence%' },
      { category: 'strategy', titleLike: '%Sales%' },
      { category: 'strategy', titleLike: '%Metrics%' },
      { category: 'strategy', titleLike: '%Launch%' },
      { category: 'strategy', titleLike: '%Research%' },
      { category: 'strategy', titleLike: '%Team%' },
      { category: 'strategy', titleLike: '%Scaling%' },
      { category: 'strategy', titleLike: '%International%' }
    ];

    for (const update of updates) {
      const result = await pool.query(
        `UPDATE workshops SET category = $1 WHERE title LIKE $2`,
        [update.category, update.titleLike]
      );
      console.log(`Updated workshops with pattern "${update.titleLike}" to "${update.category}". Count: ${result.rowCount}`);
    }

    // Clean up any other NULL categories
    await pool.query(`UPDATE workshops SET category = 'General' WHERE category IS NULL`);
    console.log("Database update completed successfully!");

  } catch (err) {
    console.error("Database update error:", err.message);
  } finally {
    await pool.end();
  }
}

updateDb();
