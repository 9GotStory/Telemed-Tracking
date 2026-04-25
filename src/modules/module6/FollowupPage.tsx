import { useState, useMemo } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FollowupList } from './FollowupList'
import { useFacilitiesList } from '@/hooks/useFacilities'
import type { FollowupFilters } from '@/services/followupService'
import { useDebugMount } from '@/hooks/useDebugLog'

export default function FollowupPage() {
  useDebugMount('FollowupPage')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [hospCodeFilter, setHospCodeFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  const { data: facilities = [] } = useFacilitiesList()

  const filters = useMemo<FollowupFilters>(() => {
    const f: FollowupFilters = {}
    if (statusFilter && statusFilter !== '__all__') f.status = statusFilter as 'pending' | 'followed'
    if (hospCodeFilter && hospCodeFilter !== '__all__') f.hosp_code = hospCodeFilter
    if (dateFilter) f.service_date = dateFilter
    return f
  }, [statusFilter, hospCodeFilter, dateFilter])

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

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={statusFilter || '__all__'} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุกสถานะ</SelectItem>
              <SelectItem value="pending">รอติดตาม</SelectItem>
              <SelectItem value="followed">ติดตามแล้ว</SelectItem>
            </SelectContent>
          </Select>
          <Select value={hospCodeFilter || '__all__'} onValueChange={(v) => { if (v) setHospCodeFilter(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="ทุกแห่ง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุกแห่ง</SelectItem>
              {facilities.map((f) => (
                <SelectItem key={f.hosp_code} value={f.hosp_code}>
                  {f.hosp_name} ({f.hosp_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="วันที่ให้บริการ"
              className="w-full"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary text-xs"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Followup list */}
        <FollowupList filters={filters} />
      </div>
    </PageWrapper>
  )
}
