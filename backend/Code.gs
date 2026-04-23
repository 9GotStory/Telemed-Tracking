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
  force_change: 14,
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

var CLINIC_SCHEDULE_COLS = {
  schedule_id: 0,
  service_date: 1,
  hosp_code: 2,
  clinic_type: 3,
  service_time: 4,
  appoint_count: 5,
  telemed_link: 6,
  link_added_by: 7,
  incident_note: 8,
  updated_at: 9,
}

var READINESS_LOG_COLS = {
  log_id: 0,
  hosp_code: 1,
  check_date: 2,
  cam_ok: 3,
  mic_ok: 4,
  pc_ok: 5,
  internet_ok: 6,
  software_ok: 7,
  overall_status: 8,
  note: 9,
  checked_by: 10,
  checked_at: 11,
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

var VISIT_SUMMARY_COLS = {
  vn: 0,
  hn: 1,
  patient_name: 2,
  dob: 3,
  tel: 4,
  clinic_type: 5,
  hosp_code: 6,
  service_date: 7,
  attended: 8,
  has_drug_change: 9,
  drug_source_pending: 10,
  dispensing_confirmed: 11,
  import_round1_at: 12,
  import_round2_at: 13,
  diff_status: 14,
  confirmed_by: 15,
  confirmed_at: 16,
}

var FOLLOWUP_COLS = {
  followup_id: 0,
  vn: 1,
  followup_date: 2,
  general_condition: 3,
  side_effect: 4,
  drug_adherence: 5,
  other_note: 6,
  recorded_by: 7,
  recorded_at: 8,
}

var SETTINGS_COLS = {
  key: 0,
  value: 1,
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

    // Check if password reset was forced
    var forceChange = row.length > USERS_COLS.force_change && String(row[USERS_COLS.force_change]) === 'Y'

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
        force_change: forceChange,
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

/**
 * auth.changePassword — POST, change own password.
 * Authenticated endpoint. Clears force_change flag.
 */
function handleChangePassword(user, data) {
  var newPassword = String(data.new_password || '')
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')

  var newSalt = generateSalt()
  var newHash = hashPassword(newPassword, newSalt)

  sheet.getRange(user.rowIndex, USERS_COLS.password_hash + 1).setValue(newHash)
  sheet.getRange(user.rowIndex, USERS_COLS.password_salt + 1).setValue(newSalt)
  // Clear force_change flag
  if (sheet.getLastColumn() >= USERS_COLS.force_change + 1) {
    sheet.getRange(user.rowIndex, USERS_COLS.force_change + 1).setValue('')
  }

  appendAuditLog(user, 'UPDATE', 'USERS', user.user_id, null, { action: 'password_change' })

  return { success: true, data: { message: 'Password changed' } }
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
    'auth.logout':              function() { return handleLogout(user) },
    'auth.changePassword':      function() { return handleChangePassword(user, data) },
    'equipment.list':           function() { return handleEquipmentList(user, data) },
    'equipment.save':           function() { return handleEquipmentSave(user, data) },
    'equipment.delete':         function() { return handleEquipmentDelete(user, data) },
    'masterDrug.list':          function() { return handleMasterDrugList(user, data) },
    'masterDrug.save':          function() { return handleMasterDrugSave(user, data) },
    'masterDrug.delete':        function() { return handleMasterDrugDelete(user, data) },
    'masterDrug.import':        function() { return handleMasterDrugImport(user, data) },
    'schedule.list':            function() { return handleScheduleList(user, data) },
    'schedule.save':            function() { return handleScheduleSave(user, data) },
    'schedule.setLink':         function() { return handleScheduleSetLink(user, data) },
    'schedule.recordIncident':  function() { return handleScheduleRecordIncident(user, data) },
    'readiness.list':           function() { return handleReadinessList(user, data) },
    'readiness.save':           function() { return handleReadinessSave(user, data) },
    'import.preview':           function() { return handleImportPreview(user, data) },
    'import.confirm':           function() { return handleImportConfirm(user, data) },
    'visitSummary.list':        function() { return handleVisitSummaryList(user, data) },
    'visitMeds.list':           function() { return handleVisitMedsList(user, data) },
    'visitMeds.save':           function() { return handleVisitMedsSave(user, data) },
    'followup.list':            function() { return handleFollowupList(user, data) },
    'followup.save':            function() { return handleFollowupSave(user, data) },
    'users.list':               function() { return handleUsersList(user, data) },
    'users.approve':            function() { return handleUsersApprove(user, data) },
    'users.update':             function() { return handleUsersUpdate(user, data) },
    'users.resetPassword':      function() { return handleUsersResetPassword(user, data) },
    'settings.get':             function() { return handleSettingsGet(user) },
    'settings.save':            function() { return handleSettingsSave(user, data) },
    'auditLog.list':            function() { return handleAuditLogList(user, data) },
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

/**
 * dashboard.stats — GET, public (no token required).
 * Returns aggregate statistics with NO patient-identifiable data.
 * CRITICAL: Must never include names, phone, VN, HN, or individual drug lists.
 */
function handleDashboardStats() {
  var ss = getSpreadsheet()
  var facilitiesMap = getFacilitiesMap()
  var facilityCodes = Object.keys(facilitiesMap)

  // ---- Read each sheet ONCE and reuse ----
  var rlSheet = ss.getSheetByName('READINESS_LOG')
  var rlData = rlSheet ? rlSheet.getDataRange().getValues() : []

  var csSheet = ss.getSheetByName('CLINIC_SCHEDULE')
  var csData = csSheet ? csSheet.getDataRange().getValues() : []

  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  var vsData = vsSheet ? vsSheet.getDataRange().getValues() : []

  var fuSheet = ss.getSheetByName('FOLLOWUP')

  // ---- 1. Equipment status: latest READINESS_LOG per facility ----
  var equipmentStatus = []
  var latestReadiness = {} // hosp_code -> { status, check_date }
  for (var r = 1; r < rlData.length; r++) {
    var rHospCode = String(rlData[r][READINESS_LOG_COLS.hosp_code])
    var rCheckDate = String(rlData[r][READINESS_LOG_COLS.check_date])
    var rStatus = String(rlData[r][READINESS_LOG_COLS.overall_status])
    // Keep only the latest entry per facility
    if (!latestReadiness[rHospCode] || rCheckDate > latestReadiness[rHospCode].check_date) {
      latestReadiness[rHospCode] = { status: rStatus, check_date: rCheckDate }
    }
  }

  for (var fc = 0; fc < facilityCodes.length; fc++) {
    var code = facilityCodes[fc]
    var readiness = latestReadiness[code]
    equipmentStatus.push({
      hosp_code: code,
      hosp_name: facilitiesMap[code],
      status: readiness ? readiness.status : 'unknown',
      last_check_date: readiness ? readiness.check_date : '',
    })
  }

  // ---- 2. Upcoming appointments: next 7 days from CLINIC_SCHEDULE ----
  var upcomingAppointments = []
  var today = new Date()
  var sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  var todayStr = today.toISOString().split('T')[0]
  var laterStr = sevenDaysLater.toISOString().split('T')[0]

  for (var c = 1; c < csData.length; c++) {
    var serviceDate = String(csData[c][CLINIC_SCHEDULE_COLS.service_date])
    if (serviceDate >= todayStr && serviceDate <= laterStr) {
      var csHospCode = String(csData[c][CLINIC_SCHEDULE_COLS.hosp_code])
      upcomingAppointments.push({
        service_date: serviceDate,
        hosp_name: facilitiesMap[csHospCode] || getHospName(csHospCode),
        clinic_type: String(csData[c][CLINIC_SCHEDULE_COLS.clinic_type]),
        service_time: String(csData[c][CLINIC_SCHEDULE_COLS.service_time] || ''),
        appoint_count: Number(csData[c][CLINIC_SCHEDULE_COLS.appoint_count]) || 0,
      })
    }
  }

  upcomingAppointments.sort(function(a, b) {
    return a.service_date.localeCompare(b.service_date)
  })

  // ---- 3. Monthly sessions: count distinct schedules per month ----
  var monthlySessions = {}
  for (var ms = 1; ms < csData.length; ms++) {
    var msDate = String(csData[ms][CLINIC_SCHEDULE_COLS.service_date])
    var monthKey = msDate.substring(0, 7) // YYYY-MM
    if (monthKey.length === 7) {
      monthlySessions[monthKey] = (monthlySessions[monthKey] || 0) + 1
    }
  }

  // ---- 4. Attendance by clinic_type and facility ----
  var attendanceByClinic = []
  var attendanceByFacility = []
  var clinicMap = {}       // clinic_type -> { appointed, attended }
  var facilityAttMap = {}  // hosp_code -> { appointed, attended }

  // Build appoint_count lookup from CLINIC_SCHEDULE (reuse csData)
  var scheduleAppointments = {} // date|code|clinic -> appoint_count
  for (var sa = 1; sa < csData.length; sa++) {
    var saDate = String(csData[sa][CLINIC_SCHEDULE_COLS.service_date])
    var saHosp = String(csData[sa][CLINIC_SCHEDULE_COLS.hosp_code])
    var saClinic = String(csData[sa][CLINIC_SCHEDULE_COLS.clinic_type])
    var saKey = saDate + '|' + saHosp + '|' + saClinic
    scheduleAppointments[saKey] = Number(csData[sa][CLINIC_SCHEDULE_COLS.appoint_count]) || 0
  }

  // Count attended from VISIT_SUMMARY (reuse vsData)
  for (var va = 1; va < vsData.length; va++) {
    var vsClinic = String(vsData[va][VISIT_SUMMARY_COLS.clinic_type])
    var vsHosp = String(vsData[va][VISIT_SUMMARY_COLS.hosp_code])
    var vsAttended = String(vsData[va][VISIT_SUMMARY_COLS.attended])

    if (!clinicMap[vsClinic]) clinicMap[vsClinic] = { appointed: 0, attended: 0 }
    if (vsAttended === 'Y') clinicMap[vsClinic].attended++

    if (!facilityAttMap[vsHosp]) facilityAttMap[vsHosp] = { appointed: 0, attended: 0 }
    if (vsAttended === 'Y') facilityAttMap[vsHosp].attended++
  }

  // Add appoint_count from schedules to maps
  for (var sk in scheduleAppointments) {
    var parts = sk.split('|')
    var sCode = parts[1] || ''
    var sClinic = parts[2] || ''

    if (sClinic) {
      if (!clinicMap[sClinic]) clinicMap[sClinic] = { appointed: 0, attended: 0 }
      clinicMap[sClinic].appointed += scheduleAppointments[sk]
    }
    if (sCode) {
      if (!facilityAttMap[sCode]) facilityAttMap[sCode] = { appointed: 0, attended: 0 }
      facilityAttMap[sCode].appointed += scheduleAppointments[sk]
    }
  }

  // Build attendance arrays
  var clinicKeys = Object.keys(clinicMap)
  for (var ck = 0; ck < clinicKeys.length; ck++) {
    var cKey = clinicKeys[ck]
    var cTotal = clinicMap[cKey].appointed
    var cAttended = clinicMap[cKey].attended
    attendanceByClinic.push({
      clinic_type: cKey,
      total_appointed: cTotal,
      total_attended: cAttended,
      rate: cTotal > 0 ? Math.round((cAttended / cTotal) * 1000) / 10 : 0,
    })
  }

  var facAttKeys = Object.keys(facilityAttMap)
  for (var fk = 0; fk < facAttKeys.length; fk++) {
    var fKey = facAttKeys[fk]
    var fTotal = facilityAttMap[fKey].appointed
    var fAttended = facilityAttMap[fKey].attended
    attendanceByFacility.push({
      hosp_name: facilitiesMap[fKey] || getHospName(fKey),
      total_appointed: fTotal,
      total_attended: fAttended,
      rate: fTotal > 0 ? Math.round((fAttended / fTotal) * 1000) / 10 : 0,
    })
  }

  attendanceByClinic.sort(function(a, b) { return b.rate - a.rate })
  attendanceByFacility.sort(function(a, b) { return b.rate - a.rate })

  // ---- 5. Followup pipeline ----
  var followupPipeline = { followed: 0, pending: 0 }
  // Build VN set from FOLLOWUP sheet (guard: skip if sheet missing)
  var fuVNSet = {}
  if (fuSheet) {
    var fuData = fuSheet.getDataRange().getValues()
    for (var fp = 1; fp < fuData.length; fp++) {
      fuVNSet[String(fuData[fp][FOLLOWUP_COLS.vn])] = true
    }
  }

  // Count confirmed visits with/without followup (reuse vsData)
  for (var vp = 1; vp < vsData.length; vp++) {
    if (String(vsData[vp][VISIT_SUMMARY_COLS.dispensing_confirmed]) === 'Y') {
      var vpVN = String(vsData[vp][VISIT_SUMMARY_COLS.vn])
      if (fuVNSet[vpVN]) {
        followupPipeline.followed++
      } else {
        followupPipeline.pending++
      }
    }
  }

  // ---- Assemble response ----
  return {
    success: true,
    data: {
      equipment_status: equipmentStatus,
      upcoming_appointments: upcomingAppointments,
      monthly_sessions: monthlySessions,
      attendance_by_clinic: attendanceByClinic,
      attendance_by_facility: attendanceByFacility,
      followup_pipeline: followupPipeline,
    },
  }
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

// ---------------------------------------------------------------------------
// Schedule Handlers
// ---------------------------------------------------------------------------

/**
 * schedule.list — GET, filtered by month/hosp_code/clinic_type.
 * All authenticated users can list schedules.
 * Computes actual_count from VISIT_SUMMARY for each schedule.
 * JOIN FACILITIES for hosp_name.
 */
function handleScheduleList(user, params) {
  var monthFilter = params.month || ''
  var hospCodeFilter = params.hosp_code || ''
  var clinicTypeFilter = params.clinic_type || ''

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('CLINIC_SCHEDULE')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var facilitiesMap = getFacilitiesMap()

  // Build actual_count lookup from VISIT_SUMMARY (attended = Y)
  var actualCountMap = {}
  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  if (vsSheet) {
    var vsData = vsSheet.getDataRange().getValues()
    for (var v = 1; v < vsData.length; v++) {
      if (vsData[v][VISIT_SUMMARY_COLS.attended] === 'Y') {
        var vsDate = String(vsData[v][VISIT_SUMMARY_COLS.service_date])
        var vsHosp = String(vsData[v][VISIT_SUMMARY_COLS.hosp_code])
        var vsClinic = String(vsData[v][VISIT_SUMMARY_COLS.clinic_type])
        var countKey = vsDate + '|' + vsHosp + '|' + vsClinic
        actualCountMap[countKey] = (actualCountMap[countKey] || 0) + 1
      }
    }
  }

  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    var serviceDate = String(row[CLINIC_SCHEDULE_COLS.service_date])
    var hospCode = String(row[CLINIC_SCHEDULE_COLS.hosp_code])
    var clinicType = String(row[CLINIC_SCHEDULE_COLS.clinic_type])

    // staff_hsc: filter to own hosp_code
    if (user.role === 'staff_hsc' && hospCode !== user.hosp_code) continue

    // Month filter (YYYY-MM)
    if (monthFilter && serviceDate.substring(0, 7) !== monthFilter) continue

    // Hosp code filter
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue

    // Clinic type filter
    if (clinicTypeFilter && clinicType !== clinicTypeFilter) continue

    // Compute actual_count
    var countKey = serviceDate + '|' + hospCode + '|' + clinicType
    var actualCount = actualCountMap[countKey] || 0

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode)

    results.push({
      schedule_id: row[CLINIC_SCHEDULE_COLS.schedule_id],
      service_date: serviceDate,
      hosp_code: hospCode,
      hosp_name: hospName,
      clinic_type: clinicType,
      service_time: row[CLINIC_SCHEDULE_COLS.service_time],
      appoint_count: Number(row[CLINIC_SCHEDULE_COLS.appoint_count]) || 0,
      telemed_link: row[CLINIC_SCHEDULE_COLS.telemed_link] || '',
      link_added_by: row[CLINIC_SCHEDULE_COLS.link_added_by] || null,
      incident_note: row[CLINIC_SCHEDULE_COLS.incident_note] || '',
      updated_at: row[CLINIC_SCHEDULE_COLS.updated_at] || '',
      actual_count: actualCount,
    })
  }

  // Sort by service_date, then hosp_name
  results.sort(function(a, b) {
    var dateCmp = a.service_date.localeCompare(b.service_date)
    if (dateCmp !== 0) return dateCmp
    return (a.hosp_name || '').localeCompare(b.hosp_name || '', 'th')
  })

  return { success: true, data: results }
}

/**
 * schedule.save — POST, create or update schedule.
 * Access: super_admin, admin_hosp only.
 */
function handleScheduleSave(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var scheduleId = String(data.schedule_id || '').trim()
  var serviceDate = String(data.service_date || '').trim()
  var hospCode = String(data.hosp_code || '').trim()
  var clinicType = String(data.clinic_type || '').trim()
  var serviceTime = String(data.service_time || '').trim()
  var appointCount = Number(data.appoint_count) || 0

  if (!serviceDate) return { success: false, error: 'service_date is required' }
  if (!hospCode) return { success: false, error: 'hosp_code is required' }
  if (!clinicType) return { success: false, error: 'clinic_type is required' }
  if (!serviceTime) return { success: false, error: 'service_time is required' }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('CLINIC_SCHEDULE')
  var now = new Date().toISOString()
  var isNew = !scheduleId
  var oldValues = null

  if (isNew) {
    scheduleId = Utilities.getUuid()
  } else {
    // Find existing row for update + audit
    var rows = sheet.getDataRange().getValues()
    var foundRow = -1

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][CLINIC_SCHEDULE_COLS.schedule_id] === scheduleId) {
        foundRow = i + 1
        oldValues = {
          service_date: rows[i][CLINIC_SCHEDULE_COLS.service_date],
          hosp_code: rows[i][CLINIC_SCHEDULE_COLS.hosp_code],
          clinic_type: rows[i][CLINIC_SCHEDULE_COLS.clinic_type],
          service_time: rows[i][CLINIC_SCHEDULE_COLS.service_time],
          appoint_count: rows[i][CLINIC_SCHEDULE_COLS.appoint_count],
        }
        break
      }
    }

    if (foundRow === -1) {
      return { success: false, error: 'Schedule not found' }
    }

    // Update row
    var rowData = [scheduleId, serviceDate, hospCode, clinicType, serviceTime, appointCount,
      rows[foundRow - 1][CLINIC_SCHEDULE_COLS.telemed_link] || '',
      rows[foundRow - 1][CLINIC_SCHEDULE_COLS.link_added_by] || '',
      rows[foundRow - 1][CLINIC_SCHEDULE_COLS.incident_note] || '',
      now]
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData])
  }

  if (isNew) {
    sheet.appendRow([scheduleId, serviceDate, hospCode, clinicType, serviceTime, appointCount, '', '', '', now])
  }

  // Audit log
  var newValues = { service_date: serviceDate, hosp_code: hospCode, clinic_type: clinicType, service_time: serviceTime, appoint_count: appointCount }
  appendAuditLog(user, isNew ? 'CREATE' : 'UPDATE', 'CLINIC_SCHEDULE', scheduleId, oldValues, newValues)

  return { success: true, data: { schedule_id: scheduleId } }
}

