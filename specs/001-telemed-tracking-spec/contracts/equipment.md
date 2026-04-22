# Equipment API Contract (Module 1)

## equipment.list

**Method**: GET
**Access**: All authenticated users (filtered by role)
**Query Params**: `?action=equipment.list&token=xxx&status=ready`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "equip_id": "uuid",
      "hosp_code": "10669",
      "set_type": "A",
      "device_type": "computer",
      "os": "Windows 11",
      "status": "ready",
      "is_backup": "N",
      "software": "MOPH Meet,Google Meet,Zoom",
      "internet_mbps": 30,
      "responsible_person": "นายกิตติ",
      "responsible_tel": "0812345678",
      "note": "",
      "updated_at": "2026-04-22T10:00:00Z",
      "updated_by": "user-uuid",
      "hosp_name": "รพ.สต.นาหลวง"
    }
  ]
}
```

**GAS Logic**:
- staff_hsc: filter by caller's `hosp_code` only, exclude `status=inactive`
- staff_hosp and above: return all (optionally filtered by `status` query param)
- JOIN with FACILITIES to include `hosp_name`

---

## equipment.save

**Method**: POST
**Access**: All authenticated users
**Request Body**:
```json
{
  "action": "equipment.save",
  "token": "xxx",
  "data": {
    "equip_id": "uuid-or-empty-for-new",
    "hosp_code": "10669",
    "set_type": "A",
    "device_type": "computer",
    "os": "Windows 11",
    "status": "ready",
    "is_backup": "N",
    "software": "MOPH Meet,Google Meet",
    "internet_mbps": 30,
    "responsible_person": "นายกิตติ",
    "responsible_tel": "0812345678",
    "note": ""
  }
}
```

**Response**:
```json
{ "success": true, "data": { "equip_id": "uuid" } }
```

**GAS Logic**:
1. Validate: staff_hsc can only save for own `hosp_code`
2. If `equip_id` empty → generate UUID, insert new row
3. If `equip_id` exists → update existing row
4. Set `updated_by = caller.user_id`, `updated_at = now`
5. Log to AUDIT_LOG

---

## equipment.delete

**Method**: POST
**Access**: All authenticated users (own facility only for staff_hsc)
**Request Body**:
```json
{
  "action": "equipment.delete",
  "token": "xxx",
  "data": { "equip_id": "uuid" }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Equipment deactivated" } }
```

**GAS Logic**:
1. Validate ownership: staff_hsc can only delete own facility's equipment
2. Set `status = inactive` (soft delete — never remove row)
3. Log to AUDIT_LOG: action=DELETE
