import bcrypt from 'bcrypt';
import { Pool } from 'pg';
const p = new Pool({ connectionString: process.env.DBCHECK_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  const r = await p.query("SELECT id,email,password,role,status FROM users WHERE email=$1", ['negaromanzirdesis@gmail.com']);
  if (r.rows.length === 0) { console.log('not found'); process.exit(0); }
  const u = r.rows[0];
  console.log('pw hash prefix:', u.password.slice(0, 20));
  for (const guess of [process.env.GUESS1, process.env.GUESS2]) {
    if (!guess) continue;
    try {
      const ok = await bcrypt.compare(guess, u.password);
      console.log(`match(${guess}):`, ok);
    } catch(e){ console.log('compare err for', guess, e.message); }
  }
  await p.end();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
