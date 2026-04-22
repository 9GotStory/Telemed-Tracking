/**
 * Telemed Tracking คปสอ.สอง — Google Apps Script Backend
 *
 * Entry points: doGet / doPost
 * All responses follow: { success: boolean, data?: T, error?: string }
 *
 * Constitution: CORS Simple Request only.
 *   GET  → e.parameter (token in query string)
 *   POST → JSON.parse(e.postData.contents) (token in body)
 *   NEVER use Content-Type: application/json or custom headers
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var SPREADSHEET_ID = '' // TODO: Set to your Google Spreadsheet ID
var SESSION_DURATION_HOURS = 8
var HASH_ITERATIONS = 10000

// Sheet column indexes (0-based) — must match actual sheet header order
var USERS_COLS = {
  user_id: 0,
  hosp_code: 1,
  first_name: 2,
  last_name: 3,
  tel: 4,
  password_hash: 5,
  password_salt: 6,
  role: 7,
  status: 8,
  approved_by: 9,
  session_token: 10,
  session_expires: 11,
  created_at: 12,
  last_login: 13,
}

var HOSPITAL_COLS = {
  hosp_code: 0,
  hosp_name: 1,
  hosp_type: 2,
  active: 3,
}

var FACILITIES_COLS = {
  hosp_code: 0,
  hosp_name: 1,
  contact_name: 2,
  contact_tel: 3,
  active: 4,
}

var EQUIPMENT_COLS = {
  equip_id: 0,
  hosp_code: 1,
  set_type: 2,
  device_type: 3,
  os: 4,
  status: 5,
  is_backup: 6,
  software: 7,
  internet_mbps: 8,
  responsible_person: 9,
  responsible_tel: 10,
  note: 11,
  updated_at: 12,
  updated_by: 13,
}

var AUDIT_LOG_COLS = {
  log_id: 0,
  user_id: 1,
  action: 2,
  module: 3,
  target_id: 4,
  old_value: 5,
  new_value: 6,
  created_at: 7,
}

var MASTER_DRUG_COLS = {
  drug_id: 0,
  drug_name: 1,
  strength: 2,
  unit: 3,
  active: 4,
}

var VISIT_MEDS_COLS = {
  med_id: 0,
  vn: 1,
  drug_name: 2,
  strength: 3,
  qty: 4,
  unit: 5,
  sig: 6,
  source: 7,
  is_changed: 8,
  round: 9,
  status: 10,
  note: 11,
  updated_by: 12,
  updated_at: 13,
}

// ---------------------------------------------------------------------------
// Entry Points
// ---------------------------------------------------------------------------

function doGet(e) {
  try {
    if (!SPREADSHEET_ID) {
      return buildResponse({ success: false, error: 'Server not configured: SPREADSHEET_ID is empty' })
    }

    var token = e.parameter.token
    var action = e.parameter.action

    // Public endpoints (no token required)
    if (action === 'dashboard.stats') {
      return buildResponse(handleDashboardStats())
    }

    var user = validateSession(token)
    if (!user) {
      return buildResponse({ success: false, error: 'Unauthorized' })
    }

    return buildResponse(routeAction(action, e.parameter, user))
  } catch (err) {
    return buildResponse({ success: false, error: err.message || String(err) })
  }
}

function doPost(e) {
  try {
    if (!SPREADSHEET_ID) {
      return buildResponse({ success: false, error: 'Server not configured: SPREADSHEET_ID is empty' })
    }

    var payload = JSON.parse(e.postData.contents)
    var token = payload.token
    var action = payload.action
    var data = payload.data || {}

    // Public auth endpoints (no token required)
    if (action === 'auth.login') {
      return buildResponse(handleLogin(data))
    }
    if (action === 'auth.register') {
      return buildResponse(handleRegister(data))
    }

    var user = validateSession(token)
    if (!user) {
      return buildResponse({ success: false, error: 'Unauthorized' })
    }

    return buildResponse(routeAction(action, data, user))
  } catch (err) {
    return buildResponse({ success: false, error: err.message || String(err) })
  }
}

// ---------------------------------------------------------------------------
// Response Helper
// ---------------------------------------------------------------------------

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/**
 * Get cached spreadsheet reference — avoids multiple openById calls per request.
 */
