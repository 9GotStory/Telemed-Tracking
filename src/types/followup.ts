export interface Followup {
  followup_id: string
  vn: string
  followup_date: string
  general_condition: string
  side_effect: string
  drug_adherence: string
  other_note: string
  recorded_by: string
  recorded_at: string
}

export interface FollowupWithVisit extends Followup {
  patient_name: string
  hn: string
  tel: string
  clinic_type: string
  hosp_code: string
  service_date: string
  has_drug_change: 'Y' | 'N'
  drug_source_pending: 'Y' | 'N'
  followup_status: 'pending' | 'followed'
}
