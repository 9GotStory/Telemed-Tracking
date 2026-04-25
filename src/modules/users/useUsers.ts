import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersService } from '@/services/usersService'
import type { UserFilters, UserApproveValues, UserUpdateValues, PasswordResetValues } from '@/services/usersService'

const usersKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...usersKeys.all, 'list', filters] as const,
}

export function useUsersList(filters: UserFilters = {}) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => usersService.list(filters),
  })
}

export function useUserApprove(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserApproveValues) => usersService.approve(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('อนุมัติผู้ใช้สำเร็จ')
      onSuccess?.()
    },
    onError: (err) => { toast.error('อนุมัติไม่สำเร็จ', { description: err.message }) },
  })
}

export function useUserUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserUpdateValues) => usersService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('อัปเดตผู้ใช้สำเร็จ')
    },
    onError: (err) => { toast.error('อัปเดตไม่สำเร็จ', { description: err.message }) },
  })
}

export function usePasswordReset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PasswordResetValues) => usersService.resetPassword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ')
    },
    onError: (err) => { toast.error('รีเซ็ตไม่สำเร็จ', { description: err.message }) },
  })
}
