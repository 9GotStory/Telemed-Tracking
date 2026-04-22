export interface Hospital {
  hosp_code: string // PK, 5 digits
  hosp_name: string
  hosp_type: 'สสอ.' | 'รพ.' | 'รพ.สต.'
  active: 'Y' | 'N'
}
