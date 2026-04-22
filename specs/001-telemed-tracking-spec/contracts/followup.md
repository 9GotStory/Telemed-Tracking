# Followup API Contract (Module 6)

## followup.list

**Method**: GET
**Access**: super_admin, admin_hosp only
**Query Params**: `?action=followup.list&token=xxx&status=pending&hosp_code=10669`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "vn": "250501001",
      "patient_name": "นายสมชาย ใจดี",
      "tel": "0812345678",
      "hn": "12345",
      "hosp_code": "10669",
      "hosp_name": "รพ.สต.นาหลวง",
      "clinic_type": "PCU-DM",
      "service_date": "2026-05-01",
      "has_drug_change": "Y",
      "drug_source_pending": "N",
      "dispensing_confirmed": "Y",
      "followup_status": "pending",
      "followup_records": [],
      "meds": [
        {
          "med_id": "uuid",
          "drug_name": "Metformin",
          "strength": "500 mg",
          "qty": 30,
          "unit": "เม็ด",
          "sig": "1x2 หลังอาหาร",
          "source": "hosp_stock",
          "is_changed": "Y",
          "status": "confirmed"
        }
      ]
    },
    {
      "vn": "250501002",
      "patient_name": "นางสมหญิง รักเรียน",
      "tel": "0898765432",
      "hn": "12346",
      "hosp_code": "10669",
      "hosp_name": "รพ.สต.นาหลวง",
      "clinic_type": "PCU-HT",
      "service_date": "2026-05-01",
      "has_drug_change": "N",
      "drug_source_pending": "Y",
      "dispensing_confirmed": "Y",
      "followup_status": "followed",
      "followup_records": [
        {
          "followup_id": "uuid",
          "followup_date": "2026-05-05",
          "general_condition": "ปกติ",
          "side_effect": "ไม่มี",
          "drug_adherence": "กินยาตรงเวลา",
          "other_note": "",
          "recorded_by": "user-uuid",
          "recorded_at": "2026-05-05T09:30:00Z"
        }
      ],
      "meds": []
    }
  ]
}
```

**CRITICAL**: This is the ONLY API that returns `tel`, `hn`, and full patient data. Restricted to super_admin and admin_hosp.

**GAS Logic**:
1. Query VISIT_SUMMARY where `dispensing_confirmed = Y`
2. LEFT JOIN with FOLLOWUP on `vn`
3. For each visit: determine `followup_status`:
   - `"pending"` if no FOLLOWUP records exist
   - `"followed"` if at least 1 FOLLOWUP record exists
4. Include all FOLLOWUP records for each VN (multiple allowed)
5. Include VISIT_MEDS where `status = confirmed`
6. Filter by optional params: `status` (pending/followed), `hosp_code`
7. Include sensitive fields: `tel`, `hn`

---

## followup.save

**Method**: POST
**Access**: super_admin, admin_hosp only
**Request Body**:
```json
{
  "action": "followup.save",
  "token": "xxx",
  "data": {
    "vn": "250501001",
    "followup_date": "2026-05-05",
    "general_condition": "ปกติ",
    "side_effect": "ไม่มีผลข้างเคียง",
    "drug_adherence": "กินยาตรงเวลา",
    "other_note": ""
  }
}
```

**Response**:
```json
{ "success": true, "data": { "followup_id": "uuid" } }
```

**GAS Logic**:
1. Validate: VN exists in VISIT_SUMMARY and `dispensing_confirmed = Y`
2. Insert new FOLLOWUP record with UUID
3. Set `recorded_by = caller.user_id`, `recorded_at = now`
4. Log to AUDIT_LOG

**Note**: Multiple followup records per VN are allowed. Each save creates a new record.
