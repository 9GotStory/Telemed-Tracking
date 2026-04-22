# Users API Contract

## users.list

**Method**: GET
**Access**: super_admin (all users) / admin_hosp (staff_hosp + staff_hsc only)
**Query Params**: `?action=users.list&token=xxx&status=pending&role=staff_hsc&hosp_code=10669`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "hosp_code": "10669",
      "first_name": "สมหญิง",
      "last_name": "รักเรียน",
      "tel": "0812345678",
      "role": "staff_hsc",
      "status": "pending",
      "created_at": "2026-04-22T10:00:00Z"
    }
  ]
}
```

**GAS Logic**:
- super_admin: return all users (optionally filtered by query params)
- admin_hosp: return only users with role `staff_hosp` or `staff_hsc` (exclude super_admin, admin_hosp)
- Support optional filters: `status`, `role`, `hosp_code`

---

## users.approve

**Method**: POST
**Access**: super_admin / admin_hosp
**Request Body**:
```json
{
  "action": "users.approve",
  "token": "xxx",
  "data": {
    "user_id": "uuid-of-pending-user",
    "role": "staff_hsc"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "User approved" } }
```

**GAS Logic**:
1. Validate approver can manage target user's role level
2. Update USERS: `status = active`, `role = data.role`, `approved_by = caller.user_id`
3. Validate `data.role` does not exceed max role for user's hosp_type
4. Log to AUDIT_LOG: action=APPROVE

---

## users.update

**Method**: POST
**Access**: super_admin / admin_hosp
**Request Body**:
```json
{
  "action": "users.update",
  "token": "xxx",
  "data": {
    "user_id": "uuid",
    "role": "staff_hosp",
    "status": "inactive"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "User updated" } }
```

**GAS Logic**:
1. Validate caller permissions (admin_hosp cannot modify super_admin)
2. If changing role: validate against hosp_type max role
3. If setting status=inactive: soft-disable account (clear session_token)
4. Log to AUDIT_LOG: action=UPDATE, old/new values

---

## users.resetPassword

**Method**: POST
**Access**: super_admin / admin_hosp
**Request Body**:
```json
{
  "action": "users.resetPassword",
  "token": "xxx",
  "data": {
    "user_id": "uuid",
    "new_password": "temp-password"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Password reset. User must change on next login." } }
```

**GAS Logic**:
1. Hash new password
2. Update USERS: `password_hash = new_hash`
3. Clear `session_token` (force re-login)
4. Log to AUDIT_LOG
