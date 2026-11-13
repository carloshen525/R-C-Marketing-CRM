'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import MasterDashboardPage from '@/app/admin/dashboard/page';

export default function AdminCanonicalPage() {
  const router = useRouter();
  const { currentUser } = useCRM();

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/acesso-negado');
    } else {
      router.replace('/admin/dashboard');
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return null;
  }

  return <MasterDashboardPage />;
}
