# Schedule API Contract (Module 3)

## schedule.list

**Method**: GET
**Access**: All authenticated users
**Query Params**: `?action=schedule.list&token=xxx&month=2026-05&hosp_code=10669`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "schedule_id": "uuid",
      "service_date": "2026-05-01",
      "hosp_code": "10669",
      "hosp_name": "รพ.สต.นาหลวง",
      "clinic_type": "PCU-DM",
      "service_time": "09.00-10.00",
      "appoint_count": 15,
      "telemed_link": "https://meet.moph.go.th/xxx",
      "link_added_by": "user-uuid",
      "incident_note": "",
      "updated_at": "2026-04-28T10:00:00Z",
      "actual_count": 12
    }
  ]
}
```

**GAS Logic**:
- Return schedules, optionally filtered by `month` (YYYY-MM), `hosp_code`
- staff_hsc: filter to own `hosp_code`
- For each schedule, compute `actual_count`: COUNT of VISIT_SUMMARY where `service_date + hosp_code + clinic_type` match AND `attended = Y`
- JOIN with FACILITIES for `hosp_name`

---

## schedule.save

**Method**: POST
**Access**: super_admin, admin_hosp
**Request Body**:
```json
{
  "action": "schedule.save",
  "token": "xxx",
  "data": {
    "schedule_id": "uuid-or-empty-for-new",
    "service_date": "2026-05-01",
    "hosp_code": "10669",
    "clinic_type": "PCU-DM",
    "service_time": "09.00-10.00",
    "appoint_count": 15
  }
}
```

**Response**:
```json
{ "success": true, "data": { "schedule_id": "uuid" } }
```

**GAS Logic**:
1. Validate: only super_admin, admin_hosp can create/edit
2. If schedule_id empty → insert new with UUID
3. If schedule_id exists → update
4. Set `updated_at = now`
5. Log to AUDIT_LOG

---

## schedule.setLink

**Method**: POST
**Access**: staff_hosp and above
**Request Body**:
```json
{
  "action": "schedule.setLink",
  "token": "xxx",
  "data": {
    "schedule_id": "uuid",
    "telemed_link": "https://meet.moph.go.th/room-123"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Link updated" } }
```

**GAS Logic**:
1. Validate: staff_hosp and above
2. Update `telemed_link` and `link_added_by = caller.user_id`
3. Log to AUDIT_LOG

---

## schedule.recordIncident

**Method**: POST
**Access**: All authenticated users
**Request Body**:
```json
{
  "action": "schedule.recordIncident",
  "token": "xxx",
  "data": {
    "schedule_id": "uuid",
    "incident_note": "Internet disconnected for 10 minutes"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Incident recorded" } }
```

**GAS Logic**:
1. Update `incident_note` on schedule
2. Log to AUDIT_LOG
