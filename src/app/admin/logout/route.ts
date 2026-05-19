import { redirect } from 'next/navigation';
import { getAdminSession, logoutPlatformOwner } from '../../../lib/auth';

export async function GET() {
  const session = await getAdminSession();
  await logoutPlatformOwner(session);
  redirect('/admin/login');
}
