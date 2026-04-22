# Readiness API Contract (Module 2)

## readiness.list

**Method**: GET
**Access**: super_admin, admin_hosp
**Query Params**: `?action=readiness.list&token=xxx&hosp_code=10669&check_date=2026-04-22`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "log_id": "uuid",
      "hosp_code": "10669",
      "hosp_name": "รพ.สต.นาหลวง",
      "check_date": "2026-04-22",
      "cam_ok": "Y",
      "mic_ok": "Y",
      "pc_ok": "Y",
      "internet_ok": "Y",
      "software_ok": "N",
      "overall_status": "need_fix",
      "note": "Software needs update",
      "checked_by": "user-uuid",
      "checked_at": "2026-04-22T07:15:00Z"
    }
  ]
}
```

**GAS Logic**:
- Return readiness logs, optionally filtered by `hosp_code` and/or `check_date`
- JOIN with FACILITIES for `hosp_name`
- Ordered by `check_date` DESC

---

## readiness.save

**Method**: POST
**Access**: super_admin, admin_hosp
**Request Body**:
```json
{
  "action": "readiness.save",
  "token": "xxx",
  "data": {
    "hosp_code": "10669",
    "check_date": "2026-04-22",
    "cam_ok": "Y",
    "mic_ok": "Y",
    "pc_ok": "Y",
    "internet_ok": "Y",
    "software_ok": "N",
    "note": "Software needs update"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "log_id": "uuid" } }
```

**GAS Logic**:
1. Compute `overall_status`:
   - All Y → `"ready"`
   - `pc_ok = N` OR `internet_ok = N` → `"not_ready"`
   - Otherwise → `"need_fix"`
2. Check if log exists for `hosp_code + check_date`
   - If exists → update (upsert)
   - If not → insert with new UUID
3. Set `checked_by = caller.user_id`, `checked_at = now`
4. Log to AUDIT_LOG
