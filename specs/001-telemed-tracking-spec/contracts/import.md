# Import API Contract (Module 4)

## import.preview

**Method**: POST
**Access**: super_admin, admin_hosp, staff_hosp
**Request Body**:
```json
{
  "action": "import.preview",
  "token": "xxx",
  "data": {
    "round": 1,
    "hosp_code": "10669",
    "service_date": "2026-05-01",
    "clinic_type": "PCU-DM",
    "visits": [
      {
        "vn": "250501001",
        "hn": "12345",
        "patient_name": "นายสมชาย ใจดี",
        "dob": "15/03/2513",
        "tel": "0812345678",
        "drugs": [
          {
            "drug_name": "Metformin",
            "strength": "500 mg",
            "qty": 30,
            "unit": "เม็ด",
            "sig": "1x2 หลังอาหาร"
          }
        ]
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": [
      { "vn": "250501001", "patient_name": "นายสมชาย ใจดี", "drug_count": 1 }
    ],
    "errors": [
      { "vn": "250501002", "error": "VN already exists in VISIT_SUMMARY" },
      { "vn": "250501003", "error": "drug_name 'UnknownDrug' not in MASTER_DRUGS" }
    ],
    "unknown_drugs": ["UnknownDrug"],
    "summary": {
      "total_rows": 35,
      "unique_vns": 10,
      "valid_vns": 8,
      "error_vns": 2
    }
  }
}
```

**GAS Logic (Round 1)**:
1. For each VN group:
   - Check VN does NOT exist in VISIT_SUMMARY (uniqueness for round 1)
   - Check all drug_names exist in MASTER_DRUGS
   - Check consistent patient data across rows with same VN
2. Separate into valid and error groups
3. Return list of unknown drugs for user to add to MASTER_DRUGS

**GAS Logic (Round 2)**:
1. For each VN group:
   - Check VN EXISTS in VISIT_SUMMARY (must have been imported in round 1)
   - Check all drug_names exist in MASTER_DRUGS
   - Compare drug list with round 1 VISIT_MEDS for this VN
2. Flag each VN as matched or mismatch

---

## import.confirm

**Method**: POST
**Access**: super_admin, admin_hosp
**Request Body**:
```json
{
  "action": "import.confirm",
  "token": "xxx",
  "data": {
    "round": 1,
    "hosp_code": "10669",
    "service_date": "2026-05-01",
    "visits": [
      {
        "vn": "250501001",
        "hn": "12345",
        "patient_name": "นายสมชาย ใจดี",
        "dob": "1970-03-15",
        "tel": "0812345678",
        "clinic_type": "PCU-DM",
        "drugs": [
          {
            "drug_name": "Metformin",
            "strength": "500 mg",
            "qty": 30,
            "unit": "เม็ด",
            "sig": "1x2 หลังอาหาร"
          }
        ]
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "imported_visits": 8,
    "imported_meds": 28,
    "import_round1_at": "2026-04-30T14:30:00Z"
  }
}
```

**GAS Logic (Round 1)**:
1. For each visit:
   - Insert VISIT_SUMMARY row with default values:
     - `attended = blank`, `has_drug_change = N`, `drug_source_pending = N`
     - `dispensing_confirmed = N`, `diff_status = pending`
     - `import_round1_at = now`
   - For each drug in visit:
     - Insert VISIT_MEDS row:
       - `source = hosp_stock`, `is_changed = N`, `round = 1`, `status = draft`
       - `med_id = UUID`, `updated_by = caller.user_id`, `updated_at = now`
2. Log to AUDIT_LOG: action=IMPORT, target summary

**GAS Logic (Round 2)**:
1. For each visit (VN must exist from round 1):
   - Update VISIT_SUMMARY: `import_round2_at = now`
   - Diff drug list against round 1 VISIT_MEDS:
     - If identical → `diff_status = matched`
     - If different → `diff_status = mismatch`
   - Insert/update VISIT_MEDS with `round = 2`, `status = draft`
2. Log to AUDIT_LOG