/**
 * schedule.setLink — POST, set telemed link for a schedule.
 * Access: staff_hosp and above.
 */
function handleScheduleSetLink(user, data) {
  var scheduleId = String(data.schedule_id || '').trim()
  var telemedLink = String(data.telemed_link || '').trim()

  if (!scheduleId) return { success: false, error: 'schedule_id is required' }

  // Access control: staff_hosp and above
  if (user.role === 'staff_hsc') {
    return { success: false, error: 'Access denied: insufficient permissions' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('CLINIC_SCHEDULE')
  var rows = sheet.getDataRange().getValues()
  var foundRow = -1

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][CLINIC_SCHEDULE_COLS.schedule_id] === scheduleId) {
      foundRow = i + 1
      break
    }
  }

  if (foundRow === -1) {
    return { success: false, error: 'Schedule not found' }
  }

  // Update telemed_link and link_added_by
  sheet.getRange(foundRow, CLINIC_SCHEDULE_COLS.telemed_link + 1).setValue(telemedLink)
  sheet.getRange(foundRow, CLINIC_SCHEDULE_COLS.link_added_by + 1).setValue(user.user_id)
  sheet.getRange(foundRow, CLINIC_SCHEDULE_COLS.updated_at + 1).setValue(new Date().toISOString())

  // Audit log
  var oldLink = rows[foundRow - 1][CLINIC_SCHEDULE_COLS.telemed_link] || ''
  appendAuditLog(user, 'UPDATE', 'CLINIC_SCHEDULE', scheduleId, { telemed_link: oldLink }, { telemed_link: telemedLink })

  return { success: true, data: { message: 'Link updated' } }
}

