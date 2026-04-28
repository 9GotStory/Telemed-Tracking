import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { Toaster } from '@/components/ui/sonner'
import { PasswordChangeDialog } from '@/modules/auth/PasswordChangeDialog'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PasswordChangeDialog />
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}

export default App
