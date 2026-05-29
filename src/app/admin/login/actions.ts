"use server";

import { redirect } from 'next/navigation';
import { loginPlatformOwner } from '../../../lib/auth';
import { limiters, getClientIp } from '../../../lib/rateLimit';

export async function loginAction(formData: FormData) {
  const ip = await getClientIp();
  
  try {
    const rateLimitResult = await limiters.adminLogin.limit(ip);
    if (!rateLimitResult.success) {
      redirect('/admin/login?error=Too%20many%20login%20attempts.%20Please%20try%20again%20later.');
    }
  } catch (error) {
    console.error('Rate limit check failed for admin login:', error);
  }

  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/admin/login?error=Enter%20both%20email%20and%20password.');
  }

  let errorMessage: string | null = null;
  try {
    const result = await loginPlatformOwner(email, password);
    if (!result.ok) {
      errorMessage = result.message ?? 'Login failed.';
    }
  } catch (error) {
    console.error('Admin login failed.', error);
    errorMessage = 'Login is temporarily unavailable.';
  }

  if (errorMessage) {
    redirect(`/admin/login?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect('/admin');
}