var _ssCache = null
function getSpreadsheet() {
  if (!_ssCache) {
    _ssCache = SpreadsheetApp.openById(SPREADSHEET_ID)
  }
  return _ssCache
}

/**
 * Validate session token and return user object (without sensitive fields).
 * Returns null if token is missing, expired, or invalid.
 */
function validateSession(token) {
  if (!token) return null

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')
  var data = sheet.getDataRange().getValues()

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    if (row[USERS_COLS.session_token] === token) {
      var expires = row[USERS_COLS.session_expires]
      if (!expires) continue

      var expiryDate = new Date(expires)
      if (expiryDate < new Date()) {
        // Session expired — clear token
        sheet.getRange(i + 1, USERS_COLS.session_token + 1).setValue('')
        sheet.getRange(i + 1, USERS_COLS.session_expires + 1).setValue('')
        return null
      }

      // Check account is active
      if (row[USERS_COLS.status] !== 'active') {
        return null
      }

      return {
        user_id: row[USERS_COLS.user_id],
        hosp_code: row[USERS_COLS.hosp_code],
        first_name: row[USERS_COLS.first_name],
        last_name: row[USERS_COLS.last_name],
        role: row[USERS_COLS.role],
        hosp_name: getHospName(row[USERS_COLS.hosp_code]),
        rowIndex: i + 1, // 1-based for sheet operations
      }
    }
  }

  return null
}

/**
 * Get hospital name from HOSPITAL sheet by hosp_code.
 */
function getHospName(hospCode) {
  var ss = getSpreadsheet()
  var data = ss.getSheetByName('HOSPITAL').getDataRange().getValues()

  for (var i = 1; i < data.length; i++) {
    if (data[i][HOSPITAL_COLS.hosp_code] === hospCode) {
      return data[i][HOSPITAL_COLS.hosp_name]
    }
  }
  return ''
}

// ---------------------------------------------------------------------------
// Auth Handlers
// ---------------------------------------------------------------------------

/**
 * auth.login — Authenticate user with hosp_code + password.
 * Public endpoint (no token required).
 */
function handleLogin(data) {
  var hospCode = String(data.hosp_code || '').trim()
  var password = String(data.password || '')

  if (!hospCode || !password) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบ' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')
  var rows = sheet.getDataRange().getValues()

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i]
    if (row[USERS_COLS.hosp_code] !== hospCode) continue

    // Check account status
    var status = row[USERS_COLS.status]
    if (status === 'pending') {
      return { success: false, error: 'Account pending approval' }
    }
    if (status === 'inactive') {
      // Skip inactive accounts — try next user with this hosp_code
      continue
    }
    if (status !== 'active') {
      continue
    }

    // Verify password — try this user's credentials
    var salt = row[USERS_COLS.password_salt]
    var storedHash = row[USERS_COLS.password_hash]
    if (!verifyPassword(password, salt, storedHash)) {
      // Password doesn't match this user — try next user with same hosp_code
      continue
    }

    // Generate session
    var sessionToken = Utilities.getUuid()
    var expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

    // Update session in sheet
    var rowNum = i + 1
    sheet.getRange(rowNum, USERS_COLS.session_token + 1).setValue(sessionToken)
    sheet.getRange(rowNum, USERS_COLS.session_expires + 1).setValue(expiresAt.toISOString())
    sheet.getRange(rowNum, USERS_COLS.last_login + 1).setValue(new Date().toISOString())

    return {
      success: true,
      data: {
        token: sessionToken,
        user_id: row[USERS_COLS.user_id],
        hosp_code: hospCode,
        first_name: row[USERS_COLS.first_name],
        last_name: row[USERS_COLS.last_name],
        role: row[USERS_COLS.role],
        hosp_name: getHospName(hospCode),
      },
    }
  }

  return { success: false, error: 'Invalid credentials' }
}

/**
 * auth.register — Register a new user. Status = pending until admin approves.
 * Public endpoint (no token required).
 */