/**
 * schedule.recordIncident — POST, record incident note for a schedule.
 * Access: All authenticated users.
 */
function handleScheduleRecordIncident(user, data) {
  var scheduleId = String(data.schedule_id || '').trim()
  var incidentNote = String(data.incident_note || '').trim()

  if (!scheduleId) return { success: false, error: 'schedule_id is required' }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('CLINIC_SCHEDULE')
  var rows = sheet.getDataRange().getValues()
  var foundRow = -1

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][CLINIC_SCHEDULE_COLS.schedule_id] === scheduleId) {
      foundRow = i + 1
      break
    }
  }

  if (foundRow === -1) {
    return { success: false, error: 'Schedule not found' }
  }

  // Update incident_note
  var oldNote = rows[foundRow - 1][CLINIC_SCHEDULE_COLS.incident_note] || ''
  sheet.getRange(foundRow, CLINIC_SCHEDULE_COLS.incident_note + 1).setValue(incidentNote)
  sheet.getRange(foundRow, CLINIC_SCHEDULE_COLS.updated_at + 1).setValue(new Date().toISOString())

  // Audit log
  appendAuditLog(user, 'UPDATE', 'CLINIC_SCHEDULE', scheduleId, { incident_note: oldNote }, { incident_note: incidentNote })

  return { success: true, data: { message: 'Incident recorded' } }
}

// ---------------------------------------------------------------------------
// Readiness Handlers
// ---------------------------------------------------------------------------

/**
 * readiness.list — GET, filtered by hosp_code and/or check_date.
 * Access: super_admin, admin_hosp.
 * JOIN FACILITIES for hosp_name.
 */
function handleReadinessList(user, params) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var hospCodeFilter = params.hosp_code || ''
  var checkDateFilter = params.check_date || ''

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('READINESS_LOG')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var facilitiesMap = getFacilitiesMap()
  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    var hospCode = String(row[READINESS_LOG_COLS.hosp_code])
    var checkDate = String(row[READINESS_LOG_COLS.check_date])

    // Filters
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue
    if (checkDateFilter && checkDate !== checkDateFilter) continue

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode)

    results.push({
      log_id: row[READINESS_LOG_COLS.log_id],
      hosp_code: hospCode,
      hosp_name: hospName,
      check_date: checkDate,
      cam_ok: row[READINESS_LOG_COLS.cam_ok] || 'N',
      mic_ok: row[READINESS_LOG_COLS.mic_ok] || 'N',
      pc_ok: row[READINESS_LOG_COLS.pc_ok] || 'N',
      internet_ok: row[READINESS_LOG_COLS.internet_ok] || 'N',
      software_ok: row[READINESS_LOG_COLS.software_ok] || 'N',
      overall_status: row[READINESS_LOG_COLS.overall_status] || 'not_ready',
      note: row[READINESS_LOG_COLS.note] || '',
      checked_by: row[READINESS_LOG_COLS.checked_by] || '',
      checked_at: row[READINESS_LOG_COLS.checked_at] || '',
    })
  }

  // Sort by check_date DESC, then hosp_name
  results.sort(function(a, b) {
    var dateCmp = b.check_date.localeCompare(a.check_date)
    if (dateCmp !== 0) return dateCmp
    return (a.hosp_name || '').localeCompare(b.hosp_name || '', 'th')
  })

  return { success: true, data: results }
}

/**
 * readiness.save — POST, create or update readiness check (upsert by hosp_code + check_date).
 * Access: super_admin, admin_hosp.
 * Computes overall_status from 5 boolean fields.
 */
function handleReadinessSave(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var hospCode = String(data.hosp_code || '').trim()
  var checkDate = String(data.check_date || '').trim()

  if (!hospCode) return { success: false, error: 'hosp_code is required' }
  if (!checkDate) return { success: false, error: 'check_date is required' }

  var camOk = String(data.cam_ok || 'N')
  var micOk = String(data.mic_ok || 'N')
  var pcOk = String(data.pc_ok || 'N')
  var internetOk = String(data.internet_ok || 'N')
  var softwareOk = String(data.software_ok || 'N')
  var note = String(data.note || '').trim()

  // Compute overall_status
  var overallStatus = 'need_fix'
  if (camOk === 'Y' && micOk === 'Y' && pcOk === 'Y' && internetOk === 'Y' && softwareOk === 'Y') {
    overallStatus = 'ready'
  } else if (pcOk === 'N' || internetOk === 'N') {
    overallStatus = 'not_ready'
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('READINESS_LOG')
  var now = new Date().toISOString()

  // Check for existing log (upsert by hosp_code + check_date)
  var rows = sheet.getDataRange().getValues()
  var foundRow = -1
  var oldValues = null

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][READINESS_LOG_COLS.hosp_code]) === hospCode &&
        String(rows[i][READINESS_LOG_COLS.check_date]) === checkDate) {
      foundRow = i + 1
      oldValues = {
        cam_ok: rows[i][READINESS_LOG_COLS.cam_ok],
        mic_ok: rows[i][READINESS_LOG_COLS.mic_ok],
        pc_ok: rows[i][READINESS_LOG_COLS.pc_ok],
        internet_ok: rows[i][READINESS_LOG_COLS.internet_ok],
        software_ok: rows[i][READINESS_LOG_COLS.software_ok],
        overall_status: rows[i][READINESS_LOG_COLS.overall_status],
        note: rows[i][READINESS_LOG_COLS.note],
      }
      break
    }
  }

  var logId
  var rowData = [null, hospCode, checkDate, camOk, micOk, pcOk, internetOk, softwareOk, overallStatus, note, user.user_id, now]

  if (foundRow > 0) {
    // Update existing
    logId = rows[foundRow - 1][READINESS_LOG_COLS.log_id]
    rowData[0] = logId
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData])
  } else {
    // Insert new
    logId = Utilities.getUuid()
    rowData[0] = logId
    sheet.appendRow(rowData)
  }

  // Audit log
  var newValues = { hosp_code: hospCode, check_date: checkDate, cam_ok: camOk, mic_ok: micOk, pc_ok: pcOk, internet_ok: internetOk, software_ok: softwareOk, overall_status: overallStatus }
  appendAuditLog(user, foundRow > 0 ? 'UPDATE' : 'CREATE', 'READINESS_LOG', logId, oldValues, newValues)

  return { success: true, data: { log_id: logId } }
}

