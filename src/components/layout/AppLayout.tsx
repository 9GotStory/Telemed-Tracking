import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function AppLayout() {
  return (
    <div className="min-h-svh flex">
      <Sidebar />
      <div className="flex-1 lg:ml-60 flex flex-col">
        <Header />
        <Outlet />
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