function handleRegister(data) {
  var hospCode = String(data.hosp_code || '').trim()
  var password = String(data.password || '')
  var firstName = String(data.first_name || '').trim()
  var lastName = String(data.last_name || '').trim()
  var tel = String(data.tel || '').trim()

  // Validate required fields
  if (!hospCode || !password || !firstName || !lastName || !tel) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบ' }
  }
  if (hospCode.length !== 5 || !/^\d{5}$/.test(hospCode)) {
    return { success: false, error: 'รหัสสถานพยาบาลไม่ถูกต้อง' }
  }
  if (password.length < 8) {
    return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
  }
  if (!/^[0-9]{9,10}$/.test(tel)) {
    return { success: false, error: 'เบอร์โทรไม่ถูกต้อง' }
  }

  var ss = getSpreadsheet()

  // Verify hosp_code exists and is active
  var hospitalSheet = ss.getSheetByName('HOSPITAL')
  var hospitalRows = hospitalSheet.getDataRange().getValues()
  var hospFound = false
  var hospType = ''

  for (var i = 1; i < hospitalRows.length; i++) {
    if (hospitalRows[i][HOSPITAL_COLS.hosp_code] === hospCode) {
      if (hospitalRows[i][HOSPITAL_COLS.active] !== 'Y') {
        return { success: false, error: 'Facility not active' }
      }
      hospFound = true
      hospType = hospitalRows[i][HOSPITAL_COLS.hosp_type]
      break
    }
  }

  if (!hospFound) {
    return { success: false, error: 'Invalid hosp_code' }
  }

  // Check if a pending registration already exists for this hosp_code
  // (allows multiple active users per facility per data-model.md)
  var usersSheet = ss.getSheetByName('USERS')
  var userRows = usersSheet.getDataRange().getValues()
  for (var j = 1; j < userRows.length; j++) {
    if (userRows[j][USERS_COLS.hosp_code] === hospCode && userRows[j][USERS_COLS.status] === 'pending') {
      return { success: false, error: 'มีคำขอลงทะเบียนที่รอการอนุมัติสำหรับรหัสนี้อยู่แล้ว' }
    }
  }

  // Determine role from hosp_type
  var role = getRoleForHospType(hospType)

  // Hash password
  var salt = generateSalt()
  var hash = hashPassword(password, salt)

  // Insert new user
  var userId = Utilities.getUuid()
  var newRow = [
    userId,                        // user_id
    hospCode,                      // hosp_code
    firstName,                     // first_name
    lastName,                      // last_name
    tel,                           // tel
    hash,                          // password_hash
    salt,                          // password_salt
    role,                          // role
    'pending',                     // status
    '',                            // approved_by
    '',                            // session_token
    '',                            // session_expires
    new Date().toISOString(),      // created_at
    '',                            // last_login
  ]

  usersSheet.appendRow(newRow)

  return {
    success: true,
    data: { message: 'Registration submitted. Awaiting admin approval.' },
  }
}

/**
 * auth.logout — Clear session token.
 * Authenticated endpoint.
 */
function handleLogout(user) {
  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')

  sheet.getRange(user.rowIndex, USERS_COLS.session_token + 1).setValue('')
  sheet.getRange(user.rowIndex, USERS_COLS.session_expires + 1).setValue('')

  return { success: true, data: { message: 'Logged out' } }
}

// ---------------------------------------------------------------------------
// Password Hashing (Research R1: Iterated HMAC-SHA256)
// ---------------------------------------------------------------------------

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 32)
}

function hashPassword(password, salt) {
  var hash = Utilities.computeHmacSha256Signature(password, salt)
  var hex = bytesToHex(hash)
  for (var i = 1; i < HASH_ITERATIONS; i++) {
    hash = Utilities.computeHmacSha256Signature(hex + password, salt)
    hex = bytesToHex(hash)
  }
  return hex
}

function verifyPassword(password, salt, storedHash) {
  var computed = hashPassword(password, salt)
  return constantTimeEquals(computed, storedHash)
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false
  var result = 0
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function bytesToHex(bytes) {
  return bytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2)
  }).join('')
}

// ---------------------------------------------------------------------------
// Role Helper
// ---------------------------------------------------------------------------

