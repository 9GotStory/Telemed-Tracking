import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RoleGuard } from '@/components/common/RoleGuard'

// Lazy-loaded module pages
import LoginPage from '@/modules/auth/LoginPage'
import RegisterPage from '@/modules/auth/RegisterPage'
import MasterDrugPage from '@/modules/master-drugs/MasterDrugPage'

// Placeholder pages for modules not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageWrapper>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">Coming soon</p>
    </PageWrapper>
  )
}

export const router = createBrowserRouter([
  // Public routes (no auth)
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // Dashboard (public, no sidebar)
  {
    path: '/dashboard',
    element: <PlaceholderPage title="Dashboard" />,
  },

  // Protected routes (auth required, with sidebar layout)
  {
    element: <RoleGuard><AppLayout /></RoleGuard> as React.ReactElement,
    children: [
      {
        path: '/module1',
        element: <PlaceholderPage title="ทะเบียนอุปกรณ์" />,
      },
      {
        path: '/module2',
        element: (
          <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
            <PlaceholderPage title="ตรวจสอบความพร้อม" />
          </RoleGuard>
        ),
      },
      {
        path: '/module3',
        element: <PlaceholderPage title="ตารางคลินิก" />,
      },
      {
        path: '/module4',
        element: (
          <RoleGuard allowedRoles={['super_admin', 'admin_hosp', 'staff_hosp']}>
            <PlaceholderPage title="Import ข้อมูลผู้ป่วย" />
          </RoleGuard>
        ),
      },
      {
        path: '/module5',
        element: <PlaceholderPage title="ยืนยันรายการยา" />,
      },
      {
        path: '/module6',
        element: (
          <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
            <PlaceholderPage title="ติดตาม Case" />
          </RoleGuard>
        ),
      },
      {
        path: '/master-drugs',
        element: (
          <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
            <MasterDrugPage />
          </RoleGuard>
        ),
      },
      {
        path: '/users',
        element: (
          <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
            <PlaceholderPage title="จัดการผู้ใช้" />
          </RoleGuard>
        ),
      },
      {
        path: '/settings',
        element: (
          <RoleGuard allowedRoles={['super_admin']}>
            <PlaceholderPage title="ตั้งค่าระบบ" />
          </RoleGuard>
        ),
      },
    ],
  },

  // Default + catch-all → redirect to login (inside PublicLayout for proper styling)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '*', element: <LoginPage /> },
    ],
  },
])
