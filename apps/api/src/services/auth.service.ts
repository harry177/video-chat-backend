import { comparePassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { findUserByEmail, findUserById } from "../repositories/user.repository";
import { AuthUser } from "../types/auth";

function mapUser(
  row: Awaited<ReturnType<typeof findUserByEmail>> extends infer T
    ? T extends null
      ? never
      : T
    : never,
): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

export async function login(params: { email: string; password: string }) {
  const user = await findUserByEmail(params.email);

  if (!user) {
    return null;
  }

  const isValid = await comparePassword(params.password, user.password_hash);

  if (!isValid) {
    return null;
  }

  const authUser = mapUser(user);

  return {
    user: authUser,
    accessToken: signAccessToken(authUser),
  };
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  const user = await findUserById(userId);

  if (!user) {
    return null;
  }

  return mapUser(user);
}