function getRoleForHospType(hospType) {
  if (hospType === 'สสอ.') return 'super_admin'
  if (hospType === 'รพ.') return 'admin_hosp'
  return 'staff_hsc' // รพ.สต.
}

// ---------------------------------------------------------------------------
// Action Router (stubs for future modules)
// ---------------------------------------------------------------------------

function routeAction(action, data, user) {
  var routes = {
    'auth.logout':       function() { return handleLogout(user) },
    'equipment.list':    function() { return handleEquipmentList(user, data) },
    'equipment.save':    function() { return handleEquipmentSave(user, data) },
    'equipment.delete':  function() { return handleEquipmentDelete(user, data) },
    'masterDrug.list':   function() { return handleMasterDrugList(user, data) },
    'masterDrug.save':   function() { return handleMasterDrugSave(user, data) },
    'masterDrug.delete': function() { return handleMasterDrugDelete(user, data) },
    'masterDrug.import': function() { return handleMasterDrugImport(user, data) },
  }

  var handler = routes[action]
  if (!handler) {
    return { success: false, error: 'Unknown action: ' + action }
  }

  return handler()
}

// ---------------------------------------------------------------------------
// Dashboard Stub (for health check / future implementation)
// ---------------------------------------------------------------------------

function handleDashboardStats() {
  // Will be implemented in Phase 9
  return { success: true, data: { message: 'Dashboard not yet implemented' } }
}

// ---------------------------------------------------------------------------
// Audit Log Helper
// ---------------------------------------------------------------------------

/**
 * Append an entry to AUDIT_LOG sheet. Append-only, never modifies existing rows.
 */
function appendAuditLog(user, action, module, targetId, oldValue, newValue) {
  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('AUDIT_LOG')
  if (!sheet) return // Guard: sheet may not exist yet

  sheet.appendRow([
    Utilities.getUuid(),                   // log_id
    user.user_id,                          // user_id
    action,                                // action (CREATE, UPDATE, DELETE)
    module,                                // module name
    targetId || '',                        // target_id
    oldValue ? JSON.stringify(oldValue) : '', // old_value
    newValue ? JSON.stringify(newValue) : '', // new_value
    new Date().toISOString(),              // created_at
  ])
}

// ---------------------------------------------------------------------------
// Facility Lookup Helper
// ---------------------------------------------------------------------------

/**
 * Build a lookup map of hosp_code → hosp_name from FACILITIES sheet.
 */
function getFacilitiesMap() {
  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('FACILITIES')
  if (!sheet) return {}

  var data = sheet.getDataRange().getValues()
  var map = {}
  for (var i = 1; i < data.length; i++) {
    var code = data[i][FACILITIES_COLS.hosp_code]
    if (code) map[code] = data[i][FACILITIES_COLS.hosp_name]
  }
  return map
}

// ---------------------------------------------------------------------------
// Equipment Handlers
// ---------------------------------------------------------------------------

/**
 * equipment.list — GET, filtered by role.
 * - staff_hsc: only own hosp_code, exclude inactive
 * - staff_hosp+: all or filtered by status param
 * - JOIN FACILITIES for hosp_name
 */
function handleEquipmentList(user, params) {
  var statusFilter = params.status || ''

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('EQUIPMENT')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var facilitiesMap = getFacilitiesMap()
  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    var equipStatus = row[EQUIPMENT_COLS.status]
    var equipHospCode = row[EQUIPMENT_COLS.hosp_code]

    // Role-based visibility
    if (user.role === 'staff_hsc') {
      // staff_hsc sees only own facility
      if (equipHospCode !== user.hosp_code) continue
      // Exclude inactive equipment
      if (equipStatus === 'inactive') continue
    } else {
      // staff_hosp and above see all, but respect status filter
      if (statusFilter && equipStatus !== statusFilter) continue
      // Always exclude inactive unless explicitly filtering for it
      if (!statusFilter && equipStatus === 'inactive') continue
    }

    var hospName = facilitiesMap[equipHospCode] || getHospName(equipHospCode)

    results.push({
      equip_id: row[EQUIPMENT_COLS.equip_id],
      hosp_code: equipHospCode,
      set_type: row[EQUIPMENT_COLS.set_type],
      device_type: row[EQUIPMENT_COLS.device_type],
      os: row[EQUIPMENT_COLS.os] || '',
      status: equipStatus,
      is_backup: row[EQUIPMENT_COLS.is_backup] || 'N',
      software: row[EQUIPMENT_COLS.software] || '',
      internet_mbps: row[EQUIPMENT_COLS.internet_mbps] !== '' && row[EQUIPMENT_COLS.internet_mbps] != null
        ? Number(row[EQUIPMENT_COLS.internet_mbps])
        : null,
      responsible_person: row[EQUIPMENT_COLS.responsible_person] || '',
      responsible_tel: row[EQUIPMENT_COLS.responsible_tel] || '',
      note: row[EQUIPMENT_COLS.note] || '',
      updated_at: row[EQUIPMENT_COLS.updated_at] || '',
      updated_by: row[EQUIPMENT_COLS.updated_by] || '',
      hosp_name: hospName,
    })
  }

  return { success: true, data: results }
}

