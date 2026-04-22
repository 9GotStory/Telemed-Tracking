# Auth API Contract

## auth.login

**Method**: POST
**Access**: Public (no token required)
**Request Body**:
```json
{
  "action": "auth.login",
  "token": "",
  "data": {
    "hosp_code": "11111",
    "password": "plain-text-password"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "token": "uuid-v4-session-token",
    "role": "admin_hosp",
    "hosp_code": "11111",
    "first_name": "สมชาย",
    "last_name": "ใจดี"
  }
}
```

**Response (Error)**:
```json
{ "success": false, "error": "Invalid credentials" }
{ "success": false, "error": "Account pending approval" }
{ "success": false, "error": "Account disabled" }
```

**GAS Logic**:
1. Find user in USERS where `hosp_code` matches and `status = active`
2. Verify `password` against stored `password_hash` (SHA-256 + salt)
3. Generate `session_token` = `Utilities.getUuid()`
4. Set `session_expires` = now + 8 hours
5. Update USERS row with new token and expiry
6. Return token + user info (never return password_hash)

---

## auth.register

**Method**: POST
**Access**: Public (no token required)
**Request Body**:
```json
{
  "action": "auth.register",
  "token": "",
  "data": {
    "hosp_code": "10669",
    "password": "plain-text-password",
    "first_name": "สมหญิง",
    "last_name": "รักเรียน",
    "tel": "0812345678"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": { "message": "Registration submitted. Awaiting admin approval." }
}
```

**Response (Error)**:
```json
{ "success": false, "error": "Invalid hosp_code" }
{ "success": false, "error": "Facility not active" }
```

**GAS Logic**:
1. Check HOSPITAL: `hosp_code` exists AND `active = Y`
2. Determine max role from `hosp_type` (สสอ.=super_admin, รพ.=admin_hosp, รพ.สต.=staff_hsc)
3. Hash password with salt
4. Insert into USERS: `status = pending`, `role = max_role_for_hosp_type`
5. Return success message

**Zod Schema (Frontend Validation)**:
```typescript
const registerSchema = z.object({
  hosp_code: z.string().length(5),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  tel: z.string().regex(/^[0-9]{9,10}$/)
})
```

---

## auth.logout

**Method**: POST
**Access**: Authenticated

**Request Body**:
```json
{
  "action": "auth.logout",
  "token": "current-session-token",
  "data": {}
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Logged out" } }
```

**GAS Logic**:
1. Find user by token
2. Clear `session_token` and `session_expires` in USERS row
3. Frontend must also `sessionStorage.removeItem('session_token')`
