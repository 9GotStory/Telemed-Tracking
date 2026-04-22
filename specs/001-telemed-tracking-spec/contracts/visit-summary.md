# Visit Summary API Contract (Module 5)

## visitSummary.list

**Method**: GET
**Access**: All authenticated users (filtered by role)
**Query Params**: `?action=visitSummary.list&token=xxx&service_date=2026-05-01&hosp_code=10669`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "vn": "250501001",
      "patient_name": "นายสมชาย ใจดี",
      "clinic_type": "PCU-DM",
      "hosp_code": "10669",
      "hosp_name": "รพ.สต.นาหลวง",
      "service_date": "2026-05-01",
      "attended": "Y",
      "has_drug_change": "N",
      "drug_source_pending": "N",
      "dispensing_confirmed": "Y",
      "diff_status": "pending"
    }
  ]
}
```

**CRITICAL**: Response does NOT include `tel`, `hn`, `dob` — these fields are excluded for Module 5. Only Module 6 (followup.list) returns sensitive fields.

**GAS Logic**:
- staff_hsc: filter by caller's `hosp_code` only
- staff_hosp and above: return all (optionally filtered by `service_date`, `hosp_code`)
- Exclude columns: `tel`, `hn`, `dob`
- JOIN with FACILITIES for `hosp_name`