/**
 * equipment.save — POST, create or update equipment.
 * - staff_hsc can only save for own hosp_code
 * - New: generate UUID, insert row
 * - Update: find by equip_id, overwrite row
 * - Set updated_by, updated_at
 * - AUDIT_LOG entry
 */
function handleEquipmentSave(user, data) {
  var equipId = String(data.equip_id || '').trim()
  var hospCode = String(data.hosp_code || '').trim()

  if (!hospCode) {
    return { success: false, error: 'hosp_code is required' }
  }

  // H6: Validate hosp_code exists in FACILITIES
  var facilitiesMap = getFacilitiesMap()
  if (!facilitiesMap[hospCode]) {
    return { success: false, error: 'Invalid hosp_code: facility not found' }
  }

  // Ownership validation: staff_hsc can only save for own facility
  if (user.role === 'staff_hsc' && hospCode !== user.hosp_code) {
    return { success: false, error: 'You can only manage equipment for your own facility' }
  }

  // Validate required fields
  var setType = String(data.set_type || '')
  var deviceType = String(data.device_type || '')
  var status = String(data.status || '')

  if (!setType || (setType !== 'A' && setType !== 'B')) {
    return { success: false, error: 'set_type must be A or B' }
  }
  if (!deviceType) {
    return { success: false, error: 'device_type is required' }
  }
  // C3: Validate device_type is a recognized value
  var validDeviceTypes = ['computer', 'notebook', 'camera', 'mic']
  if (validDeviceTypes.indexOf(deviceType) === -1) {
    return { success: false, error: 'Invalid device_type' }
  }
  // C3: Validate set_type / device_type relationship
  if (setType === 'B' && deviceType !== 'notebook') {
    return { success: false, error: 'Set B device_type must be notebook' }
  }
  if (setType === 'A' && deviceType === 'notebook') {
    return { success: false, error: 'Set A device_type cannot be notebook' }
  }
  if (!status || (status !== 'ready' && status !== 'maintenance' && status !== 'broken')) {
    return { success: false, error: 'status must be ready, maintenance, or broken' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('EQUIPMENT')

  var now = new Date().toISOString()
  var isNew = !equipId

  var oldValues = null

  if (isNew) {
    equipId = Utilities.getUuid()
  } else {
    // Find existing row for update + audit
    var rows = sheet.getDataRange().getValues()
    var foundRow = -1

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][EQUIPMENT_COLS.equip_id] === equipId) {
        foundRow = i + 1 // 1-based
        oldValues = {
          hosp_code: rows[i][EQUIPMENT_COLS.hosp_code],
          set_type: rows[i][EQUIPMENT_COLS.set_type],
          device_type: rows[i][EQUIPMENT_COLS.device_type],
          os: rows[i][EQUIPMENT_COLS.os],
          status: rows[i][EQUIPMENT_COLS.status],
          is_backup: rows[i][EQUIPMENT_COLS.is_backup],
          software: rows[i][EQUIPMENT_COLS.software],
          internet_mbps: rows[i][EQUIPMENT_COLS.internet_mbps],
          responsible_person: rows[i][EQUIPMENT_COLS.responsible_person],
          responsible_tel: rows[i][EQUIPMENT_COLS.responsible_tel],
          note: rows[i][EQUIPMENT_COLS.note],
        }
        break
      }
    }

    if (foundRow === -1) {
      return { success: false, error: 'Equipment not found' }
    }

    // Ownership check for update
    if (user.role === 'staff_hsc') {
      var existingHospCode = rows[foundRow - 1][EQUIPMENT_COLS.hosp_code]
      if (existingHospCode !== user.hosp_code) {
        return { success: false, error: 'You can only update equipment for your own facility' }
      }
    }
  }

  // Build row data
  var internetMbps = data.internet_mbps != null ? Number(data.internet_mbps) : ''
  var rowData = [
    equipId,
    hospCode,
    setType,
    deviceType,
    String(data.os || ''),
    status,
    String(data.is_backup || 'N'),
    String(data.software || ''),
    internetMbps,
    String(data.responsible_person || ''),
    String(data.responsible_tel || ''),
    String(data.note || ''),
    now,
    user.user_id,
  ]

  if (isNew) {
    sheet.appendRow(rowData)
  } else {
    // Update existing row — foundRow is 1-based
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData])
  }

  // Audit log — H5: symmetric old/new values
  var newValues = {
    hosp_code: hospCode,
    set_type: setType,
    device_type: deviceType,
    os: String(data.os || ''),
    status: status,
    is_backup: String(data.is_backup || 'N'),
    software: String(data.software || ''),
    internet_mbps: internetMbps,
    responsible_person: String(data.responsible_person || ''),
    responsible_tel: String(data.responsible_tel || ''),
    note: String(data.note || ''),
  }
  appendAuditLog(
    user,
    isNew ? 'CREATE' : 'UPDATE',
    'EQUIPMENT',
    equipId,
    oldValues,
    newValues
  )

  return { success: true, data: { equip_id: equipId } }
}

