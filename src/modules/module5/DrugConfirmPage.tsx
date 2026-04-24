import { useState, useMemo } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { QueryError } from '@/components/common/QueryError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVisitSummaryList } from './useDrugConfirm'
import { PatientList } from './PatientList'
import { useFacilitiesList } from '@/hooks/useFacilities'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'

export default function DrugConfirmPage() {
  const { user } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [serviceDate, setServiceDate] = useState(today)
  const [hospCode, setHospCode] = useState<string>(user?.role === 'staff_hsc' ? (user?.hosp_code ?? '') : '')

  // Facility list for admin users
  const { data: facilities = [] } = useFacilitiesList()

  const filters = useMemo(() => {
    const f: { service_date: string; hosp_code?: string } = { service_date: serviceDate }
    if (hospCode && hospCode !== '__all__') f.hosp_code = hospCode
    return f
  }, [serviceDate, hospCode])

  const { data: patients = [], isLoading, isError, refetch } = useVisitSummaryList(filters)

  // staff_hsc always filtered to own hosp_code
  const displayPatients = useMemo(() => {
    if (user?.role === 'staff_hsc' && user.hosp_code) {
      return patients.filter((p) => p.hosp_code === user.hosp_code)
    }
    return patients
  }, [patients, user?.role, user?.hosp_code])

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
            <Input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>
          {user?.role !== 'staff_hsc' && (
            <div className="grid gap-1.5">
              <Label>รพ.สต.</Label>
              <Select value={hospCode} onValueChange={(v) => { if (v) setHospCode(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกแห่ง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">ทุกแห่ง</SelectItem>
                  {facilities.map((f) => (
                    <SelectItem key={f.hosp_code} value={f.hosp_code}>
                      {f.hosp_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Patient list */}
        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : (
          <PatientList patients={displayPatients} isLoading={isLoading} />
        )}
      </div>
    </PageWrapper>
  )
}
