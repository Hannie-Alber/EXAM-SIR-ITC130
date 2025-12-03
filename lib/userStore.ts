import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

const USER_STORE_KEY = Symbol.for("next-shop:userStore");
const USER_STORE_LOADED_KEY = Symbol.for("next-shop:userStoreLoaded");

type GlobalWithUserStore = typeof globalThis & {
  [USER_STORE_KEY]?: LocalUser[];
  [USER_STORE_LOADED_KEY]?: boolean;
};

const globalWithStore = globalThis as GlobalWithUserStore;

const users: LocalUser[] =
  globalWithStore[USER_STORE_KEY] ?? (globalWithStore[USER_STORE_KEY] = []);

const DATA_DIR = path.join(process.cwd(), ".data");
const USER_FILE = path.join(DATA_DIR, "users.json");

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function loadUsersFromDisk(): Promise<LocalUser[]> {
  try {
    const raw = await fs.readFile(USER_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (u): u is LocalUser =>
        typeof u === "object" &&
        u !== null &&
        typeof (u as LocalUser).id === "string" &&
        typeof (u as LocalUser).email === "string" &&
        typeof (u as LocalUser).passwordHash === "string"
    );
  } catch (err: unknown) {
    const nodeErr = err as { code?: string };

    if (nodeErr?.code === "ENOENT") {
      return [];
    }

    console.error("[userStore] Failed to load users.json", err);
    return [];
  }
}

async function saveUsersToDisk(): Promise<void> {
  try {
    await ensureDataDir();
    const json = JSON.stringify(users, null, 2);
    await fs.writeFile(USER_FILE, json, "utf8");
  } catch (err) {
    console.error("[userStore] Failed to save users.json", err);
  }
}

async function ensureLoaded(): Promise<void> {
  if (globalWithStore[USER_STORE_LOADED_KEY]) return;

  const fromDisk = await loadUsersFromDisk();
  users.splice(0, users.length, ...fromDisk);
  globalWithStore[USER_STORE_LOADED_KEY] = true;
}

function genId(): string {
  return `user_${Math.random().toString(36).slice(2)}${Date.now().toString(
    36
  )}`;
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<LocalUser> {
  await ensureLoaded();

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
  await saveUsersToDisk();

  return user;
}

export async function findUserByEmail(
  email: string
): Promise<LocalUser | undefined> {
  await ensureLoaded();
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