/**
 * equipment.delete — POST, soft-delete (set status=inactive).
 * - staff_hsc can only delete own facility's equipment
 * - Never removes row, sets status=inactive
 * - AUDIT_LOG entry
 */
function handleEquipmentDelete(user, data) {
  var equipId = String(data.equip_id || '').trim()

  if (!equipId) {
    return { success: false, error: 'equip_id is required' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('EQUIPMENT')
  var rows = sheet.getDataRange().getValues()

  var foundRow = -1
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][EQUIPMENT_COLS.equip_id] === equipId) {
      foundRow = i + 1 // 1-based
      break
    }
  }

  if (foundRow === -1) {
    return { success: false, error: 'Equipment not found' }
  }

  var existingRow = rows[foundRow - 1]

  // Ownership validation for staff_hsc
  if (user.role === 'staff_hsc') {
    var equipHospCode = existingRow[EQUIPMENT_COLS.hosp_code]
    if (equipHospCode !== user.hosp_code) {
      return { success: false, error: 'You can only delete equipment for your own facility' }
    }
  }

  // Check if already inactive
  if (existingRow[EQUIPMENT_COLS.status] === 'inactive') {
    return { success: false, error: 'Equipment is already inactive' }
  }

  // Soft delete: set status = inactive, update timestamp
  var now = new Date().toISOString()
  sheet.getRange(foundRow, EQUIPMENT_COLS.status + 1).setValue('inactive')
  sheet.getRange(foundRow, EQUIPMENT_COLS.updated_at + 1).setValue(now)
  sheet.getRange(foundRow, EQUIPMENT_COLS.updated_by + 1).setValue(user.user_id)

  // Audit log
  var oldValues = {
    status: existingRow[EQUIPMENT_COLS.status],
    hosp_code: existingRow[EQUIPMENT_COLS.hosp_code],
    set_type: existingRow[EQUIPMENT_COLS.set_type],
    device_type: existingRow[EQUIPMENT_COLS.device_type],
  }
  appendAuditLog(user, 'DELETE', 'EQUIPMENT', equipId, oldValues, { status: 'inactive' })

  return { success: true, data: { message: 'Equipment deactivated' } }
}

// ---------------------------------------------------------------------------
// Master Drug Handlers
// ---------------------------------------------------------------------------

/**
 * masterDrug.list — GET, with optional active/search filters.
 * All authenticated users can list drugs (used in Module 5 dropdowns).
 */
