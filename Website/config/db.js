import { Pool } from "pg";

const pool = new Pool({
  user: "postgres.mnysgjtrtlsafospupte",
  host: "aws-0-eu-central-1.pooler.supabase.com",
  database: "postgres",
  password: "TikiFant@hun92%99", // Put your real password here!
  port: 5432,
});

export default pool;