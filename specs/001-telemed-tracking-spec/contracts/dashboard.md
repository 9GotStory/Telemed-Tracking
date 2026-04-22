# Dashboard API Contract (Public)

## dashboard.stats

**Method**: GET
**Access**: Public (no token required)
**Query Params**: `?action=dashboard.stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "equipment_status": [
      {
        "hosp_code": "10669",
        "hosp_name": "รพ.สต.นาหลวง",
        "status": "ready",
        "last_check_date": "2026-04-21"
      }
    ],
    "upcoming_appointments": [
      {
        "service_date": "2026-04-23",
        "hosp_name": "รพ.สต.นาหลวง",
        "clinic_type": "PCU-DM",
        "service_time": "09.00-10.00",
        "appoint_count": 15
      }
    ],
    "monthly_sessions": {
      "2026-04": 12,
      "2026-03": 18
    },
    "attendance_by_clinic": [
      { "clinic_type": "PCU-DM", "total_appointed": 150, "total_attended": 120, "rate": 80.0 },
      { "clinic_type": "PCU-HT", "total_appointed": 100, "total_attended": 85, "rate": 85.0 }
    ],
    "attendance_by_facility": [
      { "hosp_name": "รพ.สต.นาหลวง", "total_appointed": 30, "total_attended": 25, "rate": 83.3 }
    ],
    "followup_pipeline": {
      "followed": 45,
      "pending": 12
    }
  }
}
```

**CRITICAL**: NO patient-identifiable data. No names, phone numbers, VN, HN, or individual drug lists.

**GAS Logic**:
1. Equipment status: Latest READINESS_LOG per facility
2. Upcoming: CLINIC_SCHEDULE where service_date in next 7 days
3. Monthly sessions: COUNT distinct schedule sessions per month
4. Attendance: Aggregate from VISIT_SUMMARY (appoint_count from schedule, attended=Y count)
5. Followup pipeline: COUNT VISIT_SUMMARY with dispensing_confirmed=Y, LEFT JOIN FOLLOWUP → split into followed/pending
6. Strip ALL sensitive fields before responding
