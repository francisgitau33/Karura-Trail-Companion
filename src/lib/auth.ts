import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac, timingSafeEqual } from 'crypto';
import { isDatabaseConfigured, query } from './db';
import { logAuditEvent } from './audit';

const COOKIE_NAME = 'karura_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const ROLE_PLATFORM_OWNER = 'PLATFORM_OWNER';
export const CMS_SETUP_MESSAGE = 'CMS is not configured. Please set DATABASE_URL and ADMIN_SESSION_SECRET.';

export interface AdminSession {
  userId: string;
  email: string;
  role: 'PLATFORM_OWNER';
  exp: number;
}

interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters.');
  }
  return secret;
}

export function getCmsSetupStatus() {
  const missing: string[] = [];
  if (!isDatabaseConfigured()) missing.push('DATABASE_URL');
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    missing.push('ADMIN_SESSION_SECRET');
  }

  return {
    isConfigured: missing.length === 0,
    missing,
    message: missing.length
      ? `${CMS_SETUP_MESSAGE} Missing or invalid: ${missing.join(', ')}.`
      : null,
  };
}

function base64Url(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function createSessionCookie(session: AdminSession) {
  const payload = base64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

function verifySessionCookie(value?: string): AdminSession | null {
  if (!value) return null;
  if (!getCmsSetupStatus().isConfigured) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
    if (session.exp < Date.now()) return null;
    if (session.role !== ROLE_PLATFORM_OWNER) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requirePlatformOwner() {
  if (!getCmsSetupStatus().isConfigured) {
    redirect('/admin/login?setup=1');
  }

  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  let result: { rows: Array<{ id: string }> };
  try {
    result = await query<{ id: string }>(
      `
        select id
        from admin_users
        where id = $1 and email = $2 and role = 'PLATFORM_OWNER' and is_active = true
        limit 1
      `,
      [session.userId, session.email],
    );
  } catch (error) {
    console.error('Admin session verification failed.', error);
    redirect('/admin/login?setup=1');
  }

  if (!result.rows[0]) {
    redirect('/admin/login');
  }

  return session;
}

export async function loginPlatformOwner(emailInput: string, password: string) {
  if (!getCmsSetupStatus().isConfigured) {
    return { ok: false, message: CMS_SETUP_MESSAGE };
  }

  const email = emailInput.toLowerCase().trim();
  const result = await query<AdminUserRow>(
    `
      select id, email, password_hash, role, is_active
      from admin_users
      where email = $1
      limit 1
    `,
    [email],
  );
  const user = result.rows[0];

  if (!user || !user.is_active || user.role !== ROLE_PLATFORM_OWNER) {
    await logAuditEvent({
      actorEmail: email,
      action: 'ADMIN_LOGIN_FAILED',
      entityType: 'admin_users',
      metadata: { reason: 'inactive_or_missing_user' },
    });
    return { ok: false, message: 'Invalid email or password.' };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    await logAuditEvent({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'ADMIN_LOGIN_FAILED',
      entityType: 'admin_users',
      entityId: user.id,
      metadata: { reason: 'bad_password' },
    });
    return { ok: false, message: 'Invalid email or password.' };
  }

  const session: AdminSession = {
    userId: user.id,
    email: user.email,
    role: 'PLATFORM_OWNER',
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionCookie(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  await query('update admin_users set last_login_at = now(), updated_at = now() where id = $1', [user.id]);
  await logAuditEvent({
    actorUserId: user.id,
    actorEmail: user.email,
    action: 'ADMIN_LOGIN_SUCCESS',
    entityType: 'admin_users',
    entityId: user.id,
  });

  return { ok: true };
}

export async function logoutPlatformOwner(session: AdminSession | null) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  await logAuditEvent({
    actorUserId: session?.userId ?? null,
    actorEmail: session?.email ?? null,
    action: 'ADMIN_LOGOUT',
    entityType: 'admin_users',
    entityId: session?.userId ?? null,
  });
}