// ---------------------------------------------------------------------------
// Import Handlers (T085)
// ---------------------------------------------------------------------------

/**
 * import.preview — POST, validates VN uniqueness + drug_name existence.
 * Access: super_admin, admin_hosp, staff_hosp.
 * Round 1: VN must NOT exist in VISIT_SUMMARY.
 * Round 2: VN must exist from round 1.
 */
function handleImportPreview(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp' && user.role !== 'staff_hosp') {
    return { success: false, error: 'Access denied' }
  }

  var round = Number(data.round) || 1
  var visits = data.visits
  if (!visits || !visits.length) {
    return { success: false, error: 'No visits provided' }
  }

  var ss = getSpreadsheet()

  // Build existing VN set from VISIT_SUMMARY
  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  var existingVNs = {}
  if (vsSheet) {
    var vsData = vsSheet.getDataRange().getValues()
    for (var v = 1; v < vsData.length; v++) {
      existingVNs[String(vsData[v][VISIT_SUMMARY_COLS.vn])] = true
    }
  }

  // Build valid drug_name set from MASTER_DRUGS
  var mdSheet = ss.getSheetByName('MASTER_DRUGS')
  var validDrugs = {}
  if (mdSheet) {
    var mdData = mdSheet.getDataRange().getValues()
    for (var m = 1; m < mdData.length; m++) {
      if (mdData[m][MASTER_DRUG_COLS.active] === 'Y') {
        validDrugs[String(mdData[m][MASTER_DRUG_COLS.drug_name]).toLowerCase()] = true
      }
    }
  }

  var valid = []
  var errors = []
  var unknownDrugSet = {}
  var totalRows = 0

  for (var i = 0; i < visits.length; i++) {
    var visit = visits[i]
    var vn = String(visit.vn || '').trim()
    var patientName = String(visit.patient_name || '').trim()
    var drugs = visit.drugs || []
    var visitErrors = []
    var hasUnknownDrug = false

    totalRows += drugs.length

    // Check VN uniqueness/existence
    if (!vn) {
      visitErrors.push('VN is empty')
    } else if (round === 1 && existingVNs[vn]) {
      visitErrors.push('VN already exists in VISIT_SUMMARY')
    } else if (round === 2 && !existingVNs[vn]) {
      visitErrors.push('VN not found in VISIT_SUMMARY (round 2 requires existing VN)')
    }

    // Check drug_names
    for (var d = 0; d < drugs.length; d++) {
      var drugName = String(drugs[d].drug_name || '').trim()
      if (!drugName) continue
      if (!validDrugs[drugName.toLowerCase()]) {
        unknownDrugSet[drugName] = true
        hasUnknownDrug = true
      }
    }

    if (hasUnknownDrug && visitErrors.length === 0) {
      visitErrors.push('Contains unknown drugs')
    }

    if (visitErrors.length > 0) {
      errors.push({ vn: vn, error: visitErrors.join('; ') })
    } else {
      valid.push({ vn: vn, patient_name: patientName, drug_count: drugs.length })
    }
  }

  var unknownDrugs = Object.keys(unknownDrugSet)

  return {
    success: true,
    data: {
      valid: valid,
      errors: errors,
      unknown_drugs: unknownDrugs,
      summary: {
        total_rows: totalRows,
        unique_vns: visits.length,
        valid_vns: valid.length,
        error_vns: errors.length,
      },
    },
  }
}

/**
 * import.confirm — POST, inserts VISIT_SUMMARY + VISIT_MEDS with defaults.
 * Access: super_admin, admin_hosp.
 * Round 1: Insert new VISIT_SUMMARY + VISIT_MEDS (source=hosp_stock, status=draft).
 * Round 2: Update VISIT_SUMMARY + diff against round 1 meds.
 */
function handleImportConfirm(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var round = Number(data.round) || 1
  var hospCode = String(data.hosp_code || '').trim()
  var serviceDate = String(data.service_date || '').trim()
  var visits = data.visits

  if (!visits || !visits.length) {
    return { success: false, error: 'No visits provided' }
  }
  if (!hospCode) return { success: false, error: 'hosp_code is required' }
  if (!serviceDate) return { success: false, error: 'service_date is required' }

  var ss = getSpreadsheet()
  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  var vmSheet = ss.getSheetByName('VISIT_MEDS')
  var now = new Date().toISOString()

  var importedVisits = 0
  var importedMeds = 0

  for (var i = 0; i < visits.length; i++) {
    var visit = visits[i]
    var vn = String(visit.vn || '').trim()
    if (!vn) continue

    if (round === 1) {
      // Insert VISIT_SUMMARY with defaults
      vsSheet.appendRow([
        vn,                                                          // vn
        String(visit.hn || ''),                                      // hn
        String(visit.patient_name || ''),                            // patient_name
        String(visit.dob || ''),                                     // dob
        String(visit.tel || ''),                                     // tel
        String(visit.clinic_type || data.clinic_type || ''),         // clinic_type
        hospCode,                                                    // hosp_code
        serviceDate,                                                 // service_date
        '',                                                          // attended
        'N',                                                         // has_drug_change
        'N',                                                         // drug_source_pending
        'N',                                                         // dispensing_confirmed
        now,                                                         // import_round1_at
        '',                                                          // import_round2_at
        'pending',                                                   // diff_status
        '',                                                          // confirmed_by
        '',                                                          // confirmed_at
      ])
      importedVisits++
    } else {
      // Round 2: Update existing VISIT_SUMMARY
      var vsRows = vsSheet.getDataRange().getValues()
      for (var v = 1; v < vsRows.length; v++) {
        if (String(vsRows[v][VISIT_SUMMARY_COLS.vn]) === vn) {
          var vsRowNum = v + 1
          // Update import_round2_at
          vsSheet.getRange(vsRowNum, VISIT_SUMMARY_COLS.import_round2_at + 1).setValue(now)

          // Diff against round 1 meds
          var round1Meds = []
          var vmRows = vmSheet.getDataRange().getValues()
          for (var m = 1; m < vmRows.length; m++) {
            if (String(vmRows[m][VISIT_MEDS_COLS.vn]) === vn && Number(vmRows[m][VISIT_MEDS_COLS.round]) === 1) {
              round1Meds.push({
                drug_name: String(vmRows[m][VISIT_MEDS_COLS.drug_name]),
                strength: String(vmRows[m][VISIT_MEDS_COLS.strength]),
                qty: Number(vmRows[m][VISIT_MEDS_COLS.qty]),
              })
            }
          }

          // Compare drug lists
          var newDrugs = visit.drugs || []
          var matched = newDrugs.length === round1Meds.length
          if (matched) {
            for (var nd = 0; nd < newDrugs.length; nd++) {
              var found = false
              for (var rm = 0; rm < round1Meds.length; rm++) {
                if (String(newDrugs[nd].drug_name) === round1Meds[rm].drug_name &&
                    String(newDrugs[nd].strength) === round1Meds[rm].strength &&
                    Number(newDrugs[nd].qty) === round1Meds[rm].qty) {
                  found = true
                  break
                }
              }
              if (!found) { matched = false; break }
            }
          }
          vsSheet.getRange(vsRowNum, VISIT_SUMMARY_COLS.diff_status + 1).setValue(matched ? 'matched' : 'mismatch')
          break
        }
      }
    }

    // Insert VISIT_MEDS
    var drugs = visit.drugs || []
    var medRows = []
    for (var d = 0; d < drugs.length; d++) {
      var drug = drugs[d]
      var source = round === 1 ? 'hosp_stock' : String(drug.source || 'hosp_stock')
      medRows.push([
        Utilities.getUuid(),                     // med_id
        vn,                                      // vn
        String(drug.drug_name || ''),             // drug_name
        String(drug.strength || ''),              // strength
        Number(drug.qty) || 0,                    // qty
        String(drug.unit || ''),                  // unit
        String(drug.sig || ''),                   // sig
        source,                                   // source
        'N',                                      // is_changed
        round,                                    // round
        'draft',                                  // status
        '',                                       // note
        user.user_id,                             // updated_by
        now,                                      // updated_at
      ])
      importedMeds++
    }

    if (medRows.length > 0) {
      var startRow = vmSheet.getLastRow() + 1
      vmSheet.getRange(startRow, 1, medRows.length, medRows[0].length).setValues(medRows)
    }
  }

  // Audit log
  appendAuditLog(user, 'IMPORT', 'VISIT_SUMMARY', '', null, {
    round: round,
    hosp_code: hospCode,
    service_date: serviceDate,
    imported_visits: importedVisits,
    imported_meds: importedMeds,
  })

  return {
    success: true,
    data: {
      imported_visits: importedVisits,
      imported_meds: importedMeds,
      import_round1_at: round === 1 ? now : null,
    },
  }
}

