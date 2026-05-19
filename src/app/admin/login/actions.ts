"use server";

import { redirect } from 'next/navigation';
import { loginPlatformOwner } from '../../../lib/auth';

export async function loginAction(formData: FormData) {
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
