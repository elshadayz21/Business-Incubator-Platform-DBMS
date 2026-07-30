import db from "../../config/db.js";

export const checkDatabaseHealth = async () => {
  try {
    // Test connection
    await db.query("SELECT NOW()");
    console.log("✅ Database connection OK");

    // Check if workshops table exists
    const tableCheckResult = await db.query(`
      SELECT EXISTS(
        SELECT FROM information_schema.tables 
        WHERE table_name = 'workshops'
      )
    `);
    const workshopsTableExists = tableCheckResult.rows[0].exists;
    console.log(
      `${workshopsTableExists ? "✅" : "❌"} Workshops table exists:`,
      workshopsTableExists,
    );

    // Check workshop count
    if (workshopsTableExists) {
      const countResult = await db.query(
        "SELECT COUNT(*) as count FROM workshops",
      );
      const workshopCount = countResult.rows[0].count;
      console.log(`📊 Total workshops in database: ${workshopCount}`);

      // Sample a workshop
      if (workshopCount > 0) {
        const sampleResult = await db.query(
          "SELECT id, title, status, mentor_name FROM workshops LIMIT 1",
        );
        console.log(`📝 Sample workshop:`, sampleResult.rows[0]);
      }
    }

    // Check workshop_enrollments table
    const enrollmentsTableResult = await db.query(`
      SELECT EXISTS(
        SELECT FROM information_schema.tables 
        WHERE table_name = 'workshop_enrollments'
      )
    `);
    const enrollmentsTableExists = enrollmentsTableResult.rows[0].exists;
    console.log(
      `${enrollmentsTableExists ? "✅" : "❌"} Workshop enrollments table exists:`,
      enrollmentsTableExists,
    );

    return {
      connectionOk: true,
      workshopsTableExists,
      enrollmentsTableExists,
      workshopCount: workshopsTableExists
        ? await db
            .query("SELECT COUNT(*) as count FROM workshops")
            .then((r) => r.rows[0].count)
        : 0,
    };
  } catch (error) {
    console.error("❌ Database health check failed:", error.message);
    return {
      connectionOk: false,
      error: error.message,
    };
  }
};