// ---------------------------------------------------------------------------
// Visit Summary & Meds Handlers (T093)
// ---------------------------------------------------------------------------

/**
 * visitSummary.list — GET, role-filtered, excludes tel/hn/dob.
 * staff_hsc: own hosp_code only.
 * staff_hosp+: all, optionally filtered by service_date/hosp_code.
 */
function handleVisitSummaryList(user, params) {
  var serviceDateFilter = params.service_date || ''
  var hospCodeFilter = params.hosp_code || ''

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('VISIT_SUMMARY')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var facilitiesMap = getFacilitiesMap()
  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    var hospCode = String(row[VISIT_SUMMARY_COLS.hosp_code])
    var serviceDate = String(row[VISIT_SUMMARY_COLS.service_date])

    // Role-based visibility
    if (user.role === 'staff_hsc' && hospCode !== user.hosp_code) continue

    // Filters
    if (serviceDateFilter && serviceDate !== serviceDateFilter) continue
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode)

    results.push({
      vn: row[VISIT_SUMMARY_COLS.vn],
      patient_name: row[VISIT_SUMMARY_COLS.patient_name] || '',
      clinic_type: row[VISIT_SUMMARY_COLS.clinic_type] || '',
      hosp_code: hospCode,
      hosp_name: hospName,
      service_date: serviceDate,
      attended: row[VISIT_SUMMARY_COLS.attended] || '',
      has_drug_change: row[VISIT_SUMMARY_COLS.has_drug_change] || 'N',
      drug_source_pending: row[VISIT_SUMMARY_COLS.drug_source_pending] || 'N',
      dispensing_confirmed: row[VISIT_SUMMARY_COLS.dispensing_confirmed] || 'N',
      diff_status: row[VISIT_SUMMARY_COLS.diff_status] || 'pending',
    })
  }

  // Sort by patient_name
  results.sort(function(a, b) {
    return a.patient_name.localeCompare(b.patient_name, 'th')
  })

  return { success: true, data: results }
}

/**
 * visitMeds.list — GET, return VISIT_MEDS for a given VN.
 * staff_hsc: VN must belong to own hosp_code (checked via VISIT_SUMMARY).
 */
function handleVisitMedsList(user, params) {
  var vn = String(params.vn || '').trim()
  if (!vn) return { success: false, error: 'vn is required' }

  // staff_hsc: verify VN belongs to own hosp_code
  if (user.role === 'staff_hsc') {
    var ss2 = getSpreadsheet()
    var vsSheet2 = ss2.getSheetByName('VISIT_SUMMARY')
    if (vsSheet2) {
      var vsData2 = vsSheet2.getDataRange().getValues()
      var found2 = false
      for (var v = 1; v < vsData2.length; v++) {
        if (String(vsData2[v][VISIT_SUMMARY_COLS.vn]) === vn) {
          if (String(vsData2[v][VISIT_SUMMARY_COLS.hosp_code]) !== user.hosp_code) {
            return { success: false, error: 'Access denied: VN not in your facility' }
          }
          found2 = true
          break
        }
      }
      if (!found2) return { success: true, data: [] }
    }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('VISIT_MEDS')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    if (String(row[VISIT_MEDS_COLS.vn]) !== vn) continue

    results.push({
      med_id: row[VISIT_MEDS_COLS.med_id] || '',
      vn: vn,
      drug_name: row[VISIT_MEDS_COLS.drug_name] || '',
      strength: row[VISIT_MEDS_COLS.strength] || '',
      qty: Number(row[VISIT_MEDS_COLS.qty]) || 0,
      unit: row[VISIT_MEDS_COLS.unit] || '',
      sig: row[VISIT_MEDS_COLS.sig] || '',
      source: row[VISIT_MEDS_COLS.source] || 'hosp_stock',
      is_changed: row[VISIT_MEDS_COLS.is_changed] || 'N',
      round: Number(row[VISIT_MEDS_COLS.round]) || 1,
      status: row[VISIT_MEDS_COLS.status] || 'draft',
      note: row[VISIT_MEDS_COLS.note] || '',
      updated_by: row[VISIT_MEDS_COLS.updated_by] || '',
      updated_at: row[VISIT_MEDS_COLS.updated_at] || '',
    })
  }

  return { success: true, data: results }
}

/**
 * visitMeds.save — POST, handles confirm_all, edit, and absent action types.
 * All authenticated users.
 * - confirm_all: Set all meds status=confirmed, update VISIT_SUMMARY flags.
 * - edit: Update/insert individual meds, set is_changed=Y if data changed.
 * - absent: Set attended=N, cancel all meds.
 */
function handleVisitMedsSave(user, data) {
  var vn = String(data.vn || '').trim()
  var actionType = String(data.action_type || '').trim()
  var meds = data.meds || []

  if (!vn) return { success: false, error: 'vn is required' }
  if (!actionType) return { success: false, error: 'action_type is required' }

  var ss = getSpreadsheet()
  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  var vmSheet = ss.getSheetByName('VISIT_MEDS')
  var now = new Date().toISOString()

  // Find VISIT_SUMMARY row
  var vsRows = vsSheet.getDataRange().getValues()
  var vsFoundRow = -1
  for (var v = 1; v < vsRows.length; v++) {
    if (String(vsRows[v][VISIT_SUMMARY_COLS.vn]) === vn) {
      vsFoundRow = v + 1
      break
    }
  }
  if (vsFoundRow === -1) return { success: false, error: 'Visit not found' }

  // staff_hsc: verify ownership
  if (user.role === 'staff_hsc') {
    var vsHospCode = String(vsRows[vsFoundRow - 1][VISIT_SUMMARY_COLS.hosp_code])
    if (vsHospCode !== user.hosp_code) {
      return { success: false, error: 'Access denied: not your facility' }
    }
  }

  if (actionType === 'confirm_all') {
    // Update all VISIT_MEDS for this VN: status = confirmed
    var vmRows = vmSheet.getDataRange().getValues()
    for (var m = 1; m < vmRows.length; m++) {
      if (String(vmRows[m][VISIT_MEDS_COLS.vn]) === vn) {
        vmSheet.getRange(m + 1, VISIT_MEDS_COLS.status + 1).setValue('confirmed')
        vmSheet.getRange(m + 1, VISIT_MEDS_COLS.updated_by + 1).setValue(user.user_id)
        vmSheet.getRange(m + 1, VISIT_MEDS_COLS.updated_at + 1).setValue(now)
      }
    }

    // Update VISIT_SUMMARY
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.attended + 1).setValue('Y')
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.dispensing_confirmed + 1).setValue('Y')
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.confirmed_by + 1).setValue(user.user_id)
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.confirmed_at + 1).setValue(now)

    appendAuditLog(user, 'CONFIRM_ALL', 'VISIT_MEDS', vn, null, { action_type: 'confirm_all' })

  } else if (actionType === 'edit') {
    var hasDrugChange = false
    var hasSourcePending = false

    for (var e = 0; e < meds.length; e++) {
      var med = meds[e]
      var medId = String(med.med_id || '').trim()

      if (medId) {
        // Update existing med
        var allMeds = vmSheet.getDataRange().getValues()
        for (var a = 1; a < allMeds.length; a++) {
          if (String(allMeds[a][VISIT_MEDS_COLS.med_id]) === medId) {
            // Check if data changed
            var oldName = String(allMeds[a][VISIT_MEDS_COLS.drug_name])
            var oldStrength = String(allMeds[a][VISIT_MEDS_COLS.strength])
            var oldQty = Number(allMeds[a][VISIT_MEDS_COLS.qty])
            var oldSig = String(allMeds[a][VISIT_MEDS_COLS.sig])

            var isChanged = (oldName !== String(med.drug_name) ||
                            oldStrength !== String(med.strength) ||
                            oldQty !== Number(med.qty) ||
                            oldSig !== String(med.sig)) ? 'Y' : 'N'

            if (isChanged === 'Y') hasDrugChange = true

            var source = String(med.source || 'hosp_stock')
            if (source === 'hosp_pending') hasSourcePending = true

            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.drug_name + 1).setValue(String(med.drug_name || ''))
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.strength + 1).setValue(String(med.strength || ''))
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.qty + 1).setValue(Number(med.qty) || 0)
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.unit + 1).setValue(String(med.unit || ''))
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.sig + 1).setValue(String(med.sig || ''))
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.source + 1).setValue(source)
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.is_changed + 1).setValue(isChanged)
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.note + 1).setValue(String(med.note || ''))
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.status + 1).setValue('confirmed')
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.updated_by + 1).setValue(user.user_id)
            vmSheet.getRange(a + 1, VISIT_MEDS_COLS.updated_at + 1).setValue(now)
            break
          }
        }
      } else {
        // Insert new med
        var newSource = String(med.source || 'hosp_stock')
        if (newSource === 'hosp_pending') hasSourcePending = true
        hasDrugChange = true

        vmSheet.appendRow([
          Utilities.getUuid(),
          vn,
          String(med.drug_name || ''),
          String(med.strength || ''),
          Number(med.qty) || 0,
          String(med.unit || ''),
          String(med.sig || ''),
          newSource,
          'Y',  // is_changed for new drugs
          1,    // round
          'confirmed',
          String(med.note || ''),
          user.user_id,
          now,
        ])
      }
    }

    // Update VISIT_SUMMARY flags
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.attended + 1).setValue('Y')
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.has_drug_change + 1).setValue(hasDrugChange ? 'Y' : 'N')
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.drug_source_pending + 1).setValue(hasSourcePending ? 'Y' : 'N')
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.dispensing_confirmed + 1).setValue('Y')
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.confirmed_by + 1).setValue(user.user_id)
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.confirmed_at + 1).setValue(now)

    appendAuditLog(user, 'EDIT', 'VISIT_MEDS', vn, null, { action_type: 'edit', med_count: meds.length })

  } else if (actionType === 'absent') {
    // Mark patient as absent
    vsSheet.getRange(vsFoundRow, VISIT_SUMMARY_COLS.attended + 1).setValue('N')

    // Cancel all VISIT_MEDS
    var absMeds = vmSheet.getDataRange().getValues()
    for (var ab = 1; ab < absMeds.length; ab++) {
      if (String(absMeds[ab][VISIT_MEDS_COLS.vn]) === vn) {
        vmSheet.getRange(ab + 1, VISIT_MEDS_COLS.status + 1).setValue('cancelled')
        vmSheet.getRange(ab + 1, VISIT_MEDS_COLS.updated_by + 1).setValue(user.user_id)
        vmSheet.getRange(ab + 1, VISIT_MEDS_COLS.updated_at + 1).setValue(now)
      }
    }

    appendAuditLog(user, 'ABSENT', 'VISIT_MEDS', vn, null, { action_type: 'absent' })

  } else {
    return { success: false, error: 'Invalid action_type: ' + actionType }
  }

  return { success: true, data: { message: 'Drugs confirmed' } }
}

