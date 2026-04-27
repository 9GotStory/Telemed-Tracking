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
import type { VisitSummaryItem } from '@/services/visitService'

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'absent' | 'pending_drug'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รอยืนยัน' },
  { value: 'confirmed', label: 'ยืนยันแล้ว' },
  { value: 'absent', label: 'ไม่มารับบริการ' },
  { value: 'pending_drug', label: 'รอส่งยา' },
]

function matchesStatusFilter(patient: VisitSummaryItem, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'pending':
      return patient.dispensing_confirmed !== 'Y' && patient.attended !== 'N'
    case 'confirmed':
      return patient.dispensing_confirmed === 'Y'
    case 'absent':
      return patient.attended === 'N'
    case 'pending_drug':
      return patient.drug_source_pending === 'Y'
    default:
      return true
  }
}

export default function DrugConfirmPage() {
  useDebugMount('DrugConfirmPage')
  const { user } = useAuthStore()
  const [serviceDate, setServiceDate] = useState<Date>(new Date())
  const [hospCode, setHospCode] = useState<string>(user?.role === 'staff_hsc' ? (user?.hosp_code ?? '') : '')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Facility list for admin users
  const { data: facilities = [] } = useFacilitiesList()

  const filters = useMemo(() => {
    const f: { service_date: string; hosp_code?: string } = { service_date: format(serviceDate, 'yyyy-MM-dd') }
    if (hospCode && hospCode !== '__all__') f.hosp_code = hospCode
    return f
  }, [serviceDate, hospCode])

  const { data: patients = [], isLoading, isError, refetch } = useVisitSummaryList(filters)

  const filteredPatients = useMemo(
    () => statusFilter === 'all' ? patients : patients.filter((p) => matchesStatusFilter(p, statusFilter)),
    [patients, statusFilter],
  )

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <div className="grid gap-1.5">
            <Label>สถานะ</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} items={STATUS_OPTIONS}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Patient list */}
        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : (
          <PatientList patients={filteredPatients} isLoading={isLoading} />
        )}
      </div>
    </PageWrapper>
  )
}
