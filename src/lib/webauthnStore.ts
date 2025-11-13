type CredentialRecord = {
  id: string;
  publicKey: Buffer;
  counter: number;
  transports?: AuthenticatorTransport[];
};

type UserRecord = {
  email: string;
  username?: string;
  credentials: CredentialRecord[];
  currentChallenge?: string;
};

const users = new Map<string, UserRecord>();

export function getUser(email: string): UserRecord | undefined {
  return users.get(email);
}

export function ensureUser(email: string, username?: string): UserRecord {
  const existing = users.get(email);
  if (existing) return existing;
  const created: UserRecord = { email, username, credentials: [] };
  users.set(email, created);
  return created;
}

export function setChallenge(email: string, challenge: string) {
  const user = ensureUser(email);
  user.currentChallenge = challenge;
}

export function getChallenge(email: string): string | undefined {
  return users.get(email)?.currentChallenge;
}

export function clearChallenge(email: string) {
  const user = users.get(email);
  if (user) user.currentChallenge = undefined;
}

export function addCredential(email: string, cred: CredentialRecord) {
  const user = ensureUser(email);
  // avoid duplicates
  if (!user.credentials.find(c => c.id === cred.id)) {
    user.credentials.push(cred);
  }
}

export function getCredentials(email: string): CredentialRecord[] {
  return users.get(email)?.credentials ?? [];
}

export function updateCounter(email: string, id: string, counter: number) {
  const user = users.get(email);
  if (!user) return;
  const cred = user.credentials.find(c => c.id === id);
  if (cred) cred.counter = counter;
}

export function getEnv() {
  const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
  const rpName = process.env.RP_NAME || 'RentiTool';
  const origin = process.env.ORIGIN || 'http://localhost:3000';
  return { rpID, rpName, origin };
}