// ---------------------------------------------------------------------------
// Followup Handlers (T101)
// ---------------------------------------------------------------------------

/**
 * followup.list — GET, returns visits with dispensing_confirmed=Y, LEFT JOIN FOLLOWUP.
 * Access: super_admin, admin_hosp only.
 * Includes tel, hn (Module 6 only). Includes VISIT_MEDS and followup_records.
 */
function handleFollowupList(user, params) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var statusFilter = params.status || ''
  var hospCodeFilter = params.hosp_code || ''
  var serviceDateFilter = params.service_date || ''

  var ss = getSpreadsheet()
  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  if (!vsSheet) return { success: true, data: [] }

  var facilitiesMap = getFacilitiesMap()
  var vsData = vsSheet.getDataRange().getValues()

  // Build followup records lookup: vn -> array of records
  var fuSheet = ss.getSheetByName('FOLLOWUP')
  var followupByVN = {}
  if (fuSheet) {
    var fuData = fuSheet.getDataRange().getValues()
    for (var f = 1; f < fuData.length; f++) {
      var fuVN = String(fuData[f][FOLLOWUP_COLS.vn])
      var record = {
        followup_id: fuData[f][FOLLOWUP_COLS.followup_id] || '',
        followup_date: String(fuData[f][FOLLOWUP_COLS.followup_date] || ''),
        general_condition: String(fuData[f][FOLLOWUP_COLS.general_condition] || ''),
        side_effect: String(fuData[f][FOLLOWUP_COLS.side_effect] || ''),
        drug_adherence: String(fuData[f][FOLLOWUP_COLS.drug_adherence] || ''),
        other_note: String(fuData[f][FOLLOWUP_COLS.other_note] || ''),
        recorded_by: fuData[f][FOLLOWUP_COLS.recorded_by] || '',
        recorded_at: fuData[f][FOLLOWUP_COLS.recorded_at] || '',
      }
      if (!followupByVN[fuVN]) followupByVN[fuVN] = []
      followupByVN[fuVN].push(record)
    }
  }

  // Build meds lookup: vn -> array of confirmed meds
  var vmSheet = ss.getSheetByName('VISIT_MEDS')
  var medsByVN = {}
  if (vmSheet) {
    var vmData = vmSheet.getDataRange().getValues()
    for (var m = 1; m < vmData.length; m++) {
      if (String(vmData[m][VISIT_MEDS_COLS.status]) === 'confirmed') {
        var medVN = String(vmData[m][VISIT_MEDS_COLS.vn])
        if (!medsByVN[medVN]) medsByVN[medVN] = []
        medsByVN[medVN].push({
          med_id: vmData[m][VISIT_MEDS_COLS.med_id] || '',
          drug_name: vmData[m][VISIT_MEDS_COLS.drug_name] || '',
          strength: vmData[m][VISIT_MEDS_COLS.strength] || '',
          qty: Number(vmData[m][VISIT_MEDS_COLS.qty]) || 0,
          unit: vmData[m][VISIT_MEDS_COLS.unit] || '',
          sig: vmData[m][VISIT_MEDS_COLS.sig] || '',
          source: vmData[m][VISIT_MEDS_COLS.source] || '',
          is_changed: vmData[m][VISIT_MEDS_COLS.is_changed] || 'N',
          status: String(vmData[m][VISIT_MEDS_COLS.status]) || '',
        })
      }
    }
  }

  var results = []

  for (var i = 1; i < vsData.length; i++) {
    var row = vsData[i]

    // Only visits with dispensing_confirmed = Y
    if (String(row[VISIT_SUMMARY_COLS.dispensing_confirmed]) !== 'Y') continue

    var vn = String(row[VISIT_SUMMARY_COLS.vn])
    var hospCode = String(row[VISIT_SUMMARY_COLS.hosp_code])
    var serviceDate = String(row[VISIT_SUMMARY_COLS.service_date])

    // Service date filter
    if (serviceDateFilter && serviceDate !== serviceDateFilter) continue

    // Hosp code filter
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue

    // Compute followup_status
    var fuRecords = followupByVN[vn] || []
    var followupStatus = fuRecords.length > 0 ? 'followed' : 'pending'

    // Status filter
    if (statusFilter && followupStatus !== statusFilter) continue

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode)

    results.push({
      vn: vn,
      patient_name: row[VISIT_SUMMARY_COLS.patient_name] || '',
      tel: row[VISIT_SUMMARY_COLS.tel] || '',
      hn: row[VISIT_SUMMARY_COLS.hn] || '',
      hosp_code: hospCode,
      hosp_name: hospName,
      clinic_type: row[VISIT_SUMMARY_COLS.clinic_type] || '',
      service_date: String(row[VISIT_SUMMARY_COLS.service_date] || ''),
      has_drug_change: row[VISIT_SUMMARY_COLS.has_drug_change] || 'N',
      drug_source_pending: row[VISIT_SUMMARY_COLS.drug_source_pending] || 'N',
      dispensing_confirmed: 'Y',
      followup_status: followupStatus,
      followup_records: fuRecords,
      meds: medsByVN[vn] || [],
    })
  }

  // Sort by followup_status (pending first), then service_date DESC
  results.sort(function(a, b) {
    if (a.followup_status !== b.followup_status) {
      return a.followup_status === 'pending' ? -1 : 1
    }
    return b.service_date.localeCompare(a.service_date)
  })

  return { success: true, data: results }
}

/**
 * followup.save — POST, insert a new followup record for a VN.
 * Access: super_admin, admin_hosp only.
 * Multiple followup records per VN are allowed.
 */
function handleFollowupSave(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied: admin only' }
  }

  var vn = String(data.vn || '').trim()
  var followupDate = String(data.followup_date || '').trim()
  var generalCondition = String(data.general_condition || '').trim()
  var sideEffect = String(data.side_effect || '').trim()
  var drugAdherence = String(data.drug_adherence || '').trim()
  var otherNote = String(data.other_note || '').trim()

  if (!vn) return { success: false, error: 'vn is required' }
  if (!followupDate) return { success: false, error: 'followup_date is required' }

  var ss = getSpreadsheet()

  // Validate VN exists and dispensing_confirmed = Y
  var vsSheet = ss.getSheetByName('VISIT_SUMMARY')
  var vsData = vsSheet.getDataRange().getValues()
  var found = false
  for (var i = 1; i < vsData.length; i++) {
    if (String(vsData[i][VISIT_SUMMARY_COLS.vn]) === vn) {
      if (String(vsData[i][VISIT_SUMMARY_COLS.dispensing_confirmed]) !== 'Y') {
        return { success: false, error: 'Visit not yet confirmed for dispensing' }
      }
      found = true
      break
    }
  }
  if (!found) return { success: false, error: 'VN not found in VISIT_SUMMARY' }

  // Insert followup record
  var fuSheet = ss.getSheetByName('FOLLOWUP')
  var followupId = Utilities.getUuid()
  var now = new Date().toISOString()

  fuSheet.appendRow([
    followupId,
    vn,
    followupDate,
    generalCondition,
    sideEffect,
    drugAdherence,
    otherNote,
    user.user_id,
    now,
  ])

  // Audit log
  appendAuditLog(user, 'CREATE', 'FOLLOWUP', followupId, null, {
    vn: vn,
    followup_date: followupDate,
  })

  return { success: true, data: { followup_id: followupId } }
}

