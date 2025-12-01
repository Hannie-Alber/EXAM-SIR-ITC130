import bcrypt from "bcryptjs";

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

const USER_STORE_KEY = Symbol.for("next-shop:userStore");

type GlobalWithUserStore = typeof globalThis & {
  [USER_STORE_KEY]?: LocalUser[];
};

const globalWithUserStore = globalThis as GlobalWithUserStore;

const users: LocalUser[] =
  globalWithUserStore[USER_STORE_KEY] ??
  (globalWithUserStore[USER_STORE_KEY] = []);

function genId() {
  return `user_${Math.random().toString(36).slice(2)}${Date.now().toString(
    36
  )}`;
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<LocalUser> {
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user: LocalUser = {
    id: genId(),
    name,
    email,
    passwordHash,
  };

  users.push(user);
  return user;
}

export async function findUserByEmail(
  email: string
): Promise<LocalUser | undefined> {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<LocalUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
