export type ClinicType = 'PCU-DM' | 'PCU-HT' | 'PCU-COPD' | 'ANC-nutrition' | 'ANC-parent' | 'postpartum-EPI' | 'postpartum-dev'
export type DrugSource = 'hosp_stock' | 'hosp_pending'

// Re-export from constants for single source of truth — consumers should prefer these
export type { ClinicTypeValue } from '@/constants/clinicTypes'
export type { DrugSourceValue } from '@/constants/drugSources'
export type DiffStatus = 'pending' | 'matched' | 'mismatch'
export type MedStatus = 'draft' | 'confirmed' | 'cancelled'

export interface VisitSummary {
  vn: string // PK, from HosXP
  hn: string
  patient_name: string
  dob: string
  tel: string // sensitive — Module 6 only
  clinic_type: ClinicType
  hosp_code: string
  service_date: string
  attended: 'Y' | 'N' | ''
  has_drug_change: 'Y' | 'N' | ''
  drug_source_pending: 'Y' | 'N' | ''
  dispensing_confirmed: 'Y' | 'N' | ''
  import_round1_at: string | null
  import_round2_at: string | null
  diff_status: DiffStatus | ''
  confirmed_by: string | null
  confirmed_at: string | null
  drug_sent_date: string
  drug_received_date: string
  drug_delivered_date: string
}

/** VisitSummary without sensitive fields (used in Module 5) */
export type VisitSummarySafe = Omit<VisitSummary, 'tel' | 'hn'>

export interface VisitMed {
  med_id: string
  vn: string
  drug_name: string
  strength: string
  qty: number
  unit: string
  sig: string
  source: DrugSource
  is_changed: 'Y' | 'N'
  round: 1 | 2
  status: MedStatus
  note: string
  updated_by: string
  updated_at: string
}
