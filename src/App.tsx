import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthStore } from '@/stores/authStore'
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
    </>
  )
}

export default App
