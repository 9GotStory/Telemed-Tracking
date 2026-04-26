import { useState, useMemo } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { QueryError } from '@/components/common/QueryError'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/common/DatePicker'
import { useVisitSummaryList } from './useDrugConfirm'
import { PatientList } from './PatientList'
import { useFacilitiesList } from '@/hooks/useFacilities'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import { useDebugMount } from '@/hooks/useDebugLog'

export default function DrugConfirmPage() {
  useDebugMount('DrugConfirmPage')
  const { user } = useAuthStore()
  const [serviceDate, setServiceDate] = useState<Date>(new Date())
  const [hospCode, setHospCode] = useState<string>(user?.role === 'staff_hsc' ? (user?.hosp_code ?? '') : '')

  // Facility list for admin users
  const { data: facilities = [] } = useFacilitiesList()

  const filters = useMemo(() => {
    const f: { service_date: string; hosp_code?: string } = { service_date: format(serviceDate, 'yyyy-MM-dd') }
    if (hospCode && hospCode !== '__all__') f.hosp_code = hospCode
    return f
  }, [serviceDate, hospCode])

  const { data: patients = [], isLoading, isError, refetch } = useVisitSummaryList(filters)

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ยืนยันรายการยา</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ตรวจสอบและยืนยันการจ่ายยาผู้ป่วย
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>วันที่ให้บริการ</Label>
            <DatePicker
              value={serviceDate}
              onChange={(d) => { if (d) setServiceDate(d) }}
              placeholder="เลือกวันที่"
            />
          </div>
          {user?.role !== 'staff_hsc' && (
            <div className="grid gap-1.5">
              <Label>รพ.สต.</Label>
              <Select value={hospCode || '__all__'} onValueChange={(v) => { if (v) setHospCode(v === '__all__' ? '' : v) }} items={[{ label: 'ทุกแห่ง', value: '__all__' }, ...facilities.map(f => ({ label: `${f.hosp_name} (${f.hosp_code})`, value: f.hosp_code }))]}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทุกแห่ง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__all__">ทุกแห่ง</SelectItem>
                    {facilities.map((f) => (
                      <SelectItem key={f.hosp_code} value={f.hosp_code}>
                        {f.hosp_name} ({f.hosp_code})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Patient list */}
        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : (
          <PatientList patients={patients} isLoading={isLoading} />
        )}
      </div>
    </PageWrapper>
  )
}