function handleMasterDrugList(user, params) {
  var activeFilter = params.active || ''
  var searchFilter = String(params.search || '').toLowerCase()

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('MASTER_DRUGS')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    var active = row[MASTER_DRUG_COLS.active]

    // Active filter
    if (activeFilter && active !== activeFilter) continue

    // Search filter on drug_name
    if (searchFilter) {
      var drugName = String(row[MASTER_DRUG_COLS.drug_name]).toLowerCase()
      if (drugName.indexOf(searchFilter) === -1) continue
    }

    results.push({
      drug_id: row[MASTER_DRUG_COLS.drug_id],
      drug_name: row[MASTER_DRUG_COLS.drug_name],
      strength: row[MASTER_DRUG_COLS.strength],
      unit: row[MASTER_DRUG_COLS.unit],
      active: active,
    })
  }

  // Sort by drug_name
  results.sort(function(a, b) {
    return a.drug_name.localeCompare(b.drug_name, 'th')
  })

  return { success: true, data: results }
}

/**
 * masterDrug.save — POST, create or update drug.
 * Access: super_admin, admin_hosp only.
 * FK check: cannot change drug_name if referenced in VISIT_MEDS.
 */
function handleMasterDrugSave(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var drugId = String(data.drug_id || '').trim()
  var drugName = String(data.drug_name || '').trim()
  var strength = String(data.strength || '').trim()
  var unit = String(data.unit || '').trim()

  if (!drugName) return { success: false, error: 'drug_name is required' }
  if (!strength) return { success: false, error: 'strength is required' }
  if (!unit) return { success: false, error: 'unit is required' }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('MASTER_DRUGS')
  var isNew = !drugId
  var oldValues = null

  // C1: Check for duplicate drug_name (case-insensitive) for new drugs
  var allRows = sheet.getDataRange().getValues()
  var drugNameLower = drugName.toLowerCase()
  for (var k = 1; k < allRows.length; k++) {
    var existingName = String(allRows[k][MASTER_DRUG_COLS.drug_name]).toLowerCase()
    if (existingName === drugNameLower) {
      // For new drugs, always reject duplicates
      // For updates, reject only if the duplicate belongs to a different drug_id
      if (isNew || allRows[k][MASTER_DRUG_COLS.drug_id] !== drugId) {
        return { success: false, error: 'Drug name already exists' }
      }
    }
  }

  if (isNew) {
    drugId = Utilities.getUuid()
  } else {
    // Find existing row
    var rows = sheet.getDataRange().getValues()
    var foundRow = -1

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][MASTER_DRUG_COLS.drug_id] === drugId) {
        foundRow = i + 1
        var oldDrugName = rows[i][MASTER_DRUG_COLS.drug_name]

        oldValues = {
          drug_name: oldDrugName,
          strength: rows[i][MASTER_DRUG_COLS.strength],
          unit: rows[i][MASTER_DRUG_COLS.unit],
          active: rows[i][MASTER_DRUG_COLS.active],
        }

        // FK check: cannot change drug_name if referenced in VISIT_MEDS
        if (oldDrugName !== drugName) {
          var visitMedsSheet = ss.getSheetByName('VISIT_MEDS')
          if (visitMedsSheet) {
            var medRows = visitMedsSheet.getDataRange().getValues()
            for (var j = 1; j < medRows.length; j++) {
              if (medRows[j][VISIT_MEDS_COLS.drug_name] === oldDrugName) {
                return { success: false, error: 'Cannot change drug_name: referenced in VISIT_MEDS' }
              }
            }
          }
        }
        break
      }
    }

    if (foundRow === -1) {
      return { success: false, error: 'Drug not found' }
    }

    // M1: Batch update with single setValues call
    sheet.getRange(foundRow, MASTER_DRUG_COLS.drug_name + 1, 1, 3).setValues([[drugName, strength, unit]])
  }

  if (isNew) {
    sheet.appendRow([drugId, drugName, strength, unit, 'Y'])
  }

  // Audit log
  var newValues = { drug_name: drugName, strength: strength, unit: unit, active: isNew ? 'Y' : oldValues.active }
  appendAuditLog(user, isNew ? 'CREATE' : 'UPDATE', 'MASTER_DRUGS', drugId, oldValues, newValues)

  return { success: true, data: { drug_id: drugId } }
}

