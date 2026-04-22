import { Outlet } from 'react-router-dom'

/** Layout for public pages (login, register) — no sidebar or header */
export function PublicLayout() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-light-gray">
      <Outlet />
    </div>
  )
}
