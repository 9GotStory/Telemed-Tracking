import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RoleGuard } from '@/components/common/RoleGuard'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// Module pages
import LoginPage from '@/modules/auth/LoginPage'
import RegisterPage from '@/modules/auth/RegisterPage'
import DashboardPage from '@/modules/dashboard/DashboardPage'
import AboutPage from '@/modules/about/AboutPage'
import EquipmentPage from '@/modules/module1/EquipmentPage'
import MasterDrugPage from '@/modules/master-drugs/MasterDrugPage'
import SchedulePage from '@/modules/module3/SchedulePage'
import ReadinessPage from '@/modules/module2/ReadinessPage'
import ImportPage from '@/modules/module4/ImportPage'
import DrugConfirmPage from '@/modules/module5/DrugConfirmPage'
import FollowupPage from '@/modules/module6/FollowupPage'
import UsersPage from '@/modules/users/UsersPage'
import SettingsPage from '@/modules/settings/SettingsPage'

// Strip trailing slash: '/' → '' (dev), '/Telemed-Tracking/' → '/Telemed-Tracking' (prod)
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

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
    element: <ErrorBoundary><DashboardPage /></ErrorBoundary>,
  },

  // About (public, no sidebar)
  {
    path: '/about',
    element: <ErrorBoundary><AboutPage /></ErrorBoundary>,
  },

  // Protected routes (auth required, with sidebar layout)
  {
    element: <RoleGuard><AppLayout /></RoleGuard> as React.ReactElement,
    children: [
      {
        path: '/module1',
        element: <ErrorBoundary><EquipmentPage /></ErrorBoundary>,
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

  // Default → Dashboard, catch-all → login
  {
    path: '/',
    element: <ErrorBoundary><DashboardPage /></ErrorBoundary>,
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '*', element: <LoginPage /> },
    ],
  },
], { basename })
