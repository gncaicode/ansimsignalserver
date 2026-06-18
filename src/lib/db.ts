import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.DB_HOST,
      port:               Number(process.env.DB_PORT ?? 3306),
      user:               process.env.DB_USER,
      password:           process.env.DB_PASSWORD,
      database:           process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit:    10,
      timezone:           '+00:00',
      charset:            'utf8mb4',
    });
  }
  return pool;
}

export async function query<T extends RowDataPacket>(
  sql: string,
  params?: (string | number | null)[]
): Promise<{ rows: T[]; rowCount: number }> {
  const [rows] = await getPool().execute<T[]>(sql, params);
  return { rows, rowCount: rows.length };
}

export async function execute(
  sql: string,
  params?: (string | number | null)[]
): Promise<{ affectedRows: number; insertId: number }> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return { affectedRows: result.affectedRows, insertId: result.insertId };
}