// ---------------------------------------------------------------------------
// Users Handlers (T124)
// ---------------------------------------------------------------------------

/**
 * users.list — GET, list users with optional filters.
 * Access: super_admin sees all; admin_hosp sees staff_hosp + staff_hsc only.
 * Never returns password_hash or password_salt.
 */
function handleUsersList(user, params) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied' }
  }

  var statusFilter = params.status || ''
  var roleFilter = params.role || ''

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')
  var data = sheet.getDataRange().getValues()

  // admin_hosp can only see staff_hosp + staff_hsc
  var visibleRoles = null
  if (user.role === 'admin_hosp') {
    visibleRoles = { staff_hosp: true, staff_hsc: true }
  }

  var results = []

  for (var i = 1; i < data.length; i++) {
    var row = data[i]
    var rowRole = String(row[USERS_COLS.role])
    var rowStatus = String(row[USERS_COLS.status])

    // Role visibility
    if (visibleRoles && !visibleRoles[rowRole]) continue

    // Filters
    if (statusFilter && rowStatus !== statusFilter) continue
    if (roleFilter && rowRole !== roleFilter) continue

    results.push({
      user_id: row[USERS_COLS.user_id],
      hosp_code: String(row[USERS_COLS.hosp_code]),
      first_name: String(row[USERS_COLS.first_name]),
      last_name: String(row[USERS_COLS.last_name]),
      tel: String(row[USERS_COLS.tel]),
      role: rowRole,
      status: rowStatus,
      created_at: String(row[USERS_COLS.created_at] || ''),
    })
  }

  // Sort by created_at DESC
  results.sort(function(a, b) {
    return b.created_at.localeCompare(a.created_at)
  })

  return { success: true, data: results }
}

/**
 * users.approve — POST, approve a pending user with assigned role.
 * Access: super_admin or admin_hosp.
 * Validates role permission: admin_hosp can only assign staff_hosp/staff_hsc.
 */
function handleUsersApprove(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied' }
  }

  var targetUserId = String(data.user_id || '').trim()
  var assignRole = String(data.role || '').trim()

  if (!targetUserId) return { success: false, error: 'user_id is required' }
  if (!assignRole) return { success: false, error: 'role is required' }

  // Validate assignable roles
  var assignableRoles = null
  if (user.role === 'admin_hosp') {
    assignableRoles = { staff_hosp: true, staff_hsc: true }
  }
  if (assignableRoles && !assignableRoles[assignRole]) {
    return { success: false, error: 'You cannot assign this role' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')
  var rows = sheet.getDataRange().getValues()

  var foundRow = -1
  var oldStatus = ''
  var oldRole = ''

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][USERS_COLS.user_id] === targetUserId) {
      foundRow = i + 1
      oldStatus = String(rows[i][USERS_COLS.status])
      oldRole = String(rows[i][USERS_COLS.role])
      break
    }
  }

  if (foundRow === -1) return { success: false, error: 'User not found' }
  if (oldStatus !== 'pending') return { success: false, error: 'User is not pending approval' }

  // Update status and role
  sheet.getRange(foundRow, USERS_COLS.status + 1).setValue('active')
  sheet.getRange(foundRow, USERS_COLS.role + 1).setValue(assignRole)
  sheet.getRange(foundRow, USERS_COLS.approved_by + 1).setValue(user.user_id)

  // Audit log
  appendAuditLog(user, 'APPROVE', 'USERS', targetUserId,
    { status: oldStatus, role: oldRole },
    { status: 'active', role: assignRole }
  )

  return { success: true, data: { message: 'User approved' } }
}

/**
 * users.update — POST, update user role or status.
 * Access: super_admin or admin_hosp.
 * Suspend clears session token to force re-login.
 */
function handleUsersUpdate(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied' }
  }

  var targetUserId = String(data.user_id || '').trim()
  var newStatus = String(data.status || '').trim()
  var newRole = String(data.role || '').trim()

  if (!targetUserId) return { success: false, error: 'user_id is required' }
  if (!newStatus && !newRole) return { success: false, error: 'Nothing to update' }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')
  var rows = sheet.getDataRange().getValues()

  var foundRow = -1
  var oldStatus = ''
  var oldRole = ''

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][USERS_COLS.user_id] === targetUserId) {
      foundRow = i + 1
      oldStatus = String(rows[i][USERS_COLS.status])
      oldRole = String(rows[i][USERS_COLS.role])
      break
    }
  }

  if (foundRow === -1) return { success: false, error: 'User not found' }

  // Cannot modify super_admin unless you are super_admin
  if (oldRole === 'super_admin' && user.role !== 'super_admin') {
    return { success: false, error: 'Cannot modify super_admin' }
  }

  // Validate role assignment permission
  if (newRole) {
    var assignableRoles = null
    if (user.role === 'admin_hosp') {
      assignableRoles = { staff_hosp: true, staff_hsc: true }
    }
    if (assignableRoles && !assignableRoles[newRole]) {
      return { success: false, error: 'You cannot assign this role' }
    }
    sheet.getRange(foundRow, USERS_COLS.role + 1).setValue(newRole)
  }

  if (newStatus) {
    sheet.getRange(foundRow, USERS_COLS.status + 1).setValue(newStatus)

    // Suspend: clear session to force re-login
    if (newStatus === 'inactive') {
      sheet.getRange(foundRow, USERS_COLS.session_token + 1).setValue('')
      sheet.getRange(foundRow, USERS_COLS.session_expires + 1).setValue('')
    }
  }

  // Audit log
  appendAuditLog(user, 'UPDATE', 'USERS', targetUserId,
    { status: oldStatus, role: oldRole },
    { status: newStatus || oldStatus, role: newRole || oldRole }
  )

  return { success: true, data: { message: 'User updated' } }
}

/**
 * users.resetPassword — POST, reset user password to a new value.
 * Access: super_admin or admin_hosp.
 * Clears session to force re-login with new password.
 */
function handleUsersResetPassword(user, data) {
  // Access control
  if (user.role !== 'super_admin' && user.role !== 'admin_hosp') {
    return { success: false, error: 'Access denied' }
  }

  var targetUserId = String(data.user_id || '').trim()
  var newPassword = String(data.new_password || '').trim()

  if (!targetUserId) return { success: false, error: 'user_id is required' }

  // Generate a secure temp password if not provided
  if (!newPassword) {
    newPassword = 'Tmp' + Utilities.getUuid().replace(/-/g, '').substring(0, 10)
  }

  if (newPassword.length < 8) return { success: false, error: 'Password must be at least 8 characters' }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('USERS')
  var rows = sheet.getDataRange().getValues()

  var foundRow = -1

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][USERS_COLS.user_id] === targetUserId) {
      foundRow = i + 1
      break
    }
  }

  if (foundRow === -1) return { success: false, error: 'User not found' }

  // Hash new password
  var newSalt = generateSalt()
  var newHash = hashPassword(newPassword, newSalt)

  // Update password and clear session
  sheet.getRange(foundRow, USERS_COLS.password_hash + 1).setValue(newHash)
  sheet.getRange(foundRow, USERS_COLS.password_salt + 1).setValue(newSalt)
  sheet.getRange(foundRow, USERS_COLS.session_token + 1).setValue('')
  sheet.getRange(foundRow, USERS_COLS.session_expires + 1).setValue('')
  // Set force_change flag so user must change password on next login
  if (sheet.getLastColumn() >= USERS_COLS.force_change + 1) {
    sheet.getRange(foundRow, USERS_COLS.force_change + 1).setValue('Y')
  }

  // Audit log
  appendAuditLog(user, 'RESET_PASSWORD', 'USERS', targetUserId, null, { action: 'password_reset' })

  return { success: true, data: { message: 'Password reset' } }
}

// ---------------------------------------------------------------------------
// Settings Handlers (T125)
// ---------------------------------------------------------------------------

/**
 * settings.get — GET, read all key-value pairs from SETTINGS sheet.
 * Access: super_admin only.
 */
function handleSettingsGet(user) {
  // Access control
  if (user.role !== 'super_admin') {
    return { success: false, error: 'Access denied: super_admin only' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('SETTINGS')
  if (!sheet) return { success: true, data: { settings: [] } }

  var data = sheet.getDataRange().getValues()
  var settings = []

  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][SETTINGS_COLS.key] || '').trim()
    var value = String(data[i][SETTINGS_COLS.value] || '')
    if (key) {
      settings.push({ key: key, value: value })
    }
  }

  return { success: true, data: { settings: settings } }
}

/**
 * settings.save — POST, update key-value pairs in SETTINGS sheet.
 * Access: super_admin only.
 * If telegram_test=true, sends a test message via Telegram Bot API.
 */
