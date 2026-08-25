import cron from 'node-cron';
import pool from '../config/db.js';
import { updateWorkshopStatusesQuery as updateWorkshopStatuses } from '../models/workshop/Workshop.js';

/**
 * Delete expired workshops 
 */
const cleanupExpiredWorkshops = async () => {
    try {
        console.log('🧹 Running workshop cleanup job...');

        const result = await pool.query(`
      DELETE FROM workshops
      WHERE 
        (end_date + end_time) < NOW()
        AND status IN ('completed', 'cancelled')
      RETURNING id, title
    `);

        if (result.rows.length > 0) {
            console.log(`Deleted ${result.rows.length} expired workshops:`);
            result.rows.forEach(w => console.log(`   - ${w.title} (ID: ${w.id})`));
        } else {
            console.log(' No expired workshops to delete');
        }

        return result.rows;
    } catch (error) {
        console.error('Error in workshop cleanup:', error);
        throw error;
    }
};

/**
 * Delete old workshops (>7 days after completion)
 */
const cleanupOldWorkshops = async () => {
    try {
        console.log('Running old workshops cleanup...');

        const result = await pool.query(`
      DELETE FROM workshops
      WHERE 
        end_date < (CURRENT_DATE - INTERVAL '7 days')
        AND status = 'completed'
      RETURNING id, title, end_date
    `);

        if (result.rows.length > 0) {
            console.log(`Deleted ${result.rows.length} old workshops (>7 days):`);
            result.rows.forEach(w =>
                console.log(`   - ${w.title} (Ended: ${w.end_date})`)
            );
        } else {
            console.log('No old workshops to delete');
        }

        return result.rows;
    } catch (error) {
        console.error('Error in old workshops cleanup:', error);
        throw error;
    }
};

/**
 * Initialize all cron jobs
 */
export const initWorkshopJobs = () => {
    console.log('Initializing workshop cleanup jobs...');

    // Job 1: Update statuses every hour
    cron.schedule('0 * * * *', async () => {
        console.log('\n[Hourly] Checking workshop statuses...');
        await updateWorkshopStatuses();
    });

    // Job 2: Delete expired workshops daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('\n [Daily 2AM] Running workshop cleanup...');
        await cleanupExpiredWorkshops();
    });

    // Job 3: Delete old workshops weekly on Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('\n [Weekly Sunday 3AM] Cleaning old workshops...');
        await cleanupOldWorkshops();
    });

    console.log('Workshop jobs scheduled:');
    console.log('   Status update: Every hour');
    console.log('   Expired cleanup: Daily at 2:00 AM');
    console.log('   Old cleanup: Sundays at 3:00 AM');
};

export {
    cleanupExpiredWorkshops,
    cleanupOldWorkshops,
};