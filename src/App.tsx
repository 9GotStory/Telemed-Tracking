import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthStore } from '@/stores/authStore'
import { Toaster } from '@/components/ui/sonner'
import { PasswordChangeDialog } from '@/modules/auth/PasswordChangeDialog'
import { useEffect } from 'react'

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return null
}

function App() {
  return (
    <>
      <AuthHydrator />
      <RouterProvider router={router} />
      <PasswordChangeDialog />
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}

export default App
