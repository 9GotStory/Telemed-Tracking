import { useState, useMemo, useCallback } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { PageWrapper } from '@/components/layout/PageWrapper'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/common/DatePicker'
import { HospCodeSelect } from '@/components/common/HospCodeSelect'
import { FollowupList } from './FollowupList'
import { useFacilitiesList } from '@/hooks/useFacilities'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import type { FollowupFilters } from '@/services/followupService'
import { useDebugMount } from '@/hooks/useDebugLog'
import { X, Info, Search } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  'ทุกสถานะ': 'ทุกสถานะ',
  pending: 'รอติดตาม',
  followed: 'ติดตามแล้ว',
}

export default function FollowupPage() {
  useDebugMount('FollowupPage')

  const [statusFilter, setStatusFilter] = useState<string>('ทุกสถานะ')
  const [hospCodeFilter, setHospCodeFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [nameFilter, setNameFilter] = useState<string>('')
  const [clinicFilter, setClinicFilter] = useState<string>('ทุกคลินิก')

  const { data: facilities = [] } = useFacilitiesList()

  const filters = useMemo<FollowupFilters>(() => {
    const f: FollowupFilters = {}
    if (statusFilter !== 'ทุกสถานะ') f.status = statusFilter as 'pending' | 'followed'
    if (hospCodeFilter) f.hosp_code = hospCodeFilter
    if (dateFilter) f.service_date = dateFilter
    if (nameFilter.trim()) f.patient_name = nameFilter.trim()
    if (clinicFilter !== 'ทุกคลินิก') f.clinic_type = clinicFilter
    return f
  }, [statusFilter, hospCodeFilter, dateFilter, nameFilter, clinicFilter])

  const dateFilterObj = useMemo(() => {
    if (!dateFilter) return undefined
    const d = parseISO(dateFilter)
    return isValid(d) ? d : undefined
  }, [dateFilter])

  const handleDateFilterChange = useCallback((d: Date | undefined) => {
    setDateFilter(d ? format(d, 'yyyy-MM-dd') : '')
  }, [])

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ติดตาม Case</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ติดตามผู้ป่วยหลังให้บริการ
          </p>
        </div>

        {/* Info text */}
        <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>แสดงเฉพาะรายการที่ยืนยันการจ่ายยาแล้ว (Module 5)</span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
              <SelectTrigger className="w-full">
                <span className="truncate">{STATUS_LABELS[statusFilter] ?? statusFilter}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ทุกสถานะ">ทุกสถานะ</SelectItem>
                  <SelectItem value="pending">รอติดตาม</SelectItem>
                  <SelectItem value="followed">ติดตามแล้ว</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {statusFilter !== 'ทุกสถานะ' && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setStatusFilter('ทุกสถานะ')}
                title="ล้างตัวกรอง"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <HospCodeSelect
              value={hospCodeFilter}
              onChange={setHospCodeFilter}
              items={facilities}
              placeholder="ทุกแห่ง"
              className="flex-1"
            />
            {hospCodeFilter && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setHospCodeFilter('')}
                title="ล้างตัวกรอง"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={clinicFilter} onValueChange={(v) => { if (v) setClinicFilter(v) }}>
              <SelectTrigger className="w-full">
                <span className="truncate">
                  {clinicFilter === 'ทุกคลินิก' ? 'ทุกคลินิก' : (CLINIC_TYPES.find(c => c.value === clinicFilter)?.label ?? clinicFilter)}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ทุกคลินิก">ทุกคลินิก</SelectItem>
                  {CLINIC_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {clinicFilter !== 'ทุกคลินิก' && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setClinicFilter('ทุกคลินิก')}
                title="ล้างตัวกรอง"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="ค้นหาชื่อผู้ป่วย..."
                className="pl-8"
              />
            </div>
            {nameFilter && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setNameFilter('')}
                title="ล้างการค้นหา"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DatePicker
              value={dateFilterObj}
              onChange={handleDateFilterChange}
              placeholder="วันที่ให้บริการ"
              className="flex-1"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDateFilter('')}
                title="ล้างวันที่"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Followup list */}
        <FollowupList filters={filters} />
      </div>
    </PageWrapper>
  )
}
