import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RoleGuard } from '@/components/common/RoleGuard'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// Module pages
import LoginPage from '@/modules/auth/LoginPage'
import RegisterPage from '@/modules/auth/RegisterPage'
import DashboardPage from '@/modules/dashboard/DashboardPage'
import MasterDrugPage from '@/modules/master-drugs/MasterDrugPage'
import SchedulePage from '@/modules/module3/SchedulePage'
import ReadinessPage from '@/modules/module2/ReadinessPage'
import ImportPage from '@/modules/module4/ImportPage'
import DrugConfirmPage from '@/modules/module5/DrugConfirmPage'
import FollowupPage from '@/modules/module6/FollowupPage'
import UsersPage from '@/modules/users/UsersPage'
import SettingsPage from '@/modules/settings/SettingsPage'

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
    element: <DashboardPage />,
  },

  // Protected routes (auth required, with sidebar layout)
  {
    element: <RoleGuard><AppLayout /></RoleGuard> as React.ReactElement,
    children: [
      {
        path: '/module1',
        element: <ErrorBoundary><PlaceholderPage title="ทะเบียนอุปกรณ์" /></ErrorBoundary>,
      },
      {
        path: '/module2',
        element: (
          <ErrorBoundary>
            <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
              <ReadinessPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/module3',
        element: <ErrorBoundary><SchedulePage /></ErrorBoundary>,
      },
      {
        path: '/module4',
        element: (
          <ErrorBoundary>
            <RoleGuard allowedRoles={['super_admin', 'admin_hosp', 'staff_hosp']}>
              <ImportPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/module5',
        element: <ErrorBoundary><DrugConfirmPage /></ErrorBoundary>,
      },
      {
        path: '/module6',
        element: (
          <ErrorBoundary>
            <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
              <FollowupPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/master-drugs',
        element: (
          <ErrorBoundary>
            <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
              <MasterDrugPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/users',
        element: (
          <ErrorBoundary>
            <RoleGuard allowedRoles={['super_admin', 'admin_hosp']}>
              <UsersPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/settings',
        element: (
          <ErrorBoundary>
            <RoleGuard allowedRoles={['super_admin']}>
              <SettingsPage />
            </RoleGuard>
          </ErrorBoundary>
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