/**
 * masterDrug.delete — POST, soft-delete (set active=N).
 * Access: super_admin, admin_hosp only.
 */
function handleMasterDrugDelete(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var drugId = String(data.drug_id || '').trim()
  if (!drugId) return { success: false, error: 'drug_id is required' }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('MASTER_DRUGS')
  var rows = sheet.getDataRange().getValues()

  var foundRow = -1
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][MASTER_DRUG_COLS.drug_id] === drugId) {
      foundRow = i + 1
      break
    }
  }

  if (foundRow === -1) {
    return { success: false, error: 'Drug not found' }
  }

  var existingRow = rows[foundRow - 1]

  // Already inactive
  if (existingRow[MASTER_DRUG_COLS.active] === 'N') {
    return { success: false, error: 'Drug is already inactive' }
  }

  // Soft delete: set active = N
  sheet.getRange(foundRow, MASTER_DRUG_COLS.active + 1).setValue('N')

  // Audit log
  var oldValues = {
    drug_name: existingRow[MASTER_DRUG_COLS.drug_name],
    strength: existingRow[MASTER_DRUG_COLS.strength],
    unit: existingRow[MASTER_DRUG_COLS.unit],
    active: existingRow[MASTER_DRUG_COLS.active],
  }
  appendAuditLog(user, 'DELETE', 'MASTER_DRUGS', drugId, oldValues, { active: 'N' })

  return { success: true, data: { message: 'Drug deactivated' } }
}

/**
 * masterDrug.import — POST, batch import drugs from Excel.
 * Access: super_admin, admin_hosp only.
 * Skips duplicates (by drug_name), validates required fields.
 */
function handleMasterDrugImport(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var drugs = data.drugs
  if (!drugs || !drugs.length) {
    return { success: false, error: 'No drugs provided' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('MASTER_DRUGS')

  // Build existing drug_name set for dedup — only ACTIVE drugs (H2)
  // Inactive drugs can be re-imported
  var existingRows = sheet.getDataRange().getValues()
  var existingNames = {}
  for (var i = 1; i < existingRows.length; i++) {
    if (existingRows[i][MASTER_DRUG_COLS.active] === 'Y') {
      var name = String(existingRows[i][MASTER_DRUG_COLS.drug_name]).toLowerCase()
      existingNames[name] = true
    }
  }

  var imported = 0
  var skipped = 0
  var errors = []
  var newRows = [] // H1: Collect rows for batch insert

  for (var j = 0; j < drugs.length; j++) {
    var drug = drugs[j]
    var drugName = String(drug.drug_name || '').trim()
    var strength = String(drug.strength || '').trim()
    var unit = String(drug.unit || '').trim()
    var active = String(drug.active || 'Y').trim()

    // Validate required fields
    if (!drugName) {
      errors.push('Row ' + (j + 1) + ': drug_name is empty')
      continue
    }
    if (!strength) {
      errors.push('Row ' + (j + 1) + ': strength is empty for "' + drugName + '"')
      continue
    }
    if (!unit) {
      errors.push('Row ' + (j + 1) + ': unit is empty for "' + drugName + '"')
      continue
    }

    // Check duplicate
    if (existingNames[drugName.toLowerCase()]) {
      skipped++
      continue
    }

    // Collect for batch insert
    var newId = Utilities.getUuid()
    newRows.push([newId, drugName, strength, unit, active])
    existingNames[drugName.toLowerCase()] = true
    imported++
  }

  // H1: Batch insert all new rows in a single setValues call
  if (newRows.length > 0) {
    var startRow = existingRows.length + 1
    sheet.getRange(startRow, 1, newRows.length, 5).setValues(newRows)
  }

  // Audit log
  appendAuditLog(user, 'IMPORT', 'MASTER_DRUGS', '', null, { imported: imported, skipped: skipped, errors: errors.length })

  return {
    success: true,
    data: {
      imported: imported,
      skipped: skipped,
      errors: errors,
    },
  }
}
