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
      timezone:           '+09:00', // dateStrings:true 환경에서는 타입캐스트에만 영향 (실질적 no-op)
      dateStrings:        true,   // DATETIME을 Date 객체 대신 문자열로 반환 (KST 서버 기준 문자열)
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

// 여러 쿼리를 하나의 DB 트랜잭션으로 묶는다 — 중간에 실패하면 전부 롤백된다.
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