function handleSettingsSave(user, data) {
  // Access control
  if (user.role !== 'super_admin') {
    return { success: false, error: 'Access denied: super_admin only' }
  }

  var settings = data.settings
  if (!settings || !settings.length) {
    return { success: false, error: 'No settings provided' }
  }

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('SETTINGS')
  if (!sheet) return { success: false, error: 'SETTINGS sheet not found' }

  // Build lookup of existing keys -> row number
  var existingRows = sheet.getDataRange().getValues()
  var keyRowMap = {}
  for (var i = 1; i < existingRows.length; i++) {
    var existingKey = String(existingRows[i][SETTINGS_COLS.key]).trim()
    if (existingKey) keyRowMap[existingKey] = i + 1 // 1-based
  }

  // Update or insert each setting
  for (var s = 0; s < settings.length; s++) {
    var key = String(settings[s].key || '').trim()
    var value = String(settings[s].value || '')
    if (!key) continue

    if (keyRowMap[key]) {
      // Update existing
      sheet.getRange(keyRowMap[key], SETTINGS_COLS.value + 1).setValue(value)
    } else {
      // Insert new
      sheet.appendRow([key, value])
    }
  }

  // Handle Telegram test
  if (data.telegram_test) {
    // Re-read settings to get latest values including just-saved ones
    var freshSettings = getSettingsMap()
    var testResult = sendTelegramMessage(
      freshSettings,
      '🔔 ทดสอบการแจ้งเตือน\nระบบ: ' + (freshSettings.system_name || 'Telemed Tracking') + '\nสถานะ: ส่งสำเร็จ ✅'
    )
    if (!testResult.success) {
      return { success: false, error: 'Settings saved but Telegram test failed: ' + testResult.error }
    }
  }

  // Audit log
  appendAuditLog(user, 'UPDATE', 'SETTINGS', '', null, {
    updated_keys: settings.map(function(s) { return s.key }),
    telegram_test: !!data.telegram_test,
  })

  return { success: true, data: { message: 'Settings saved' } }
}

// ---------------------------------------------------------------------------
// Audit Log Handler
// ---------------------------------------------------------------------------

/**
 * auditLog.list — GET, return recent audit log entries.
 * Access: super_admin only.
 */
function handleAuditLogList(user, params) {
  if (user.role !== 'super_admin') {
    return { success: false, error: 'Access denied: super_admin only' }
  }

  var limit = Number(params.limit) || 100

  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('AUDIT_LOG')
  if (!sheet) return { success: true, data: [] }

  var data = sheet.getDataRange().getValues()
  var results = []

  // Read from newest to oldest (skip header)
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i]
    results.push({
      log_id: row[AUDIT_LOG_COLS.log_id] || '',
      user_id: String(row[AUDIT_LOG_COLS.user_id] || ''),
      action: String(row[AUDIT_LOG_COLS.action] || ''),
      module: String(row[AUDIT_LOG_COLS.module] || ''),
      target_id: String(row[AUDIT_LOG_COLS.target_id] || ''),
      old_value: String(row[AUDIT_LOG_COLS.old_value] || ''),
      new_value: String(row[AUDIT_LOG_COLS.new_value] || ''),
      created_at: String(row[AUDIT_LOG_COLS.created_at] || ''),
    })
    if (results.length >= limit) break
  }

  return { success: true, data: results }
}

// ---------------------------------------------------------------------------
// Settings Helpers
// ---------------------------------------------------------------------------

/**
 * Read SETTINGS sheet into a simple key-value object.
 */
function getSettingsMap() {
  var ss = getSpreadsheet()
  var sheet = ss.getSheetByName('SETTINGS')
  if (!sheet) return {}

  var data = sheet.getDataRange().getValues()
  var map = {}
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][SETTINGS_COLS.key] || '').trim()
    var value = String(data[i][SETTINGS_COLS.value] || '')
    if (key) map[key] = value
  }
  return map
}

/**
 * Send a message via Telegram Bot API.
 * Returns { success: boolean, error?: string }
 */
function sendTelegramMessage(settings, message) {
  var botToken = settings.bot_token || ''
  var chatId = settings.chat_id || ''

  if (!botToken || !chatId) {
    return { success: false, error: 'Bot token or Chat ID not configured' }
  }

  var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage'
  var payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  }

  try {
    var options = {
      method: 'post',
      payload: JSON.stringify(payload),
      contentType: 'application/json',
      muteHttpExceptions: true,
    }
    var response = UrlFetchApp.fetch(url, options)
    var responseCode = response.getResponseCode()

    if (responseCode === 200) {
      return { success: true }
    } else {
      var errorBody = response.getContentText()
      return { success: false, error: 'HTTP ' + responseCode + ': ' + errorBody }
    }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

// ---------------------------------------------------------------------------
// Telegram Daily Trigger (T126)
// ---------------------------------------------------------------------------

/**
 * dailyTrigger — Called by GAS time-driven trigger (e.g., 07:00 daily).
 * Checks if Telegram is active, queries tomorrow's clinics,
 * and sends a summary notification to the configured chat.
 *
 * Set up trigger in GAS editor:
 *   Resources > Current project's triggers > Add trigger
 *   Function: dailyTrigger
 *   Event: Time-driven > Day timer > 7am to 8am
 */
function dailyTrigger() {
  if (!SPREADSHEET_ID) return

  var settings = getSettingsMap()

  // Check if Telegram notifications are enabled
  if (settings.telegram_active !== 'Y') return

  var botToken = settings.bot_token || ''
  var chatId = settings.chat_id || ''
  var systemName = settings.system_name || 'Telemed Tracking'

  if (!botToken || !chatId) return

  // Get tomorrow's date
  var tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  var tomorrowStr = tomorrow.toISOString().split('T')[0]

  var ss = getSpreadsheet()
  var facilitiesMap = getFacilitiesMap()

  // Query tomorrow's clinics
  var csSheet = ss.getSheetByName('CLINIC_SCHEDULE')
  if (!csSheet) return

  var csData = csSheet.getDataRange().getValues()
  var clinics = []

  for (var i = 1; i < csData.length; i++) {
    var serviceDate = String(csData[i][CLINIC_SCHEDULE_COLS.service_date])
    if (serviceDate === tomorrowStr) {
      var hospCode = String(csData[i][CLINIC_SCHEDULE_COLS.hosp_code])
      var hospName = facilitiesMap[hospCode] || getHospName(hospCode)
      var clinicType = String(csData[i][CLINIC_SCHEDULE_COLS.clinic_type])
      var serviceTime = String(csData[i][CLINIC_SCHEDULE_COLS.service_time] || '')
      var appointCount = Number(csData[i][CLINIC_SCHEDULE_COLS.appoint_count]) || 0

      clinics.push({
        hosp_code: hospCode,
        hosp_name: hospName,
        clinic_type: clinicType,
        service_time: serviceTime,
        appoint_count: appointCount,
      })
    }
  }

  // Build message
  var message = '📋 <b>' + systemName + '</b>\n'
  message += '📅 คลินิกวันพรุ่งนี้ (' + tomorrowStr + ')\n\n'

  if (clinics.length === 0) {
    message += 'ไม่มีนัดคลินิก\n'
  } else {
    for (var c = 0; c < clinics.length; c++) {
      var clinic = clinics[c]
      message += '🏥 ' + clinic.hosp_name + '\n'
      message += '   ประเภท: ' + clinic.clinic_type
      if (clinic.service_time) message += ' | เวลา: ' + clinic.service_time
      message += '\n'
      message += '   จำนวนนัด: ' + clinic.appoint_count + ' ราย\n'
      if (c < clinics.length - 1) message += '\n'
    }
  }

  // Check equipment readiness
  var rlSheet = ss.getSheetByName('READINESS_LOG')
  var notReadyFacilities = []
  if (rlSheet) {
    var rlData = rlSheet.getDataRange().getValues()
    var latestReadiness = {}
    for (var r = 1; r < rlData.length; r++) {
      var rHospCode = String(rlData[r][READINESS_LOG_COLS.hosp_code])
      var rCheckDate = String(rlData[r][READINESS_LOG_COLS.check_date])
      var rStatus = String(rlData[r][READINESS_LOG_COLS.overall_status])
      if (!latestReadiness[rHospCode] || rCheckDate > latestReadiness[rHospCode].check_date) {
        latestReadiness[rHospCode] = { status: rStatus, check_date: rCheckDate }
      }
    }

    // Check readiness of facilities with tomorrow's clinics
    var checkedCodes = {}
    for (var cl = 0; cl < clinics.length; cl++) {
      var cHospCode = clinics[cl].hosp_code
      if (cHospCode && !checkedCodes[cHospCode]) {
        checkedCodes[cHospCode] = true
        var readiness = latestReadiness[cHospCode]
        if (!readiness || readiness.status !== 'ready') {
          notReadyFacilities.push(clinics[cl].hosp_name)
        }
      }
    }
  }

  if (notReadyFacilities.length > 0) {
    message += '\n⚠️ <b>อุปกรณ์ยังไม่พร้อม:</b>\n'
    for (var nr = 0; nr < notReadyFacilities.length; nr++) {
      message += '  ❌ ' + notReadyFacilities[nr] + '\n'
    }
  }

  // Send via Telegram
  sendTelegramMessage(settings, message)
}
