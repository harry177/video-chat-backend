import { db } from "../db";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await db.query<UserRow>(
    `
      select id, email, password_hash, display_name
      from users
      where email = $1
      limit 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await db.query<UserRow>(
    `
      select id, email, password_hash, display_name
      from users
      where id = $1
      limit 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
