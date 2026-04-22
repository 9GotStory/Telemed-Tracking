# Visit Meds API Contract (Module 5)

## visitMeds.list

**Method**: GET
**Access**: All authenticated users (filtered by role)
**Query Params**: `?action=visitMeds.list&token=xxx&vn=250501001`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "med_id": "uuid",
      "vn": "250501001",
      "drug_name": "Metformin",
      "strength": "500 mg",
      "qty": 30,
      "unit": "เม็ด",
      "sig": "1x2 หลังอาหาร",
      "source": "hosp_stock",
      "is_changed": "N",
      "round": 1,
      "status": "draft",
      "note": "",
      "updated_by": "user-uuid",
      "updated_at": "2026-04-30T14:30:00Z"
    }
  ]
}
```

**CRITICAL**: Response does NOT include `tel` and `hn` — excluded by GAS before responding.

**GAS Logic**:
- Return VISIT_MEDS for given VN
- staff_hsc: validate VN belongs to caller's `hosp_code` (via VISIT_SUMMARY)
- Exclude `tel` and `hn` fields from response (these are on VISIT_SUMMARY, not VISIT_MEDS, but the combined response must not leak them)

---

## visitMeds.save

**Method**: POST
**Access**: All authenticated users (filtered by role)
**Request Body**:
```json
{
  "action": "visitMeds.save",
  "token": "xxx",
  "data": {
    "vn": "250501001",
    "action_type": "confirm_all",
    "meds": []
  }
}
```

**OR (edit drugs)**:
```json
{
  "action": "visitMeds.save",
  "token": "xxx",
  "data": {
    "vn": "250501001",
    "action_type": "edit",
    "meds": [
      {
        "med_id": "uuid",
        "drug_name": "Metformin",
        "strength": "500 mg",
        "qty": 30,
        "unit": "เม็ด",
        "sig": "1x2 หลังอาหาร",
        "source": "hsc_stock",
        "note": ""
      },
      {
        "med_id": "",
        "drug_name": "Amlodipine",
        "strength": "5 mg",
        "qty": 30,
        "unit": "เม็ด",
        "sig": "1x1 หลังอาหาร",
        "source": "hosp_pending",
        "note": "Added new drug"
      }
    ]
  }
}
```

**OR (mark absent)**:
```json
{
  "action": "visitMeds.save",
  "token": "xxx",
  "data": {
    "vn": "250501001",
    "action_type": "absent",
    "meds": []
  }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Drugs confirmed" } }
```

**GAS Logic by action_type**:

**confirm_all**:
1. Update all VISIT_MEDS for VN: `status = confirmed`
2. Update VISIT_SUMMARY: `dispensing_confirmed = Y`, `confirmed_by = caller.user_id`, `confirmed_at = now`

**edit**:
1. For each med in request:
   - If `med_id` exists → update, set `is_changed = Y` if drug data changed
   - If `med_id` empty → insert new with `is_changed = Y`
2. Compute and update VISIT_SUMMARY:
   - `has_drug_change = Y` (if any med has `is_changed = Y`)
   - `drug_source_pending = Y` (if any med has `source = hosp_pending`)
   - `dispensing_confirmed = Y`
   - `confirmed_by`, `confirmed_at`
3. Log to AUDIT_LOG

**absent**:
1. Update VISIT_SUMMARY: `attended = N`
2. Update all VISIT_MEDS for VN: `status = cancelled`
3. Log to AUDIT_LOG
