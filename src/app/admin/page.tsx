'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import MasterDashboardPage from '../master/page';

export default function AdminCanonicalPage() {
  const router = useRouter();
  const { currentUser } = useCRM();

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/acesso-negado');
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return null;
  }

  return <MasterDashboardPage />;
}
