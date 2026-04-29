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

/**
 * Convert 1-based column number to column letter(s) (e.g., 1→A, 27→AA).
 */
function columnToLetter(col) {
  var letter = "";
  while (col > 0) {
    var mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

var SPREADSHEET_ID = "1r3zQyhHtjqoUXFEXtG5pUj8-thR21jGqIy7WF00EB2U"; // TODO: Set to your Google Spreadsheet ID
var SESSION_DURATION_HOURS = 8;
var HASH_ITERATIONS = 10000;

// Sheet column indexes (0-based) — must match actual sheet header order
var USERS_COLS = {
  user_id: 0,
  username: 1,
  hosp_code: 2,
  first_name: 3,
  last_name: 4,
  tel: 5,
  password_hash: 6,
  password_salt: 7,
  role: 8,
  status: 9,
  approved_by: 10,
  session_token: 11,
  session_expires: 12,
  created_at: 13,
  last_login: 14,
  force_change: 15,
};

var HOSPITAL_COLS = {
  hosp_code: 0,
  hosp_name: 1,
  hosp_type: 2,
  active: 3,
};

var FACILITIES_COLS = {
  hosp_code: 0,
  hosp_name: 1,
  contact_name: 2,
  contact_tel: 3,
  active: 4,
};

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
};

var AUDIT_LOG_COLS = {
  log_id: 0,
  user_id: 1,
  action: 2,
  module: 3,
  target_id: 4,
  old_value: 5,
  new_value: 6,
  created_at: 7,
};

var MASTER_DRUG_COLS = {
  drug_id: 0,
  drug_name: 1,
  strength: 2,
  unit: 3,
  active: 4,
};

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
  drug_delivery_date: 10,
};

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
};

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
};

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
  drug_sent_date: 17,
  drug_received_date: 18,
  drug_delivered_date: 19,
};

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
};

var SETTINGS_COLS = {
  key: 0,
  value: 1,
};

// ---------------------------------------------------------------------------
// Sheet Header Verification
// ---------------------------------------------------------------------------

var SHEET_HEADERS = {
  USERS: [
    "user_id", "username", "hosp_code", "first_name", "last_name", "tel",
    "password_hash", "password_salt", "role", "status", "approved_by",
    "session_token", "session_expires", "created_at", "last_login", "force_change",
  ],
  HOSPITAL: ["hosp_code", "hosp_name", "hosp_type", "active"],
  FACILITIES: ["hosp_code", "hosp_name", "contact_name", "contact_tel", "active"],
  EQUIPMENT: [
    "equip_id", "hosp_code", "set_type", "device_type", "os", "status",
    "is_backup", "software", "internet_mbps", "responsible_person",
    "responsible_tel", "note", "updated_at", "updated_by",
  ],
  MASTER_DRUGS: ["drug_id", "drug_name", "strength", "unit", "active"],
  CLINIC_SCHEDULE: [
    "schedule_id", "service_date", "hosp_code", "clinic_type", "service_time",
    "appoint_count", "telemed_link", "link_added_by", "incident_note", "updated_at",
    "drug_delivery_date",
  ],
  READINESS_LOG: [
    "log_id", "hosp_code", "check_date", "cam_ok", "mic_ok", "pc_ok",
    "internet_ok", "software_ok", "overall_status", "note", "checked_by", "checked_at",
  ],
  VISIT_SUMMARY: [
    "vn", "hn", "patient_name", "dob", "tel", "clinic_type", "hosp_code",
    "service_date", "attended", "has_drug_change", "drug_source_pending",
    "dispensing_confirmed", "import_round1_at", "import_round2_at",
    "diff_status", "confirmed_by", "confirmed_at",
    "drug_sent_date", "drug_received_date", "drug_delivered_date",
  ],
  VISIT_MEDS: [
    "med_id", "vn", "drug_name", "strength", "qty", "unit", "sig",
    "source", "is_changed", "round", "status", "note", "updated_by", "updated_at",
  ],
  FOLLOWUP: [
    "followup_id", "vn", "followup_date", "general_condition",
    "side_effect", "drug_adherence", "other_note", "recorded_by", "recorded_at",
  ],
  SETTINGS: ["key", "value"],
  AUDIT_LOG: [
    "log_id", "user_id", "action", "module", "target_id",
    "old_value", "new_value", "created_at",
  ],
};

/**
 * Verify that actual sheet headers match expected column definitions.
 * Returns { ok: boolean, sheets: { [name]: { ok, expected, actual, mismatches } } }
 */
function verifySheetHeaders() {
  var ss = getSpreadsheet();
  var result = { ok: true, sheets: {} };

  for (var sheetName in SHEET_HEADERS) {
    var expected = SHEET_HEADERS[sheetName];
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      result.ok = false;
      result.sheets[sheetName] = {
        ok: false,
        error: "Sheet not found",
        expected: expected,
        actual: null,
      };
      continue;
    }

    try {
      var lastCol = sheet.getLastColumn();
      var colCount = Math.max(lastCol, expected.length);
      var headerRow = sheet.getRange(1, 1, 1, colCount).getValues()[0];
      var actual = headerRow.map(function (v) { return String(v); });
      var mismatches = [];

      for (var i = 0; i < expected.length; i++) {
        var act = actual[i] || "";
        if (act !== expected[i]) {
          mismatches.push({
            index: i,
            expected: expected[i],
            actual: act,
          });
        }
      }

      var sheetOk = mismatches.length === 0 && actual.length >= expected.length;
      if (!sheetOk) result.ok = false;

      result.sheets[sheetName] = {
        ok: sheetOk,
        expected: expected,
        actual: actual,
        mismatches: mismatches,
      };
    } catch (sheetErr) {
      result.ok = false;
      result.sheets[sheetName] = {
        ok: false,
        error: "Error reading sheet: " + (sheetErr.message || String(sheetErr)),
        expected: expected,
        actual: null,
      };
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Debug Trace Collector
// ---------------------------------------------------------------------------

var _debugSteps = [];
var _debugMode = false;

function debugTrace(step, detail) {
  if (!_debugMode) return;
  _debugSteps.push({
    step: step,
    ms: Date.now(),
    detail: typeof detail === "string" ? detail : JSON.stringify(detail),
  });
}

function startDebugTrace() {
  _debugMode = true;
  _debugSteps = [];
}

function getDebugTrace(startMs) {
  var trace = _debugSteps;
  _debugSteps = [];
  _debugMode = false;
  if (trace.length === 0) return undefined;
  return { duration_ms: Date.now() - startMs, steps: trace };
}

// ---------------------------------------------------------------------------
// Entry Points
// ---------------------------------------------------------------------------

function doGet(e) {
  var startMs = Date.now();
  var wantDebug = e.parameter._debug === "true";
  if (wantDebug) startDebugTrace();

  try {
    if (!SPREADSHEET_ID) {
      var configResult = { success: false, error: "Server not configured: SPREADSHEET_ID is empty" };
      if (wantDebug) configResult._debug = getDebugTrace(startMs);
      return buildResponse(configResult);
    }

    var token = e.parameter.token;
    var action = e.parameter.action;

    debugTrace("doGet", { action: action });

    // Public endpoints (no token required)
    if (action === "dashboard.stats") {
      var result = handleDashboardStats();
      if (wantDebug) result._debug = getDebugTrace(startMs);
      return buildResponse(result);
    }
    if (action === "hospital.list") {
      var result = handleHospitalList();
      if (wantDebug) result._debug = getDebugTrace(startMs);
      return buildResponse(result);
    }

    var user = validateSession(token);
    debugTrace("validateSession", { ok: !!user });
    if (!user) {
      var unauthResult = { success: false, error: "Unauthorized" };
      if (wantDebug) unauthResult._debug = getDebugTrace(startMs);
      return buildResponse(unauthResult);
    }

    var result = routeAction(action, e.parameter, user);
    if (wantDebug) result._debug = getDebugTrace(startMs);
    return buildResponse(result);
  } catch (err) {
    debugTrace("ERROR", err.message || String(err));
    var errorResult = { success: false, error: err.message || String(err) };
    if (wantDebug) errorResult._debug = getDebugTrace(startMs);
    return buildResponse(errorResult);
  }
}

function doPost(e) {
  var startMs = Date.now();
  var wantDebug = false;
  try {
    var payload = JSON.parse(e.postData.contents);
    wantDebug = payload._debug === true;
  } catch (_) {}
  if (wantDebug) startDebugTrace();

  try {
    if (!SPREADSHEET_ID) {
      var configResult = { success: false, error: "Server not configured: SPREADSHEET_ID is empty" };
      if (wantDebug) configResult._debug = getDebugTrace(startMs);
      return buildResponse(configResult);
    }

    var action = payload.action;
    var token = payload.token;
    var data = payload.data || {};

    debugTrace("doPost", { action: action });

    // Public auth endpoints (no token required)
    if (action === "auth.login") {
      var result = handleLogin(data);
      if (wantDebug) result._debug = getDebugTrace(startMs);
      return buildResponse(result);
    }
    if (action === "auth.register") {
      var result = handleRegister(data);
      if (wantDebug) result._debug = getDebugTrace(startMs);
      return buildResponse(result);
    }

    var user = validateSession(token);
    debugTrace("validateSession", { ok: !!user });
    if (!user) {
      var unauthResult = { success: false, error: "Unauthorized" };
      if (wantDebug) unauthResult._debug = getDebugTrace(startMs);
      return buildResponse(unauthResult);
    }

    var result = routeAction(action, data, user);
    if (wantDebug) result._debug = getDebugTrace(startMs);
    return buildResponse(result);
  } catch (err) {
    debugTrace("ERROR", err.message || String(err));
    var errorResult = { success: false, error: err.message || String(err) };
    if (wantDebug) errorResult._debug = getDebugTrace(startMs);
    return buildResponse(errorResult);
  }
}

// ---------------------------------------------------------------------------
// Response Helper
// ---------------------------------------------------------------------------

function buildResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ---------------------------------------------------------------------------
// Text Format Safety Net
// ---------------------------------------------------------------------------

/**
 * Maps sheet name → array of 1-based column indices that must be Plain Text ("@").
 * Used as a safety net when setupSheets hasn't been run or new rows are appended
 * beyond the originally formatted range.
 *
 * Call BEFORE setValues() to ensure text columns preserve leading zeros
 * in code fields (e.g., hosp_code "00588" should not become 588).
 */
var TEXT_FORMAT_COLUMNS = {};

/**
 * Build TEXT_FORMAT_COLUMNS from COLS definitions.
 * Called once on first use of ensureTextFormat.
 */
function buildTextFormatMap() {
  // hosp_code, tel, vn, hn are always text — map them from each COLS object
  TEXT_FORMAT_COLUMNS["USERS"] = [
    USERS_COLS.username,
    USERS_COLS.hosp_code,
    USERS_COLS.tel,
    USERS_COLS.user_id,
    USERS_COLS.session_token,
    USERS_COLS.password_hash,
    USERS_COLS.password_salt,
    USERS_COLS.approved_by,
  ].map(function (c) { return c + 1; }); // 1-based

  TEXT_FORMAT_COLUMNS["HOSPITAL"] = [
    HOSPITAL_COLS.hosp_code,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["FACILITIES"] = [
    FACILITIES_COLS.hosp_code,
    FACILITIES_COLS.contact_tel,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["EQUIPMENT"] = [
    EQUIPMENT_COLS.equip_id,
    EQUIPMENT_COLS.hosp_code,
    EQUIPMENT_COLS.responsible_tel,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["CLINIC_SCHEDULE"] = [
    CLINIC_SCHEDULE_COLS.schedule_id,
    CLINIC_SCHEDULE_COLS.hosp_code,
    CLINIC_SCHEDULE_COLS.link_added_by,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["READINESS_LOG"] = [
    READINESS_LOG_COLS.log_id,
    READINESS_LOG_COLS.hosp_code,
    READINESS_LOG_COLS.checked_by,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["MASTER_DRUGS"] = [
    MASTER_DRUG_COLS.drug_id,
    MASTER_DRUG_COLS.drug_name,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["VISIT_SUMMARY"] = [
    VISIT_SUMMARY_COLS.vn,
    VISIT_SUMMARY_COLS.hn,
    VISIT_SUMMARY_COLS.tel,
    VISIT_SUMMARY_COLS.hosp_code,
    VISIT_SUMMARY_COLS.confirmed_by,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["VISIT_MEDS"] = [
    VISIT_MEDS_COLS.med_id,
    VISIT_MEDS_COLS.vn,
    VISIT_MEDS_COLS.drug_name,
    VISIT_MEDS_COLS.updated_by,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["FOLLOWUP"] = [
    FOLLOWUP_COLS.followup_id,
    FOLLOWUP_COLS.vn,
    FOLLOWUP_COLS.recorded_by,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["AUDIT_LOG"] = [
    AUDIT_LOG_COLS.log_id,
    AUDIT_LOG_COLS.user_id,
    AUDIT_LOG_COLS.target_id,
  ].map(function (c) { return c + 1; });

  TEXT_FORMAT_COLUMNS["SETTINGS"] = [
    SETTINGS_COLS.key,
  ].map(function (c) { return c + 1; });
}

/**
 * Ensure text format on newly appended row(s).
 * @param {string} sheetName - Sheet name (e.g., "USERS")
 * @param {number} startRow - 1-based row index of the first new row
 * @param {number} numRows - Number of rows to format (default: 1)
 */
/**
 * Convert a Sheets cell value to a YYYY-MM-DD string.
 * Handles Date objects, serial numbers, and plain strings.
 */
function toDateStr(val) {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  // Fallback: numeric serial → let Sheets timezone handle via Utilities
  return String(val);
}

/**
 * Split comma-separated clinic_type into array of individual types.
 */
function splitClinicTypes(clinicTypeStr) {
  if (!clinicTypeStr) return [];
  return String(clinicTypeStr).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
}

/**
 * Check if a VN is a placeholder (pre-registered, not yet from HosXP).
 */
function isPlaceholderVN(vn) {
  return String(vn).indexOf("REG-") === 0;
}

function ensureTextFormat(sheetName, startRow, numRows) {
  if (!numRows) numRows = 1;

  // Lazy-build the format map on first call
  if (!TEXT_FORMAT_COLUMNS || Object.keys(TEXT_FORMAT_COLUMNS).length === 0) {
    buildTextFormatMap();
  }

  var cols = TEXT_FORMAT_COLUMNS[sheetName];
  if (!cols) return;

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  for (var i = 0; i < cols.length; i++) {
    var colLetter = columnToLetter(cols[i]);
    sheet.getRange(startRow, cols[i], numRows, 1).setNumberFormat("@");
  }
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/**
 * Get cached spreadsheet reference — avoids multiple openById calls per request.
 */
var _ssCache = null;
function getSpreadsheet() {
  if (!_ssCache) {
    _ssCache = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return _ssCache;
}

/**
 * Validate session token and return user object (without sensitive fields).
 * Returns null if token is missing, expired, or invalid.
 */
function validateSession(token) {
  if (!token) return null;

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[USERS_COLS.session_token] === token) {
      var expires = row[USERS_COLS.session_expires];
      if (!expires) continue;

      var expiryDate = new Date(expires);
      if (expiryDate < new Date()) {
        // Session expired — clear token
        sheet.getRange(i + 1, USERS_COLS.session_token + 1).setValue("");
        sheet.getRange(i + 1, USERS_COLS.session_expires + 1).setValue("");
        return null;
      }

      // Check account is active
      if (row[USERS_COLS.status] !== "active") {
        return null;
      }

      return {
        user_id: row[USERS_COLS.user_id],
        username: String(row[USERS_COLS.username]),
        hosp_code: String(row[USERS_COLS.hosp_code]),
        first_name: row[USERS_COLS.first_name],
        last_name: row[USERS_COLS.last_name],
        role: row[USERS_COLS.role],
        hosp_name: getHospName(String(row[USERS_COLS.hosp_code])),
        rowIndex: i + 1, // 1-based for sheet operations
      };
    }
  }

  return null;
}

/**
 * Get hospital name from HOSPITAL sheet by hosp_code.
 */
function getHospName(hospCode) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("HOSPITAL");
  if (!sheet) return "";
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][HOSPITAL_COLS.hosp_code]) === hospCode) {
      return data[i][HOSPITAL_COLS.hosp_name];
    }
  }
  return "";
}

// ---------------------------------------------------------------------------
// Auth Handlers
// ---------------------------------------------------------------------------

/**
 * auth.login — Authenticate user with username + password.
 * Public endpoint (no token required).
 */
function handleLogin(data) {
  var username = String(data.username || "").trim().toLowerCase();
  var password = String(data.password || "");
  debugTrace("handleLogin.start", { username: username });

  if (!username || !password) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (String(row[USERS_COLS.username]).toLowerCase() !== username) continue;

    // Check account status
    var status = row[USERS_COLS.status];
    if (status !== "active") {
      // Return same message for all non-active states to prevent enumeration
      return { success: false, error: "Invalid credentials" };
    }

    // Verify password
    var salt = row[USERS_COLS.password_salt];
    var storedHash = row[USERS_COLS.password_hash];
    if (!verifyPassword(password, salt, storedHash)) {
      return { success: false, error: "Invalid credentials" };
    }

    // Generate session
    var sessionToken = Utilities.getUuid();
    var expiresAt = new Date(
      Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
    );

    // Update session in sheet
    var rowNum = i + 1;
    sheet.getRange(rowNum, USERS_COLS.session_token + 1).setValue(sessionToken);
    sheet
      .getRange(rowNum, USERS_COLS.session_expires + 1)
      .setValue(expiresAt.toISOString());
    sheet
      .getRange(rowNum, USERS_COLS.last_login + 1)
      .setValue(new Date().toISOString());

    // Check if password reset was forced
    var forceChange =
      row.length > USERS_COLS.force_change &&
      String(row[USERS_COLS.force_change]) === "Y";

    var hospCode = String(row[USERS_COLS.hosp_code]);

    return {
      success: true,
      data: {
        token: sessionToken,
        user_id: row[USERS_COLS.user_id],
        username: username,
        hosp_code: hospCode,
        first_name: row[USERS_COLS.first_name],
        last_name: row[USERS_COLS.last_name],
        role: row[USERS_COLS.role],
        hosp_name: getHospName(hospCode),
        force_change: forceChange,
      },
    };
  }

  return { success: false, error: "Invalid credentials" };
}

/**
 * auth.register — Register a new user. Status = pending until admin approves.
 * Public endpoint (no token required).
 */
function handleRegister(data) {
  debugTrace("handleRegister.start");
  var username = String(data.username || "").trim().toLowerCase();
  var hospCode = String(data.hosp_code || "").trim();
  var password = String(data.password || "");
  var firstName = String(data.first_name || "").trim();
  var lastName = String(data.last_name || "").trim();
  var tel = String(data.tel || "").trim();

  // Validate required fields
  if (!username || !hospCode || !password || !firstName || !lastName || !tel) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  // Validate username format: 4-20 chars, lowercase a-z, 0-9, underscore only
  if (username.length < 4 || username.length > 20) {
    return { success: false, error: "ชื่อผู้ใช้ต้องมี 4-20 ตัวอักษร" };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { success: false, error: "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9 และ _" };
  }

  // Reserved usernames
  var RESERVED = ["admin", "root", "system", "moderator", "superadmin",
    "administrator", "support", "help", "test", "guest",
    "null", "undefined", "delete", "remove", "reset"];
  if (RESERVED.indexOf(username) !== -1) {
    return { success: false, error: "ชื่อผู้ใช้นี้ไม่อนุญาตให้ใช้งาน" };
  }

  if (hospCode.length !== 5 || !/^\d{5}$/.test(hospCode)) {
    return { success: false, error: "รหัสสถานพยาบาลไม่ถูกต้อง" };
  }
  if (password.length < 8) {
    return { success: false, error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (!/^[0-9]{9,10}$/.test(tel)) {
    return { success: false, error: "เบอร์โทรไม่ถูกต้อง" };
  }

  var ss = getSpreadsheet();
  var usersSheet = ss.getSheetByName("USERS");
  var userRows = usersSheet.getDataRange().getValues();

  // Check username uniqueness (case-insensitive)
  for (var k = 1; k < userRows.length; k++) {
    if (String(userRows[k][USERS_COLS.username]).toLowerCase() === username) {
      return { success: false, error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" };
    }
  }

  // Verify hosp_code exists and is active
  var hospitalSheet = ss.getSheetByName("HOSPITAL");
  var hospitalRows = hospitalSheet.getDataRange().getValues();
  var hospFound = false;
  var hospType = "";

  for (var i = 1; i < hospitalRows.length; i++) {
    if (String(hospitalRows[i][HOSPITAL_COLS.hosp_code]) === hospCode) {
      if (hospitalRows[i][HOSPITAL_COLS.active] !== "Y") {
        return { success: false, error: "Facility not active" };
      }
      hospFound = true;
      hospType = hospitalRows[i][HOSPITAL_COLS.hosp_type];
      break;
    }
  }

  if (!hospFound) {
    return { success: false, error: "Invalid hosp_code" };
  }

  // Role is blank at registration — admin assigns role during approval.
  // Exception: first user in system with hosp_type "สสอ." → auto-approve as super_admin.
  var isFirstUser = (usersSheet.getLastRow() === 1); // only header row exists
  var isSuperAdminType = (hospType === "สสอ.");
  var autoApprove = isFirstUser && isSuperAdminType;
  var role = autoApprove ? "super_admin" : "";
  var initialStatus = autoApprove ? "active" : "pending";

  // Hash password
  var salt = generateSalt();
  var hash = hashPassword(password, salt);

  // Insert new user
  var userId = Utilities.getUuid();
  var newRow = [
    userId, // user_id
    username, // username
    String(hospCode), // hosp_code
    firstName, // first_name
    lastName, // last_name
    String(tel), // tel
    hash, // password_hash
    salt, // password_salt
    role, // role: blank (pending) or super_admin (auto-approved first user)
    initialStatus, // status: active for first super_admin, pending otherwise
    "", // approved_by
    "", // session_token
    "", // session_expires
    new Date().toISOString(), // created_at
    "", // last_login
    "", // force_change
  ];

  var userNewRow = usersSheet.getLastRow() + 1;
  ensureTextFormat("USERS", userNewRow);
  usersSheet.getRange(userNewRow, 1, 1, newRow.length).setValues([newRow]);

  // --- Immediate Telegram notification for new user registration ---
  try {
    var regSettings = getSettingsMap();
    if (regSettings.notify_new_user === "Y" && regSettings.bot_token && regSettings.chat_id) {
      var regSystemName = regSettings.system_name || "Telemed Tracking";
      var regMessage = "<b>" + regSystemName + "</b>\n";
      regMessage += "ผู้ใช้ใหม่ลงทะเบียน\n\n";
      regMessage += "ชื่อผู้ใช้: " + username + "\n";
      regMessage += "รหัส รพ.: " + hospCode + "\n";
      regMessage += "ชื่อ: " + firstName + " " + lastName + "\n";
      regMessage += "เบอร์โทร: " + tel + "\n";
      regMessage += "สถานะ: " + (autoApprove ? "อนุมัติอัตโนมัติ (super_admin)" : "รออนุมัติ");
      sendTelegramMessage(regSettings, regMessage);
    }
  } catch (notifyErr) {
    // Notification failure must never break registration
  }

  var message = autoApprove
    ? "Registration successful. You can now log in."
    : "Registration submitted. Awaiting admin approval.";

  return {
    success: true,
    data: { message: message, auto_approved: autoApprove },
  };
}

/**
 * auth.logout — Clear session token.
 * Authenticated endpoint.
 */
function handleLogout(user) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");

  sheet.getRange(user.rowIndex, USERS_COLS.session_token + 1).setValue("");
  sheet.getRange(user.rowIndex, USERS_COLS.session_expires + 1).setValue("");

  return { success: true, data: { message: "Logged out" } };
}

/**
 * auth.changePassword — POST, change own password.
 * Authenticated endpoint. Clears force_change flag.
 */
function handleChangePassword(user, data) {
  var currentPassword = String(data.current_password || "");
  var newPassword = String(data.new_password || "");

  if (!currentPassword) {
    return { success: false, error: "กรุณากรอกรหัสผ่านปัจจุบัน" };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  var row = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Verify current password
  var salt = row[USERS_COLS.password_salt];
  var storedHash = row[USERS_COLS.password_hash];
  if (!verifyPassword(currentPassword, salt, storedHash)) {
    return { success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  // Prevent reusing same password (skip check during forced reset)
  var isForcedChange = row.length > USERS_COLS.force_change &&
    String(row[USERS_COLS.force_change]) === "Y";
  if (!isForcedChange && currentPassword === newPassword) {
    return { success: false, error: "รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านปัจจุบัน" };
  }

  var newSalt = generateSalt();
  var newHash = hashPassword(newPassword, newSalt);

  sheet.getRange(user.rowIndex, USERS_COLS.password_hash + 1).setValue(newHash);
  sheet.getRange(user.rowIndex, USERS_COLS.password_salt + 1).setValue(newSalt);
  // Clear force_change flag
  if (sheet.getLastColumn() >= USERS_COLS.force_change + 1) {
    sheet.getRange(user.rowIndex, USERS_COLS.force_change + 1).setValue("");
  }

  appendAuditLog(user, "UPDATE", "USERS", user.user_id, null, {
    action: "password_change",
  });

  return { success: true, data: { message: "Password changed" } };
}

// ---------------------------------------------------------------------------
// Password Hashing (Research R1: Iterated HMAC-SHA256)
// ---------------------------------------------------------------------------

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, "").substring(0, 32);
}

function hashPassword(password, salt) {
  var hash = Utilities.computeHmacSha256Signature(password, salt);
  var hex = bytesToHex(hash);
  for (var i = 1; i < HASH_ITERATIONS; i++) {
    hash = Utilities.computeHmacSha256Signature(hex + password, salt);
    hex = bytesToHex(hash);
  }
  return hex;
}

function verifyPassword(password, salt, storedHash) {
  var computed = hashPassword(password, salt);
  return constantTimeEquals(computed, storedHash);
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function bytesToHex(bytes) {
  return bytes
    .map(function (b) {
      return ("0" + (b & 0xff).toString(16)).slice(-2);
    })
    .join("");
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Action Router (stubs for future modules)
// ---------------------------------------------------------------------------

function routeAction(action, data, user) {
  var routes = {
    "auth.logout": function () {
      return handleLogout(user);
    },
    "auth.changePassword": function () {
      return handleChangePassword(user, data);
    },
    "facilities.list": function () {
      return handleFacilitiesList(user, data);
    },
    "equipment.list": function () {
      return handleEquipmentList(user, data);
    },
    "equipment.save": function () {
      return handleEquipmentSave(user, data);
    },
    "equipment.delete": function () {
      return handleEquipmentDelete(user, data);
    },
    "masterDrug.list": function () {
      return handleMasterDrugList(user, data);
    },
    "masterDrug.save": function () {
      return handleMasterDrugSave(user, data);
    },
    "masterDrug.delete": function () {
      return handleMasterDrugDelete(user, data);
    },
    "masterDrug.import": function () {
      return handleMasterDrugImport(user, data);
    },
    "schedule.list": function () {
      return handleScheduleList(user, data);
    },
    "schedule.save": function () {
      return handleScheduleSave(user, data);
    },
    "schedule.setLink": function () {
      return handleScheduleSetLink(user, data);
    },
    "schedule.recordIncident": function () {
      return handleScheduleRecordIncident(user, data);
    },
    "readiness.list": function () {
      return handleReadinessList(user, data);
    },
    "readiness.save": function () {
      return handleReadinessSave(user, data);
    },
    "import.preview": function () {
      return handleImportPreview(user, data);
    },
    "appointment.register": function () {
      return handleAppointmentRegister(user, data);
    },
    "import.confirm": function () {
      return handleImportConfirm(user, data);
    },
    "visitSummary.list": function () {
      return handleVisitSummaryList(user, data);
    },
    "visitSummary.updateTel": function () {
      return handleVisitSummaryUpdateTel(user, data);
    },
    "visitMeds.list": function () {
      return handleVisitMedsList(user, data);
    },
    "visitMeds.save": function () {
      return handleVisitMedsSave(user, data);
    },
    "visitMeds.batchConfirm": function () {
      return handleVisitMedsBatchConfirm(user, data);
    },
    "visitMeds.trackDelivery": function () {
      return handleVisitMedsTrackDelivery(user, data);
    },
    "followup.list": function () {
      return handleFollowupList(user, data);
    },
    "followup.save": function () {
      return handleFollowupSave(user, data);
    },
    "followup.update": function () {
      return handleFollowupUpdate(user, data);
    },
    "followup.delete": function () {
      return handleFollowupDelete(user, data);
    },
    "users.list": function () {
      return handleUsersList(user, data);
    },
    "users.approve": function () {
      return handleUsersApprove(user, data);
    },
    "users.update": function () {
      return handleUsersUpdate(user, data);
    },
    "users.resetPassword": function () {
      return handleUsersResetPassword(user, data);
    },
    "settings.get": function () {
      return handleSettingsGet(user);
    },
    "settings.save": function () {
      return handleSettingsSave(user, data);
    },
    "auditLog.list": function () {
      return handleAuditLogList(user, data);
    },
    "system.verify": function () {
      if (user.role !== "super_admin") {
        return { success: false, error: "Forbidden" };
      }
      var report = verifySheetHeaders();
      return { success: true, data: report };
    },
    "system.dumpUsers": function () {
      if (user.role !== "super_admin") {
        return { success: false, error: "Forbidden" };
      }
      var ss = getSpreadsheet();
      var sheet = ss.getSheetByName("USERS");
      var data = sheet.getDataRange().getValues();
      var headers = SHEET_HEADERS.USERS;
      var rows = [];
      for (var i = 1; i < data.length; i++) {
        var cells = {};
        for (var c = 0; c < headers.length; c++) {
          cells[headers[c]] = String(data[i][c] || "");
        }
        rows.push({ row: i + 1, cells: cells });
      }
      return { success: true, data: { headers: headers, rows: rows } };
    },
  };

  var handler = routes[action];
  if (!handler) {
    return { success: false, error: "Unknown action: " + action };
  }

  debugTrace("routeAction.dispatch", { action: action, user_role: user.role });
  var result = handler();
  debugTrace("routeAction.complete", { action: action, success: result.success !== false });
  return result;
}

// ---------------------------------------------------------------------------
// Dashboard Stub (for health check / future implementation)
// ---------------------------------------------------------------------------

/**
 * dashboard.stats — GET, public (no token required).
 * Returns aggregate statistics with NO patient-identifiable data.
 * CRITICAL: Must never include names, phone, VN, HN, or individual drug lists.
 */
/**
 * hospital.list — GET, public (no token required).
 * Returns active hospitals for dropdown selects on Login/Register pages.
 * Safe: no sensitive data exposed.
 */
function handleHospitalList() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("HOSPITAL");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][HOSPITAL_COLS.hosp_code]);
    var active = String(data[i][HOSPITAL_COLS.active]);
    if (active !== "Y") continue;

    results.push({
      hosp_code: code,
      hosp_name: String(data[i][HOSPITAL_COLS.hosp_name]),
      hosp_type: String(data[i][HOSPITAL_COLS.hosp_type]),
    });
  }

  results.sort(function (a, b) {
    return a.hosp_name.localeCompare(b.hosp_name, "th");
  });

  return { success: true, data: results };
}

function handleDashboardStats() {
  var ss = getSpreadsheet();
  var facilitiesMap = getFacilitiesMap();
  var facilityCodes = Object.keys(facilitiesMap);

  // ---- Read each sheet ONCE and reuse ----
  var rlSheet = ss.getSheetByName("READINESS_LOG");
  var rlData = rlSheet ? rlSheet.getDataRange().getValues() : [];

  var csSheet = ss.getSheetByName("CLINIC_SCHEDULE");
  var csData = csSheet ? csSheet.getDataRange().getValues() : [];

  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  var vsData = vsSheet ? vsSheet.getDataRange().getValues() : [];

  var fuSheet = ss.getSheetByName("FOLLOWUP");

  // ---- 1. Equipment status: latest READINESS_LOG per facility ----
  var equipmentStatus = [];
  var latestReadiness = {}; // hosp_code -> { status, check_date }
  for (var r = 1; r < rlData.length; r++) {
    var rHospCode = String(rlData[r][READINESS_LOG_COLS.hosp_code]);
    var rCheckDate = toDateStr(rlData[r][READINESS_LOG_COLS.check_date]);
    var rStatus = String(rlData[r][READINESS_LOG_COLS.overall_status]);
    // Keep only the latest entry per facility
    if (
      !latestReadiness[rHospCode] ||
      rCheckDate > latestReadiness[rHospCode].check_date
    ) {
      latestReadiness[rHospCode] = { status: rStatus, check_date: rCheckDate };
    }
  }

  for (var fc = 0; fc < facilityCodes.length; fc++) {
    var code = facilityCodes[fc];
    var readiness = latestReadiness[code];
    equipmentStatus.push({
      hosp_code: code,
      hosp_name: facilitiesMap[code],
      status: readiness ? readiness.status : "unknown",
      last_check_date: readiness ? readiness.check_date : "",
    });
  }

  // ---- 2. Upcoming appointments: next 7 days from CLINIC_SCHEDULE ----
  var upcomingAppointments = [];
  var today = new Date();
  var sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  var todayStr = today.toISOString().split("T")[0];
  var laterStr = sevenDaysLater.toISOString().split("T")[0];

  for (var c = 1; c < csData.length; c++) {
    var serviceDate = toDateStr(csData[c][CLINIC_SCHEDULE_COLS.service_date]);
    if (serviceDate >= todayStr && serviceDate <= laterStr) {
      var csHospCode = String(csData[c][CLINIC_SCHEDULE_COLS.hosp_code]);
      upcomingAppointments.push({
        service_date: serviceDate,
        hosp_name: facilitiesMap[csHospCode] || getHospName(csHospCode),
        clinic_type: String(csData[c][CLINIC_SCHEDULE_COLS.clinic_type]),
        service_time: String(
          csData[c][CLINIC_SCHEDULE_COLS.service_time] || "",
        ),
        appoint_count:
          Number(csData[c][CLINIC_SCHEDULE_COLS.appoint_count]) || 0,
      });
    }
  }

  upcomingAppointments.sort(function (a, b) {
    return a.service_date.localeCompare(b.service_date);
  });

  // ---- 3. Monthly sessions: count distinct schedules per month ----
  var monthlySessions = {};
  for (var ms = 1; ms < csData.length; ms++) {
    var msDate = toDateStr(csData[ms][CLINIC_SCHEDULE_COLS.service_date]);
    var monthKey = msDate.substring(0, 7); // YYYY-MM
    if (monthKey.length === 7) {
      monthlySessions[monthKey] = (monthlySessions[monthKey] || 0) + 1;
    }
  }

  // ---- 4. Attendance by facility (ผู้ใช้บริการ) ----
  var attendanceByFacility = [];
  var facilityAttMap = {}; // hosp_code -> { appointed, attended }

  // Build appoint_count lookup from CLINIC_SCHEDULE (reuse csData)
  var scheduleAppointments = {}; // date|code -> appoint_count
  for (var sa = 1; sa < csData.length; sa++) {
    var saDate = toDateStr(csData[sa][CLINIC_SCHEDULE_COLS.service_date]);
    var saHosp = String(csData[sa][CLINIC_SCHEDULE_COLS.hosp_code]);
    var saKey = saDate + "|" + saHosp;
    scheduleAppointments[saKey] =
      (scheduleAppointments[saKey] || 0) +
      (Number(csData[sa][CLINIC_SCHEDULE_COLS.appoint_count]) || 0);
  }

  // Count attended from VISIT_SUMMARY (reuse vsData)
  for (var va = 1; va < vsData.length; va++) {
    var vsHosp = String(vsData[va][VISIT_SUMMARY_COLS.hosp_code]);
    var vsAttended = String(vsData[va][VISIT_SUMMARY_COLS.attended]);

    if (!facilityAttMap[vsHosp])
      facilityAttMap[vsHosp] = { appointed: 0, attended: 0 };
    if (vsAttended === "Y") facilityAttMap[vsHosp].attended++;
  }

  // Add appoint_count from schedules to facility map
  for (var sk in scheduleAppointments) {
    var parts = sk.split("|");
    var sCode = parts[1] || "";
    if (sCode) {
      if (!facilityAttMap[sCode])
        facilityAttMap[sCode] = { appointed: 0, attended: 0 };
      facilityAttMap[sCode].appointed += scheduleAppointments[sk];
    }
  }

  // Build attendance array
  var facAttKeys = Object.keys(facilityAttMap);
  for (var fk = 0; fk < facAttKeys.length; fk++) {
    var fKey = facAttKeys[fk];
    var fTotal = facilityAttMap[fKey].appointed;
    var fAttended = facilityAttMap[fKey].attended;
    attendanceByFacility.push({
      hosp_name: facilitiesMap[fKey] || getHospName(fKey),
      total_appointed: fTotal,
      total_attended: fAttended,
      rate: fTotal > 0 ? Math.round((fAttended / fTotal) * 1000) / 10 : 0,
    });
  }

  attendanceByFacility.sort(function (a, b) {
    return b.rate - a.rate;
  });

  // ---- 5. Followup pipeline ----
  var followupPipeline = { followed: 0, pending: 0 };
  // Build VN set from FOLLOWUP sheet (guard: skip if sheet missing)
  var fuVNSet = {};
  if (fuSheet) {
    var fuData = fuSheet.getDataRange().getValues();
    for (var fp = 1; fp < fuData.length; fp++) {
      fuVNSet[String(fuData[fp][FOLLOWUP_COLS.vn])] = true;
    }
  }

  // Count confirmed visits with/without followup (reuse vsData)
  for (var vp = 1; vp < vsData.length; vp++) {
    if (String(vsData[vp][VISIT_SUMMARY_COLS.dispensing_confirmed]) === "Y") {
      var vpVN = String(vsData[vp][VISIT_SUMMARY_COLS.vn]);
      if (fuVNSet[vpVN]) {
        followupPipeline.followed++;
      } else {
        followupPipeline.pending++;
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
      attendance_by_facility: attendanceByFacility,
      followup_pipeline: followupPipeline,
    },
  };
}

// ---------------------------------------------------------------------------
// Audit Log Helper
// ---------------------------------------------------------------------------

/**
 * Append an entry to AUDIT_LOG sheet. Append-only, never modifies existing rows.
 */
function appendAuditLog(user, action, module, targetId, oldValue, newValue) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("AUDIT_LOG");
  if (!sheet) return; // Guard: sheet may not exist yet

  sheet.appendRow([
    Utilities.getUuid(), // log_id
    user.user_id, // user_id
    action, // action (CREATE, UPDATE, DELETE)
    module, // module name
    targetId || "", // target_id
    oldValue ? JSON.stringify(oldValue) : "", // old_value
    newValue ? JSON.stringify(newValue) : "", // new_value
    new Date().toISOString(), // created_at
  ]);
  ensureTextFormat("AUDIT_LOG", sheet.getLastRow());
}

// ---------------------------------------------------------------------------
// Facility Lookup Helper
// ---------------------------------------------------------------------------

/**
 * Build a lookup map of hosp_code → hosp_name from FACILITIES sheet.
 */
function getFacilitiesMap() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("FACILITIES");
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][FACILITIES_COLS.hosp_code]);
    if (code) map[code] = data[i][FACILITIES_COLS.hosp_name];
  }
  return map;
}

/**
 * Get map of all hospitals (HOSPITAL sheet) — includes รพ., รพ.สต., สสอ.
 * Returns { hosp_code: { name, type } }
 */
function getHospitalsMap() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("HOSPITAL");
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][HOSPITAL_COLS.hosp_code]);
    var active = String(data[i][HOSPITAL_COLS.active]);
    if (code && active === "Y") {
      map[code] = {
        name: String(data[i][HOSPITAL_COLS.hosp_name]),
        type: String(data[i][HOSPITAL_COLS.hosp_type]),
      };
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Facilities Handlers
// ---------------------------------------------------------------------------

/**
 * facilities.list — GET, returns list of active facilities.
 * Used by frontend for dropdown selects (replaces deriving from equipment data).
 * - staff_hsc: only own facility
 * - staff_hosp+: all active facilities
 */
function handleFacilitiesList(user, params) {
  var facilitiesMap = getFacilitiesMap();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("FACILITIES");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][FACILITIES_COLS.hosp_code]);
    var active = String(data[i][FACILITIES_COLS.active]);

    if (active === "N") continue;

    // staff_hsc can only see own facility
    if (user.role === "staff_hsc" && code !== user.hosp_code) continue;

    results.push({
      hosp_code: code,
      hosp_name: String(data[i][FACILITIES_COLS.hosp_name]),
    });
  }

  // Sort by hosp_name (Thai locale)
  results.sort(function (a, b) {
    return a.hosp_name.localeCompare(b.hosp_name, "th");
  });

  return { success: true, data: results };
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
  var statusFilter = params.status || "";

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("EQUIPMENT");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var hospitalsMap = getHospitalsMap();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var equipStatus = row[EQUIPMENT_COLS.status];
    var equipHospCode = String(row[EQUIPMENT_COLS.hosp_code]);

    // Role-based visibility
    if (user.role === "staff_hsc") {
      // staff_hsc sees only own facility
      if (equipHospCode !== user.hosp_code) continue;
      // Exclude inactive equipment
      if (equipStatus === "inactive") continue;
    } else {
      // staff_hosp and above see all, but respect status filter
      if (statusFilter && equipStatus !== statusFilter) continue;
      // Always exclude inactive unless explicitly filtering for it
      if (!statusFilter && equipStatus === "inactive") continue;
    }

    var hospName = (hospitalsMap[equipHospCode] && hospitalsMap[equipHospCode].name) || "";

    results.push({
      equip_id: row[EQUIPMENT_COLS.equip_id],
      hosp_code: equipHospCode,
      set_type: row[EQUIPMENT_COLS.set_type],
      device_type: row[EQUIPMENT_COLS.device_type],
      os: row[EQUIPMENT_COLS.os] || "",
      status: equipStatus,
      is_backup: row[EQUIPMENT_COLS.is_backup] || "N",
      software: row[EQUIPMENT_COLS.software] || "",
      internet_mbps:
        row[EQUIPMENT_COLS.internet_mbps] !== "" &&
        row[EQUIPMENT_COLS.internet_mbps] != null
          ? Number(row[EQUIPMENT_COLS.internet_mbps])
          : null,
      responsible_person: row[EQUIPMENT_COLS.responsible_person] || "",
      responsible_tel: row[EQUIPMENT_COLS.responsible_tel] || "",
      note: row[EQUIPMENT_COLS.note] || "",
      updated_at: row[EQUIPMENT_COLS.updated_at] || "",
      updated_by: row[EQUIPMENT_COLS.updated_by] || "",
      hosp_name: hospName,
    });
  }

  return { success: true, data: results };
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
  debugTrace("handleEquipmentSave.start", { hosp_code: String(data.hosp_code || ""), equip_id: String(data.equip_id || "") });
  var equipId = String(data.equip_id || "").trim();
  var hospCode = String(data.hosp_code || "").trim();

  if (!hospCode) {
    return { success: false, error: "hosp_code is required" };
  }

  // H6: Validate hosp_code exists in HOSPITAL (not FACILITIES — equipment can belong to รพ. too)
  var hospitalsMap = getHospitalsMap();
  if (!hospitalsMap[hospCode]) {
    return { success: false, error: "Invalid hosp_code: hospital not found" };
  }
  // สสอ. manages equipment but does not own it
  if (hospitalsMap[hospCode].type === "สสอ.") {
    return { success: false, error: "Cannot assign equipment to สสอ." };
  }

  // Ownership validation: staff_hsc can only save for own facility
  if (user.role === "staff_hsc" && hospCode !== user.hosp_code) {
    return {
      success: false,
      error: "You can only manage equipment for your own facility",
    };
  }

  // Validate required fields
  var setType = String(data.set_type || "");
  var deviceType = String(data.device_type || "");
  var status = String(data.status || "");

  if (!setType || (setType !== "A" && setType !== "B")) {
    return { success: false, error: "set_type must be A or B" };
  }
  if (!deviceType) {
    return { success: false, error: "device_type is required" };
  }
  // C3: Validate device_type is a recognized value
  var validDeviceTypes = ["computer", "notebook", "camera", "mic"];
  if (validDeviceTypes.indexOf(deviceType) === -1) {
    return { success: false, error: "Invalid device_type" };
  }
  // C3: Validate set_type / device_type relationship
  if (setType === "B" && deviceType !== "notebook") {
    return { success: false, error: "Set B device_type must be notebook" };
  }
  if (setType === "A" && deviceType === "notebook") {
    return { success: false, error: "Set A device_type cannot be notebook" };
  }
  if (
    !status ||
    (status !== "ready" && status !== "maintenance" && status !== "broken")
  ) {
    return {
      success: false,
      error: "status must be ready, maintenance, or broken",
    };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("EQUIPMENT");

  var now = new Date().toISOString();
  var isNew = !equipId;

  var oldValues = null;

  if (isNew) {
    equipId = Utilities.getUuid();
  } else {
    // Find existing row for update + audit
    var rows = sheet.getDataRange().getValues();
    var foundRow = -1;

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][EQUIPMENT_COLS.equip_id] === equipId) {
        foundRow = i + 1; // 1-based
        oldValues = {
          hosp_code: String(rows[i][EQUIPMENT_COLS.hosp_code]),
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
        };
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: "Equipment not found" };
    }

    // Ownership check for update
    if (user.role === "staff_hsc") {
      var existingHospCode = String(rows[foundRow - 1][EQUIPMENT_COLS.hosp_code]);
      if (existingHospCode !== user.hosp_code) {
        return {
          success: false,
          error: "You can only update equipment for your own facility",
        };
      }
    }
  }

  // Build row data
  var internetMbps =
    data.internet_mbps != null ? Number(data.internet_mbps) : "";
  var rowData = [
    equipId,
    String(hospCode),
    setType,
    deviceType,
    String(data.os || ""),
    status,
    String(data.is_backup || "N"),
    String(data.software || ""),
    internetMbps,
    String(data.responsible_person || ""),
    String(data.responsible_tel || ""),
    String(data.note || ""),
    now,
    user.user_id,
  ];

  if (isNew) {
    var newRow = sheet.getLastRow() + 1;
    var range = sheet.getRange(newRow, 1, 1, rowData.length);
    // Set text format BEFORE writing to preserve leading zeros
    ensureTextFormat("EQUIPMENT", newRow);
    range.setValues([rowData]);
  } else {
    // Update existing row — foundRow is 1-based
    var updateRange = sheet.getRange(foundRow, 1, 1, rowData.length);
    // Set text format BEFORE writing to preserve leading zeros
    ensureTextFormat("EQUIPMENT", foundRow);
    updateRange.setValues([rowData]);
  }

  // Audit log — H5: symmetric old/new values
  var newValues = {
    hosp_code: hospCode,
    set_type: setType,
    device_type: deviceType,
    os: String(data.os || ""),
    status: status,
    is_backup: String(data.is_backup || "N"),
    software: String(data.software || ""),
    internet_mbps: internetMbps,
    responsible_person: String(data.responsible_person || ""),
    responsible_tel: String(data.responsible_tel || ""),
    note: String(data.note || ""),
  };
  appendAuditLog(
    user,
    isNew ? "CREATE" : "UPDATE",
    "EQUIPMENT",
    equipId,
    oldValues,
    newValues,
  );

  return { success: true, data: { equip_id: equipId } };
}

/**
 * equipment.delete — POST, soft-delete (set status=inactive).
 * - staff_hsc can only delete own facility's equipment
 * - Never removes row, sets status=inactive
 * - AUDIT_LOG entry
 */
function handleEquipmentDelete(user, data) {
  var equipId = String(data.equip_id || "").trim();

  if (!equipId) {
    return { success: false, error: "equip_id is required" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("EQUIPMENT");
  var rows = sheet.getDataRange().getValues();

  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][EQUIPMENT_COLS.equip_id] === equipId) {
      foundRow = i + 1; // 1-based
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, error: "Equipment not found" };
  }

  var existingRow = rows[foundRow - 1];

  // Ownership validation for staff_hsc
  if (user.role === "staff_hsc") {
    var equipHospCode = String(existingRow[EQUIPMENT_COLS.hosp_code]);
    if (equipHospCode !== user.hosp_code) {
      return {
        success: false,
        error: "You can only delete equipment for your own facility",
      };
    }
  }

  // Check if already inactive
  if (existingRow[EQUIPMENT_COLS.status] === "inactive") {
    return { success: false, error: "Equipment is already inactive" };
  }

  // Soft delete: set status = inactive, update timestamp
  var now = new Date().toISOString();
  sheet.getRange(foundRow, EQUIPMENT_COLS.status + 1).setValue("inactive");
  sheet.getRange(foundRow, EQUIPMENT_COLS.updated_at + 1).setValue(now);
  sheet
    .getRange(foundRow, EQUIPMENT_COLS.updated_by + 1)
    .setValue(user.user_id);

  // Audit log
  var oldValues = {
    status: existingRow[EQUIPMENT_COLS.status],
    hosp_code: String(existingRow[EQUIPMENT_COLS.hosp_code]),
    set_type: existingRow[EQUIPMENT_COLS.set_type],
    device_type: existingRow[EQUIPMENT_COLS.device_type],
  };
  appendAuditLog(user, "DELETE", "EQUIPMENT", equipId, oldValues, {
    status: "inactive",
  });

  return { success: true, data: { message: "Equipment deactivated" } };
}

// ---------------------------------------------------------------------------
// Master Drug Handlers
// ---------------------------------------------------------------------------

/**
 * masterDrug.list — GET, with optional active/search filters.
 * All authenticated users can list drugs (used in Module 5 dropdowns).
 */
function handleMasterDrugList(user, params) {
  var activeFilter = params.active || "";
  var searchFilter = String(params.search || "").toLowerCase();

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("MASTER_DRUGS");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var active = row[MASTER_DRUG_COLS.active];

    // Active filter
    if (activeFilter && active !== activeFilter) continue;

    // Search filter on drug_name
    if (searchFilter) {
      var drugName = String(row[MASTER_DRUG_COLS.drug_name]).toLowerCase();
      if (drugName.indexOf(searchFilter) === -1) continue;
    }

    results.push({
      drug_id: row[MASTER_DRUG_COLS.drug_id],
      drug_name: row[MASTER_DRUG_COLS.drug_name],
      strength: row[MASTER_DRUG_COLS.strength],
      unit: row[MASTER_DRUG_COLS.unit],
      active: active,
    });
  }

  // Sort by drug_name
  results.sort(function (a, b) {
    return a.drug_name.localeCompare(b.drug_name, "th");
  });

  return { success: true, data: results };
}

/**
 * masterDrug.save — POST, create or update drug.
 * Access: super_admin, admin_hosp only.
 * FK check: cannot change drug_name if referenced in VISIT_MEDS.
 */
function handleMasterDrugSave(user, data) {
  debugTrace("handleMasterDrugSave.start", { drug_name: String(data.drug_name || "") });
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var drugId = String(data.drug_id || "").trim();
  var drugName = String(data.drug_name || "").trim();
  var strength = String(data.strength || "").trim();
  var unit = String(data.unit || "").trim();

  if (!drugName) return { success: false, error: "drug_name is required" };
  if (!strength) return { success: false, error: "strength is required" };
  if (!unit) return { success: false, error: "unit is required" };

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("MASTER_DRUGS");
  var isNew = !drugId;
  var oldValues = null;

  // C1: Check for duplicate drug_name (case-insensitive) for new drugs
  var allRows = sheet.getDataRange().getValues();
  var drugNameLower = drugName.toLowerCase();
  for (var k = 1; k < allRows.length; k++) {
    var existingName = String(
      allRows[k][MASTER_DRUG_COLS.drug_name],
    ).toLowerCase();
    if (existingName === drugNameLower) {
      // For new drugs, always reject duplicates
      // For updates, reject only if the duplicate belongs to a different drug_id
      if (isNew || allRows[k][MASTER_DRUG_COLS.drug_id] !== drugId) {
        return { success: false, error: "Drug name already exists" };
      }
    }
  }

  if (isNew) {
    drugId = Utilities.getUuid();
  } else {
    // Find existing row
    var rows = sheet.getDataRange().getValues();
    var foundRow = -1;

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][MASTER_DRUG_COLS.drug_id] === drugId) {
        foundRow = i + 1;
        var oldDrugName = rows[i][MASTER_DRUG_COLS.drug_name];

        oldValues = {
          drug_name: oldDrugName,
          strength: rows[i][MASTER_DRUG_COLS.strength],
          unit: rows[i][MASTER_DRUG_COLS.unit],
          active: rows[i][MASTER_DRUG_COLS.active],
        };

        // FK check: cannot change drug_name if referenced in VISIT_MEDS
        if (oldDrugName !== drugName) {
          var visitMedsSheet = ss.getSheetByName("VISIT_MEDS");
          if (visitMedsSheet) {
            var medRows = visitMedsSheet.getDataRange().getValues();
            for (var j = 1; j < medRows.length; j++) {
              if (medRows[j][VISIT_MEDS_COLS.drug_name] === oldDrugName) {
                return {
                  success: false,
                  error: "Cannot change drug_name: referenced in VISIT_MEDS",
                };
              }
            }
          }
        }
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: "Drug not found" };
    }

    // M1: Batch update with single setValues call
    sheet
      .getRange(foundRow, MASTER_DRUG_COLS.drug_name + 1, 1, 3)
      .setValues([[drugName, strength, unit]]);
  }

  if (isNew) {
    var drugNewRow = sheet.getLastRow() + 1;
    ensureTextFormat("MASTER_DRUGS", drugNewRow);
    sheet.getRange(drugNewRow, 1, 1, 5).setValues([[drugId, drugName, strength, unit, "Y"]]);
  }

  // Audit log
  var newValues = {
    drug_name: drugName,
    strength: strength,
    unit: unit,
    active: isNew ? "Y" : oldValues.active,
  };
  appendAuditLog(
    user,
    isNew ? "CREATE" : "UPDATE",
    "MASTER_DRUGS",
    drugId,
    oldValues,
    newValues,
  );

  return { success: true, data: { drug_id: drugId } };
}

/**
 * masterDrug.delete — POST, soft-delete (set active=N).
 * Access: super_admin, admin_hosp only.
 */
function handleMasterDrugDelete(user, data) {
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var drugId = String(data.drug_id || "").trim();
  if (!drugId) return { success: false, error: "drug_id is required" };

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("MASTER_DRUGS");
  var rows = sheet.getDataRange().getValues();

  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][MASTER_DRUG_COLS.drug_id] === drugId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, error: "Drug not found" };
  }

  var existingRow = rows[foundRow - 1];

  // Already inactive
  if (existingRow[MASTER_DRUG_COLS.active] === "N") {
    return { success: false, error: "Drug is already inactive" };
  }

  // Soft delete: set active = N
  sheet.getRange(foundRow, MASTER_DRUG_COLS.active + 1).setValue("N");

  // Audit log
  var oldValues = {
    drug_name: existingRow[MASTER_DRUG_COLS.drug_name],
    strength: existingRow[MASTER_DRUG_COLS.strength],
    unit: existingRow[MASTER_DRUG_COLS.unit],
    active: existingRow[MASTER_DRUG_COLS.active],
  };
  appendAuditLog(user, "DELETE", "MASTER_DRUGS", drugId, oldValues, {
    active: "N",
  });

  return { success: true, data: { message: "Drug deactivated" } };
}

/**
 * masterDrug.import — POST, batch import drugs from Excel.
 * Access: super_admin, admin_hosp only.
 * Skips duplicates (by drug_name), validates required fields.
 */
function handleMasterDrugImport(user, data) {
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var drugs = data.drugs;
  if (!drugs || !drugs.length) {
    return { success: false, error: "No drugs provided" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("MASTER_DRUGS");

  // Build existing drug_name set for dedup — only ACTIVE drugs (H2)
  // Inactive drugs can be re-imported
  var existingRows = sheet.getDataRange().getValues();
  var existingNames = {};
  for (var i = 1; i < existingRows.length; i++) {
    if (existingRows[i][MASTER_DRUG_COLS.active] === "Y") {
      var name = String(
        existingRows[i][MASTER_DRUG_COLS.drug_name],
      ).toLowerCase();
      existingNames[name] = true;
    }
  }

  var imported = 0;
  var skipped = 0;
  var errors = [];
  var newRows = []; // H1: Collect rows for batch insert

  for (var j = 0; j < drugs.length; j++) {
    var drug = drugs[j];
    var drugName = String(drug.drug_name || "").trim();
    var strength = String(drug.strength || "").trim();
    var unit = String(drug.unit || "").trim();
    var active = String(drug.active || "Y").trim();

    // Validate required fields
    if (!drugName) {
      errors.push("Row " + (j + 1) + ": drug_name is empty");
      continue;
    }
    if (!strength) {
      errors.push(
        "Row " + (j + 1) + ': strength is empty for "' + drugName + '"',
      );
      continue;
    }
    if (!unit) {
      errors.push("Row " + (j + 1) + ': unit is empty for "' + drugName + '"');
      continue;
    }

    // Check duplicate
    if (existingNames[drugName.toLowerCase()]) {
      skipped++;
      continue;
    }

    // Collect for batch insert
    var newId = Utilities.getUuid();
    newRows.push([newId, drugName, strength, unit, active]);
    existingNames[drugName.toLowerCase()] = true;
    imported++;
  }

  // H1: Batch insert all new rows in a single setValues call
  if (newRows.length > 0) {
    var startRow = existingRows.length + 1;
    sheet.getRange(startRow, 1, newRows.length, 5).setValues(newRows);
    ensureTextFormat("MASTER_DRUGS", startRow, newRows.length);
  }

  // Audit log
  appendAuditLog(user, "IMPORT", "MASTER_DRUGS", "", null, {
    imported: imported,
    skipped: skipped,
    errors: errors.length,
  });

  return {
    success: true,
    data: {
      imported: imported,
      skipped: skipped,
      errors: errors,
    },
  };
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
  var monthFilter = params.month || "";
  var hospCodeFilter = params.hosp_code || "";
  var clinicTypeFilter = params.clinic_type || "";

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("CLINIC_SCHEDULE");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var facilitiesMap = getFacilitiesMap();

  // Build actual_count lookup from VISIT_SUMMARY (attended = Y)
  // Split comma-separated clinic_type so each type is counted separately
  var actualCountMap = {};
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  if (vsSheet) {
    var vsData = vsSheet.getDataRange().getValues();
    for (var v = 1; v < vsData.length; v++) {
      if (vsData[v][VISIT_SUMMARY_COLS.attended] === "Y") {
        var vsDate = toDateStr(vsData[v][VISIT_SUMMARY_COLS.service_date]);
        var vsHosp = String(vsData[v][VISIT_SUMMARY_COLS.hosp_code]);
        var vsClinics = splitClinicTypes(String(vsData[v][VISIT_SUMMARY_COLS.clinic_type]));
        for (var ci = 0; ci < vsClinics.length; ci++) {
          var countKey = vsDate + "|" + vsHosp + "|" + vsClinics[ci];
          actualCountMap[countKey] = (actualCountMap[countKey] || 0) + 1;
        }
      }
    }
  }

  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var serviceDate = toDateStr(row[CLINIC_SCHEDULE_COLS.service_date]);
    var hospCode = String(row[CLINIC_SCHEDULE_COLS.hosp_code]);
    var clinicType = String(row[CLINIC_SCHEDULE_COLS.clinic_type]);

    // staff_hsc: filter to own hosp_code
    if (user.role === "staff_hsc" && hospCode !== user.hosp_code) continue;

    // Month filter (YYYY-MM)
    if (monthFilter && serviceDate.substring(0, 7) !== monthFilter) continue;

    // Hosp code filter
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue;

    // Clinic type filter
    if (clinicTypeFilter && clinicType !== clinicTypeFilter) continue;

    // Compute actual_count
    var countKey = serviceDate + "|" + hospCode + "|" + clinicType;
    var actualCount = actualCountMap[countKey] || 0;

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode);

    results.push({
      schedule_id: row[CLINIC_SCHEDULE_COLS.schedule_id],
      service_date: serviceDate,
      hosp_code: hospCode,
      hosp_name: hospName,
      clinic_type: clinicType,
      service_time: row[CLINIC_SCHEDULE_COLS.service_time],
      appoint_count: Number(row[CLINIC_SCHEDULE_COLS.appoint_count]) || 0,
      telemed_link: row[CLINIC_SCHEDULE_COLS.telemed_link] || "",
      link_added_by: row[CLINIC_SCHEDULE_COLS.link_added_by] || null,
      incident_note: row[CLINIC_SCHEDULE_COLS.incident_note] || "",
      updated_at: row[CLINIC_SCHEDULE_COLS.updated_at] || "",
      drug_delivery_date: toDateStr(row[CLINIC_SCHEDULE_COLS.drug_delivery_date]) || "",
      actual_count: actualCount,
    });
  }

  // Sort by service_date, then hosp_name
  results.sort(function (a, b) {
    var dateCmp = a.service_date.localeCompare(b.service_date);
    if (dateCmp !== 0) return dateCmp;
    return (a.hosp_name || "").localeCompare(b.hosp_name || "", "th");
  });

  return { success: true, data: results };
}

/**
 * schedule.save — POST, create or update schedule.
 * Access: super_admin, admin_hosp only.
 */
function handleScheduleSave(user, data) {
  debugTrace("handleScheduleSave.start", { service_date: String(data.service_date || ""), hosp_code: String(data.hosp_code || "") });
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var scheduleId = String(data.schedule_id || "").trim();
  var serviceDate = String(data.service_date || "").trim();
  var hospCode = String(data.hosp_code || "").trim();
  var clinicType = String(data.clinic_type || "").trim();
  var serviceTime = String(data.service_time || "").trim();
  var appointCount = Number(data.appoint_count) || 0;
  var drugDeliveryDate = String(data.drug_delivery_date || "").trim();

  if (!serviceDate)
    return { success: false, error: "service_date is required" };
  if (!hospCode) return { success: false, error: "hosp_code is required" };
  if (!clinicType) return { success: false, error: "clinic_type is required" };
  if (!serviceTime)
    return { success: false, error: "service_time is required" };

  // Validate clinic_type against allowed values
  var validClinicTypes = [
    "PCU-DM", "PCU-HT", "ANC-nutrition", "ANC-parent",
    "postpartum-EPI", "postpartum-dev",
  ];
  if (validClinicTypes.indexOf(clinicType) === -1) {
    return { success: false, error: "Invalid clinic_type: " + clinicType };
  }

  var ss = getSpreadsheet();

  // Validate hosp_code exists in HOSPITAL or FACILITIES
  var facilitiesMap = getFacilitiesMap();
  var hospSheet = ss.getSheetByName("HOSPITAL");
  var hospFound = false;
  if (hospSheet) {
    var hospData = hospSheet.getDataRange().getValues();
    for (var h = 1; h < hospData.length; h++) {
      if (String(hospData[h][HOSPITAL_COLS.hosp_code]) === hospCode) {
        hospFound = true;
        break;
      }
    }
  }
  if (!hospFound && !facilitiesMap[hospCode]) {
    return { success: false, error: "Invalid hosp_code: facility not found" };
  }
  var sheet = ss.getSheetByName("CLINIC_SCHEDULE");
  var now = new Date().toISOString();
  var isNew = !scheduleId;
  var oldValues = null;

  if (isNew) {
    scheduleId = Utilities.getUuid();
  } else {
    // Find existing row for update + audit
    var rows = sheet.getDataRange().getValues();
    var foundRow = -1;

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][CLINIC_SCHEDULE_COLS.schedule_id] === scheduleId) {
        foundRow = i + 1;
        oldValues = {
          service_date: rows[i][CLINIC_SCHEDULE_COLS.service_date],
          hosp_code: String(rows[i][CLINIC_SCHEDULE_COLS.hosp_code]),
          clinic_type: rows[i][CLINIC_SCHEDULE_COLS.clinic_type],
          service_time: rows[i][CLINIC_SCHEDULE_COLS.service_time],
          appoint_count: rows[i][CLINIC_SCHEDULE_COLS.appoint_count],
        };
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: "Schedule not found" };
    }

    // Update row
    var rowData = [
      scheduleId,
      serviceDate,
      hospCode,
      clinicType,
      serviceTime,
      appointCount,
      rows[foundRow - 1][CLINIC_SCHEDULE_COLS.telemed_link] || "",
      rows[foundRow - 1][CLINIC_SCHEDULE_COLS.link_added_by] || "",
      rows[foundRow - 1][CLINIC_SCHEDULE_COLS.incident_note] || "",
      now,
      drugDeliveryDate,
    ];
    ensureTextFormat("CLINIC_SCHEDULE", foundRow);
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  }

  if (isNew) {
    var schedNewRow = sheet.getLastRow() + 1;
    ensureTextFormat("CLINIC_SCHEDULE", schedNewRow);
    sheet.getRange(schedNewRow, 1, 1, 11).setValues([[
      scheduleId,
      serviceDate,
      hospCode,
      clinicType,
      serviceTime,
      appointCount,
      "",
      "",
      "",
      now,
      drugDeliveryDate,
    ]]);
  }

  // Audit log
  var newValues = {
    service_date: serviceDate,
    hosp_code: hospCode,
    clinic_type: clinicType,
    service_time: serviceTime,
    appoint_count: appointCount,
  };
  appendAuditLog(
    user,
    isNew ? "CREATE" : "UPDATE",
    "CLINIC_SCHEDULE",
    scheduleId,
    oldValues,
    newValues,
  );

  return { success: true, data: { schedule_id: scheduleId } };
}

/**
 * schedule.setLink — POST, set telemed link for a schedule.
 * Access: staff_hosp and above.
 */
function handleScheduleSetLink(user, data) {
  var scheduleId = String(data.schedule_id || "").trim();
  var telemedLink = String(data.telemed_link || "").trim();

  if (!scheduleId) return { success: false, error: "schedule_id is required" };

  // Access control: staff_hosp and above
  if (user.role === "staff_hsc") {
    return { success: false, error: "Access denied: insufficient permissions" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("CLINIC_SCHEDULE");
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][CLINIC_SCHEDULE_COLS.schedule_id] === scheduleId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, error: "Schedule not found" };
  }

  // Update telemed_link and link_added_by
  sheet
    .getRange(foundRow, CLINIC_SCHEDULE_COLS.telemed_link + 1)
    .setValue(telemedLink);
  sheet
    .getRange(foundRow, CLINIC_SCHEDULE_COLS.link_added_by + 1)
    .setValue(user.user_id);
  sheet
    .getRange(foundRow, CLINIC_SCHEDULE_COLS.updated_at + 1)
    .setValue(new Date().toISOString());

  // Audit log
  var oldLink = rows[foundRow - 1][CLINIC_SCHEDULE_COLS.telemed_link] || "";
  appendAuditLog(
    user,
    "UPDATE",
    "CLINIC_SCHEDULE",
    scheduleId,
    { telemed_link: oldLink },
    { telemed_link: telemedLink },
  );

  return { success: true, data: { message: "Link updated" } };
}

/**
 * schedule.recordIncident — POST, record incident note for a schedule.
 * Access: All authenticated users.
 */
function handleScheduleRecordIncident(user, data) {
  var scheduleId = String(data.schedule_id || "").trim();
  var incidentNote = String(data.incident_note || "").trim();

  if (!scheduleId) return { success: false, error: "schedule_id is required" };

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("CLINIC_SCHEDULE");
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][CLINIC_SCHEDULE_COLS.schedule_id] === scheduleId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, error: "Schedule not found" };
  }

  // Update incident_note
  var oldNote = rows[foundRow - 1][CLINIC_SCHEDULE_COLS.incident_note] || "";
  sheet
    .getRange(foundRow, CLINIC_SCHEDULE_COLS.incident_note + 1)
    .setValue(incidentNote);
  sheet
    .getRange(foundRow, CLINIC_SCHEDULE_COLS.updated_at + 1)
    .setValue(new Date().toISOString());

  // Audit log
  appendAuditLog(
    user,
    "UPDATE",
    "CLINIC_SCHEDULE",
    scheduleId,
    { incident_note: oldNote },
    { incident_note: incidentNote },
  );

  return { success: true, data: { message: "Incident recorded" } };
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
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var hospCodeFilter = params.hosp_code || "";
  var checkDateFilter = params.check_date || "";

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("READINESS_LOG");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var facilitiesMap = getFacilitiesMap();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var hospCode = String(row[READINESS_LOG_COLS.hosp_code]);
    var checkDate = toDateStr(row[READINESS_LOG_COLS.check_date]);

    // Filters
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue;
    if (checkDateFilter && checkDate !== checkDateFilter) continue;

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode);

    results.push({
      log_id: row[READINESS_LOG_COLS.log_id],
      hosp_code: hospCode,
      hosp_name: hospName,
      check_date: checkDate,
      cam_ok: row[READINESS_LOG_COLS.cam_ok] || "N",
      mic_ok: row[READINESS_LOG_COLS.mic_ok] || "N",
      pc_ok: row[READINESS_LOG_COLS.pc_ok] || "N",
      internet_ok: row[READINESS_LOG_COLS.internet_ok] || "N",
      software_ok: row[READINESS_LOG_COLS.software_ok] || "N",
      overall_status: row[READINESS_LOG_COLS.overall_status] || "not_ready",
      note: row[READINESS_LOG_COLS.note] || "",
      checked_by: row[READINESS_LOG_COLS.checked_by] || "",
      checked_at: row[READINESS_LOG_COLS.checked_at] || "",
    });
  }

  // Sort by check_date DESC, then hosp_name
  results.sort(function (a, b) {
    var dateCmp = b.check_date.localeCompare(a.check_date);
    if (dateCmp !== 0) return dateCmp;
    return (a.hosp_name || "").localeCompare(b.hosp_name || "", "th");
  });

  return { success: true, data: results };
}

/**
 * readiness.save — POST, create or update readiness check (upsert by hosp_code + check_date).
 * Access: super_admin, admin_hosp.
 * Computes overall_status from 5 boolean fields.
 */
function handleReadinessSave(user, data) {
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var hospCode = String(data.hosp_code || "").trim();
  var checkDate = String(data.check_date || "").trim();

  if (!hospCode) return { success: false, error: "hosp_code is required" };
  if (!checkDate) return { success: false, error: "check_date is required" };

  var camOk = String(data.cam_ok || "N");
  var micOk = String(data.mic_ok || "N");
  var pcOk = String(data.pc_ok || "N");
  var internetOk = String(data.internet_ok || "N");
  var softwareOk = String(data.software_ok || "N");
  var note = String(data.note || "").trim();

  // Compute overall_status
  var overallStatus = "need_fix";
  if (
    camOk === "Y" &&
    micOk === "Y" &&
    pcOk === "Y" &&
    internetOk === "Y" &&
    softwareOk === "Y"
  ) {
    overallStatus = "ready";
  } else if (pcOk === "N" || internetOk === "N") {
    overallStatus = "not_ready";
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("READINESS_LOG");
  var now = new Date().toISOString();

  // Check for existing log (upsert by hosp_code + check_date)
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;
  var oldValues = null;

  for (var i = 1; i < rows.length; i++) {
    if (
      String(rows[i][READINESS_LOG_COLS.hosp_code]) === hospCode &&
      toDateStr(rows[i][READINESS_LOG_COLS.check_date]) === checkDate
    ) {
      foundRow = i + 1;
      oldValues = {
        cam_ok: rows[i][READINESS_LOG_COLS.cam_ok],
        mic_ok: rows[i][READINESS_LOG_COLS.mic_ok],
        pc_ok: rows[i][READINESS_LOG_COLS.pc_ok],
        internet_ok: rows[i][READINESS_LOG_COLS.internet_ok],
        software_ok: rows[i][READINESS_LOG_COLS.software_ok],
        overall_status: rows[i][READINESS_LOG_COLS.overall_status],
        note: rows[i][READINESS_LOG_COLS.note],
      };
      break;
    }
  }

  var logId;
  var rowData = [
    null,
    String(hospCode),
    checkDate,
    camOk,
    micOk,
    pcOk,
    internetOk,
    softwareOk,
    overallStatus,
    note,
    user.user_id,
    now,
  ];

  if (foundRow > 0) {
    // Update existing
    logId = rows[foundRow - 1][READINESS_LOG_COLS.log_id];
    rowData[0] = logId;
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Insert new
    logId = Utilities.getUuid();
    rowData[0] = logId;
    var rlNewRow = sheet.getLastRow() + 1;
    ensureTextFormat("READINESS_LOG", rlNewRow);
    sheet.getRange(rlNewRow, 1, 1, rowData.length).setValues([rowData]);
  }
  var newValues = {
    hosp_code: hospCode,
    check_date: checkDate,
    cam_ok: camOk,
    mic_ok: micOk,
    pc_ok: pcOk,
    internet_ok: internetOk,
    software_ok: softwareOk,
    overall_status: overallStatus,
  };
  appendAuditLog(
    user,
    foundRow > 0 ? "UPDATE" : "CREATE",
    "READINESS_LOG",
    logId,
    oldValues,
    newValues,
  );

  return { success: true, data: { log_id: logId } };
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

/**
 * appointment.register — Phase 1: pre-register patients before HosXP import.
 * Access: super_admin, admin_hosp, staff_hosp.
 * Input: { hosp_code, service_date, appointments: [{ hn, patient_name, clinic_types: string[] }] }
 */
function handleAppointmentRegister(user, data) {
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao" && user.role !== "staff_hosp" && user.role !== "staff_hsc") {
    return { success: false, error: "Access denied" };
  }

  var hospCode = String(data.hosp_code || "").trim();
  var serviceDate = String(data.service_date || "").trim();
  var appointments = data.appointments;

  if (!hospCode) return { success: false, error: "hosp_code is required" };
  if (!serviceDate) return { success: false, error: "service_date is required" };
  if (!appointments || !appointments.length) {
    return { success: false, error: "appointments is required" };
  }

  // staff_hsc can only register for own facility
  if (user.role === "staff_hsc" && hospCode !== user.hosp_code) {
    return { success: false, error: "Access denied: cannot register for other facility" };
  }

  var ss = getSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  var now = new Date().toISOString();

  // Build existing HN+date+hosp_code set to check duplicates
  var vsData = vsSheet.getDataRange().getValues();
  var existingKeys = {};
  for (var e = 1; e < vsData.length; e++) {
    var eHN = String(vsData[e][VISIT_SUMMARY_COLS.hn]).trim();
    var eDate = toDateStr(vsData[e][VISIT_SUMMARY_COLS.service_date]);
    var eHosp = String(vsData[e][VISIT_SUMMARY_COLS.hosp_code]).trim();
    if (eHN && eDate && eHosp) {
      existingKeys[eHN + "|" + eDate + "|" + eHosp] = true;
    }
  }

  var validClinicTypes = [
    "PCU-DM", "PCU-HT", "ANC-nutrition", "ANC-parent",
    "postpartum-EPI", "postpartum-dev",
  ];

  var registered = 0;
  var duplicates = [];
  var errors = [];

  for (var i = 0; i < appointments.length; i++) {
    var apt = appointments[i];
    var hn = String(apt.hn || "").trim();
    var patientName = String(apt.patient_name || "").trim();
    var clinicTypes = apt.clinic_types || [];

    // Validate HN: 6-digit number
    if (!/^\d{6}$/.test(hn)) {
      errors.push({ hn: hn, error: "HN must be 6 digits" });
      continue;
    }
    if (!patientName) {
      errors.push({ hn: hn, error: "patient_name is required" });
      continue;
    }
    if (!clinicTypes.length) {
      errors.push({ hn: hn, error: "clinic_types must not be empty" });
      continue;
    }

    // Validate each clinic_type
    var validCTs = [];
    for (var ct = 0; ct < clinicTypes.length; ct++) {
      if (validClinicTypes.indexOf(clinicTypes[ct]) !== -1) {
        validCTs.push(clinicTypes[ct]);
      }
    }
    if (!validCTs.length) {
      errors.push({ hn: hn, error: "No valid clinic_types" });
      continue;
    }

    // Check duplicate HN + date + hosp_code
    var dupKey = hn + "|" + serviceDate + "|" + hospCode;
    if (existingKeys[dupKey]) {
      duplicates.push(hn);
      continue;
    }

    // Generate placeholder VN
    var placeholderVN = generatePlaceholderVN();

    // Join clinic types as comma-separated
    var clinicTypeStr = validCTs.join(",");

    // Insert VISIT_SUMMARY row
    var newRow = vsSheet.getLastRow() + 1;
    ensureTextFormat("VISIT_SUMMARY", newRow);
    vsSheet.getRange(newRow, 1, 1, 20).setValues([[
      placeholderVN,    // vn
      hn,               // hn
      patientName,      // patient_name
      "",               // dob (unknown until HosXP import)
      "",               // tel (unknown until HosXP import)
      clinicTypeStr,    // clinic_type (comma-separated)
      hospCode,         // hosp_code
      serviceDate,      // service_date
      "",               // attended
      "N",              // has_drug_change
      "N",              // drug_source_pending
      "N",              // dispensing_confirmed
      "",               // import_round1_at (empty = pre-registered)
      "",               // import_round2_at
      "pending",        // diff_status
      "",               // confirmed_by
      "",               // confirmed_at
      "",               // drug_sent_date
      "",               // drug_received_date
      "",               // drug_delivered_date
    ]]);

    // Mark this key as existing to prevent dup within same payload
    existingKeys[dupKey] = true;
    registered++;
  }

  // Audit log
  if (registered > 0) {
    appendAuditLog(user, "APPOINTMENT_REGISTER", "VISIT_SUMMARY", "", null, {
      hosp_code: hospCode,
      service_date: serviceDate,
      registered: registered,
      duplicates: duplicates.length,
    });
  }

  return {
    success: true,
    data: {
      registered: registered,
      duplicates: duplicates,
      errors: errors,
    },
  };
}

/**
 * Generate a placeholder VN: REG-YYYYMMDD-HHmmss-XXXX
 */
function generatePlaceholderVN() {
  var now = new Date();
  var y = now.getFullYear();
  var mo = ("0" + (now.getMonth() + 1)).slice(-2);
  var d = ("0" + now.getDate()).slice(-2);
  var h = ("0" + now.getHours()).slice(-2);
  var mi = ("0" + now.getMinutes()).slice(-2);
  var s = ("0" + now.getSeconds()).slice(-2);
  var rand = ("0000" + Math.random().toString(36).slice(2, 6).toUpperCase());
  return "REG-" + y + mo + d + "-" + h + mi + s + "-" + rand.slice(-4);
}

function handleImportPreview(user, data) {
  // Access control
  if (
    user.role !== "super_admin" &&
    user.role !== "admin_hosp" &&
    user.role !== "staff_hosp"
  ) {
    return { success: false, error: "Access denied" };
  }

  var round = Number(data.round) || 1;
  var visits = data.visits;
  if (!visits || !visits.length) {
    return { success: false, error: "No visits provided" };
  }

  var ss = getSpreadsheet();

  // Build existing VN set from VISIT_SUMMARY
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  var existingVNs = {};
  if (vsSheet) {
    var vsData = vsSheet.getDataRange().getValues();
    for (var v = 1; v < vsData.length; v++) {
      existingVNs[String(vsData[v][VISIT_SUMMARY_COLS.vn])] = true;
    }
  }

  // Build valid drug_name set from MASTER_DRUGS
  var mdSheet = ss.getSheetByName("MASTER_DRUGS");
  var validDrugs = {};
  if (mdSheet) {
    var mdData = mdSheet.getDataRange().getValues();
    for (var m = 1; m < mdData.length; m++) {
      if (mdData[m][MASTER_DRUG_COLS.active] === "Y") {
        validDrugs[
          String(mdData[m][MASTER_DRUG_COLS.drug_name]).toLowerCase()
        ] = true;
      }
    }
  }

  var valid = [];
  var errors = [];
  var unknownDrugSet = {};
  var totalRows = 0;

  for (var i = 0; i < visits.length; i++) {
    var visit = visits[i];
    var vn = String(visit.vn || "").trim();
    var patientName = String(visit.patient_name || "").trim();
    var drugs = visit.drugs || [];
    var visitErrors = [];
    var hasUnknownDrug = false;

    totalRows += drugs.length;

    // Check VN uniqueness/existence
    if (!vn) {
      visitErrors.push("VN is empty");
    } else if (round === 1 && existingVNs[vn]) {
      visitErrors.push("VN already exists in VISIT_SUMMARY");
    } else if (round === 2 && !existingVNs[vn]) {
      visitErrors.push(
        "VN not found in VISIT_SUMMARY (round 2 requires existing VN)",
      );
    }

    // Check drug_names
    for (var d = 0; d < drugs.length; d++) {
      var drugName = String(drugs[d].drug_name || "").trim();
      if (!drugName) continue;
      if (!validDrugs[drugName.toLowerCase()]) {
        unknownDrugSet[drugName] = true;
        hasUnknownDrug = true;
      }
    }

    if (hasUnknownDrug && visitErrors.length === 0) {
      visitErrors.push("Contains unknown drugs");
    }

    if (visitErrors.length > 0) {
      errors.push({ vn: vn, error: visitErrors.join("; ") });
    } else {
      valid.push({
        vn: vn,
        patient_name: patientName,
        drug_count: drugs.length,
      });
    }
  }

  var unknownDrugs = Object.keys(unknownDrugSet);

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
  };
}

/**
 * import.confirm — POST, inserts VISIT_SUMMARY + VISIT_MEDS with defaults.
 * Access: super_admin, admin_hosp.
 * Round 1: Insert new VISIT_SUMMARY + VISIT_MEDS (source=hosp_stock, status=draft).
 * Round 2: Update VISIT_SUMMARY + diff against round 1 meds.
 */
function handleImportConfirm(user, data) {
  debugTrace("handleImportConfirm.start");
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var round = Number(data.round) || 1;
  var hospCode = String(data.hosp_code || "").trim();
  var serviceDate = String(data.service_date || "").trim();
  var visits = data.visits;

  if (!visits || !visits.length) {
    return { success: false, error: "No visits provided" };
  }
  if (!hospCode) return { success: false, error: "hosp_code is required" };
  if (!serviceDate)
    return { success: false, error: "service_date is required" };

  var ss = getSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  var vmSheet = ss.getSheetByName("VISIT_MEDS");
  var now = new Date().toISOString();

  var importedVisits = 0;
  var updatedPreRegistered = 0;
  var importedMeds = 0;
  var processedVNs = {}; // T162: dedup guard for duplicate VN in payload

  // Pre-read VISIT_SUMMARY for both round 2 and Phase 2 HN matching
  var vsRows = null;
  var vnToVsRow = {}; // VN → index in vsRows (O(1) lookup)
  var vnToRound1Meds = {}; // VN → sorted array of {drug_name, strength, qty}
  var hnToPlaceholderRow = {}; // "hn|date|hosp" → vsRow index for Phase 2 matching

  // Always read VISIT_SUMMARY for Phase 2 HN matching (round 1) and round 2 diff
  vsRows = vsSheet.getDataRange().getValues();

  // Build VN → row index map
  for (var v = 1; v < vsRows.length; v++) {
    var vvn = String(vsRows[v][VISIT_SUMMARY_COLS.vn]);
    if (vvn) vnToVsRow[vvn] = v;

    // Build HN → placeholder row map for Phase 2 matching (round 1 only)
    if (round === 1 && isPlaceholderVN(vvn)) {
      var phHN = String(vsRows[v][VISIT_SUMMARY_COLS.hn]).trim();
      var phDate = toDateStr(vsRows[v][VISIT_SUMMARY_COLS.service_date]);
      var phHosp = String(vsRows[v][VISIT_SUMMARY_COLS.hosp_code]).trim();
      if (phHN && phDate && phHosp) {
        hnToPlaceholderRow[phHN + "|" + phDate + "|" + phHosp] = v;
      }
    }
  }

  if (round === 2) {
    var vmRows = vmSheet.getDataRange().getValues();

    // Build VN → round 1 meds map (pre-collect and pre-sort)
    for (var m = 1; m < vmRows.length; m++) {
      if (Number(vmRows[m][VISIT_MEDS_COLS.round]) === 1) {
        var mvn = String(vmRows[m][VISIT_MEDS_COLS.vn]);
        if (!vnToRound1Meds[mvn]) vnToRound1Meds[mvn] = [];
        vnToRound1Meds[mvn].push({
          drug_name: String(vmRows[m][VISIT_MEDS_COLS.drug_name]),
          strength: String(vmRows[m][VISIT_MEDS_COLS.strength]),
          qty: Number(vmRows[m][VISIT_MEDS_COLS.qty]),
        });
      }
    }

    // Pre-sort round 1 meds by drug_name for each VN
    var vnKeys = Object.keys(vnToRound1Meds);
    for (var k = 0; k < vnKeys.length; k++) {
      vnToRound1Meds[vnKeys[k]].sort(function (a, b) {
        return a.drug_name.localeCompare(b.drug_name);
      });
    }
  }

  for (var i = 0; i < visits.length; i++) {
    var visit = visits[i];
    var vn = String(visit.vn || "").trim();
    if (!vn) continue;

    // T162: Skip duplicate VN in same payload
    if (processedVNs[vn]) continue;
    processedVNs[vn] = true;

    if (round === 1) {
      // Phase 2: Check if a pre-registered row (placeholder VN) matches by HN + date + hosp
      var visitHN = String(visit.hn || "").trim();
      var phMatchKey = visitHN + "|" + serviceDate + "|" + hospCode;
      var phRowIdx = hnToPlaceholderRow[phMatchKey];

      if (phRowIdx !== undefined) {
        // Update existing placeholder row with real VN and data
        vsRows[phRowIdx][VISIT_SUMMARY_COLS.vn] = String(vn);
        vsRows[phRowIdx][VISIT_SUMMARY_COLS.patient_name] = String(visit.patient_name || vsRows[phRowIdx][VISIT_SUMMARY_COLS.patient_name]);
        if (visit.dob) vsRows[phRowIdx][VISIT_SUMMARY_COLS.dob] = String(visit.dob);
        if (visit.tel) vsRows[phRowIdx][VISIT_SUMMARY_COLS.tel] = String(visit.tel);
        // Merge clinic_type: keep existing + add from import if not already present
        var existingClinics = splitClinicTypes(String(vsRows[phRowIdx][VISIT_SUMMARY_COLS.clinic_type] || ""));
        var importClinic = String(visit.clinic_type || data.clinic_type || "");
        if (importClinic && existingClinics.indexOf(importClinic) === -1) {
          existingClinics.push(importClinic);
        }
        vsRows[phRowIdx][VISIT_SUMMARY_COLS.clinic_type] = existingClinics.join(",");
        vsRows[phRowIdx][VISIT_SUMMARY_COLS.import_round1_at] = now;
        // Write updated row directly to sheet (avoids row-count mismatch from new inserts)
        vsSheet.getRange(phRowIdx + 1, 1, 1, vsRows[phRowIdx].length).setValues([vsRows[phRowIdx]]);
        // Remove old placeholder key so it won't match again
        delete hnToPlaceholderRow[phMatchKey];
        updatedPreRegistered++;
      } else {
        // No pre-registered match: insert new VISIT_SUMMARY row
        var vsNewRow = vsSheet.getLastRow() + 1;
        ensureTextFormat("VISIT_SUMMARY", vsNewRow);
        vsSheet.getRange(vsNewRow, 1, 1, 20).setValues([[
          String(vn), // vn
          String(visit.hn || ""), // hn
          String(visit.patient_name || ""), // patient_name
          String(visit.dob || ""), // dob
          String(visit.tel || ""), // tel
          String(visit.clinic_type || data.clinic_type || ""), // clinic_type
          String(hospCode), // hosp_code
          serviceDate, // service_date
          "", // attended
          "N", // has_drug_change
          "N", // drug_source_pending
          "N", // dispensing_confirmed
          now, // import_round1_at
          "", // import_round2_at
          "pending", // diff_status
          "", // confirmed_by
          "", // confirmed_at
          "", // drug_sent_date
          "", // drug_received_date
          "", // drug_delivered_date
        ]]);
      }
      importedVisits++;
    } else {
      // Round 2: Update VISIT_SUMMARY using lookup maps (T166) + in-memory batch (T167)
      var vsIdx = vnToVsRow[vn];
      if (vsIdx !== undefined) {
        // T167: Modify vsRows in memory instead of individual setValue calls
        vsRows[vsIdx][VISIT_SUMMARY_COLS.import_round2_at] = now;

        // Get round 1 meds from pre-built map (already sorted by drug_name)
        var round1Meds = vnToRound1Meds[vn] || [];

        // Sort new drugs by drug_name for comparison (T161)
        var newDrugs = (visit.drugs || []).slice();
        newDrugs.sort(function (a, b) {
          return String(a.drug_name || "").localeCompare(
            String(b.drug_name || ""),
          );
        });

        // Compare sorted drug lists
        var matched = newDrugs.length === round1Meds.length;
        if (matched) {
          for (var nd = 0; nd < newDrugs.length; nd++) {
            if (
              String(newDrugs[nd].drug_name) !== round1Meds[nd].drug_name ||
              String(newDrugs[nd].strength) !== round1Meds[nd].strength ||
              Number(newDrugs[nd].qty) !== round1Meds[nd].qty
            ) {
              matched = false;
              break;
            }
          }
        }

        vsRows[vsIdx][VISIT_SUMMARY_COLS.diff_status] = matched
          ? "matched"
          : "mismatch";

        // T161: Update has_drug_change flag when mismatch found
        if (!matched) {
          vsRows[vsIdx][VISIT_SUMMARY_COLS.has_drug_change] = "Y";
        }
      }
    }

    // Insert VISIT_MEDS
    var drugs = visit.drugs || [];
    var medRows = [];
    for (var d = 0; d < drugs.length; d++) {
      var drug = drugs[d];
      var source =
        round === 1 ? "hosp_stock" : String(drug.source || "hosp_stock");
      medRows.push([
        Utilities.getUuid(), // med_id
        vn, // vn
        String(drug.drug_name || ""), // drug_name
        String(drug.strength || ""), // strength
        Number(drug.qty) || 0, // qty
        String(drug.unit || ""), // unit
        String(drug.sig || ""), // sig
        source, // source
        "N", // is_changed
        round, // round
        "draft", // status
        "", // note
        user.user_id, // updated_by
        now, // updated_at
      ]);
      importedMeds++;
    }

    if (medRows.length > 0) {
      var startRow = vmSheet.getLastRow() + 1;
      vmSheet
        .getRange(startRow, 1, medRows.length, medRows[0].length)
        .setValues(medRows);
      ensureTextFormat("VISIT_MEDS", startRow, medRows.length);
    }
  }

  // T167: Batch write back VISIT_SUMMARY for round 2 only
  // Round 1 placeholder updates are written per-row above (avoids row-count mismatch from new inserts)
  if (round === 2 && vsRows) {
    vsSheet.getDataRange().setValues(vsRows);
  }

  // Audit log
  appendAuditLog(user, "IMPORT", "VISIT_SUMMARY", "", null, {
    round: round,
    hosp_code: hospCode,
    service_date: serviceDate,
    imported_visits: importedVisits,
    updated_pre_registered: updatedPreRegistered,
    imported_meds: importedMeds,
  });

  return {
    success: true,
    data: {
      imported_visits: importedVisits,
      updated_pre_registered: updatedPreRegistered,
      imported_meds: importedMeds,
      import_round1_at: round === 1 ? now : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Visit Summary & Meds Handlers (T093)
// ---------------------------------------------------------------------------

/**
 * visitSummary.list — GET, role-filtered.
 * Includes tel for contact verification (Module 5 & 6).
 * staff_hsc: own hosp_code only.
 * staff_hosp+: all, optionally filtered by service_date/hosp_code.
 */
function handleVisitSummaryList(user, params) {
  var serviceDateFilter = params.service_date || "";
  var hospCodeFilter = params.hosp_code || "";

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("VISIT_SUMMARY");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var facilitiesMap = getFacilitiesMap();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var hospCode = String(row[VISIT_SUMMARY_COLS.hosp_code]);
    var serviceDate = toDateStr(row[VISIT_SUMMARY_COLS.service_date]);

    // Role-based visibility
    if (user.role === "staff_hsc" && hospCode !== user.hosp_code) continue;

    // Filters
    if (serviceDateFilter && serviceDate !== serviceDateFilter) continue;
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue;

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode);

    results.push({
      vn: row[VISIT_SUMMARY_COLS.vn],
      patient_name: row[VISIT_SUMMARY_COLS.patient_name] || "",
      tel: String(row[VISIT_SUMMARY_COLS.tel] || ""),
      clinic_type: row[VISIT_SUMMARY_COLS.clinic_type] || "",
      hosp_code: hospCode,
      hosp_name: hospName,
      service_date: serviceDate,
      attended: row[VISIT_SUMMARY_COLS.attended] || "",
      has_drug_change: row[VISIT_SUMMARY_COLS.has_drug_change] || "N",
      drug_source_pending: row[VISIT_SUMMARY_COLS.drug_source_pending] || "N",
      dispensing_confirmed: row[VISIT_SUMMARY_COLS.dispensing_confirmed] || "N",
      diff_status: row[VISIT_SUMMARY_COLS.diff_status] || "pending",
      drug_sent_date: toDateStr(row[VISIT_SUMMARY_COLS.drug_sent_date]),
      drug_received_date: toDateStr(row[VISIT_SUMMARY_COLS.drug_received_date]),
      drug_delivered_date: toDateStr(row[VISIT_SUMMARY_COLS.drug_delivered_date]),
    });
  }

  // Sort by patient_name
  results.sort(function (a, b) {
    return a.patient_name.localeCompare(b.patient_name, "th");
  });

  return { success: true, data: results };
}

/**
 * visitMeds.list — GET, return VISIT_MEDS for a given VN.
 * staff_hsc: VN must belong to own hosp_code (checked via VISIT_SUMMARY).
 */
function handleVisitMedsList(user, params) {
  var vn = String(params.vn || "").trim();
  if (!vn) return { success: false, error: "vn is required" };

  // staff_hsc: verify VN belongs to own hosp_code
  if (user.role === "staff_hsc") {
    var ss2 = getSpreadsheet();
    var vsSheet2 = ss2.getSheetByName("VISIT_SUMMARY");
    if (vsSheet2) {
      var vsData2 = vsSheet2.getDataRange().getValues();
      var found2 = false;
      for (var v = 1; v < vsData2.length; v++) {
        if (String(vsData2[v][VISIT_SUMMARY_COLS.vn]) === vn) {
          if (
            String(vsData2[v][VISIT_SUMMARY_COLS.hosp_code]) !== user.hosp_code
          ) {
            return {
              success: false,
              error: "Access denied: VN not in your facility",
            };
          }
          found2 = true;
          break;
        }
      }
      if (!found2) return { success: true, data: [] };
    }
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("VISIT_MEDS");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[VISIT_MEDS_COLS.vn]) !== vn) continue;

    results.push({
      med_id: row[VISIT_MEDS_COLS.med_id] || "",
      vn: vn,
      drug_name: row[VISIT_MEDS_COLS.drug_name] || "",
      strength: row[VISIT_MEDS_COLS.strength] || "",
      qty: Number(row[VISIT_MEDS_COLS.qty]) || 0,
      unit: row[VISIT_MEDS_COLS.unit] || "",
      sig: row[VISIT_MEDS_COLS.sig] || "",
      source: row[VISIT_MEDS_COLS.source] || "hosp_stock",
      is_changed: row[VISIT_MEDS_COLS.is_changed] || "N",
      round: Number(row[VISIT_MEDS_COLS.round]) || 1,
      status: row[VISIT_MEDS_COLS.status] || "draft",
      note: row[VISIT_MEDS_COLS.note] || "",
      updated_by: row[VISIT_MEDS_COLS.updated_by] || "",
      updated_at: row[VISIT_MEDS_COLS.updated_at] || "",
    });
  }

  return { success: true, data: results };
}

/**
 * visitMeds.save — POST, handles confirm_all, edit, and absent action types.
 * All authenticated users.
 * - confirm_all: Set all meds status=confirmed, update VISIT_SUMMARY flags.
 * - edit: Update/insert individual meds, set is_changed=Y if data changed.
 * - absent: Set attended=N, cancel all meds.
 */
function handleVisitMedsSave(user, data) {
  debugTrace("handleVisitMedsSave.start", { vn: String(data.vn || ""), action_type: String(data.action_type || "") });
  var vn = String(data.vn || "").trim();
  var actionType = String(data.action_type || "").trim();
  var meds = data.meds || [];

  if (!vn) return { success: false, error: "vn is required" };
  if (!actionType) return { success: false, error: "action_type is required" };

  var ss = getSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  var vmSheet = ss.getSheetByName("VISIT_MEDS");
  var now = new Date().toISOString();

  // Find VISIT_SUMMARY row
  var vsRows = vsSheet.getDataRange().getValues();
  var vsFoundRow = -1;
  for (var v = 1; v < vsRows.length; v++) {
    if (String(vsRows[v][VISIT_SUMMARY_COLS.vn]) === vn) {
      vsFoundRow = v + 1;
      break;
    }
  }
  if (vsFoundRow === -1) return { success: false, error: "Visit not found" };

  // staff_hsc: verify ownership
  if (user.role === "staff_hsc") {
    var vsHospCode = String(
      vsRows[vsFoundRow - 1][VISIT_SUMMARY_COLS.hosp_code],
    );
    if (vsHospCode !== user.hosp_code) {
      return { success: false, error: "Access denied: not your facility" };
    }
  }

  // Read VISIT_MEDS data once — shared by all action types (T163-T165)
  var vmData = vmSheet.getDataRange().getValues();

  if (actionType === "confirm_all") {
    // T163: Batch confirm_all — modify in memory, write back once
    var hasVmChanges = false;
    for (var m = 1; m < vmData.length; m++) {
      if (String(vmData[m][VISIT_MEDS_COLS.vn]) === vn) {
        if (String(vmData[m][VISIT_MEDS_COLS.status]) === "cancelled") continue;
        vmData[m][VISIT_MEDS_COLS.status] = "confirmed";
        vmData[m][VISIT_MEDS_COLS.updated_by] = user.user_id;
        vmData[m][VISIT_MEDS_COLS.updated_at] = now;
        hasVmChanges = true;
      }
    }
    if (hasVmChanges) {
      vmSheet.getDataRange().setValues(vmData);
    }

    // Batch VISIT_SUMMARY update — modify vsRows in memory, write single row
    var vsIdx = vsFoundRow - 1;
    vsRows[vsIdx][VISIT_SUMMARY_COLS.attended] = "Y";
    vsRows[vsIdx][VISIT_SUMMARY_COLS.dispensing_confirmed] = "Y";
    vsRows[vsIdx][VISIT_SUMMARY_COLS.confirmed_by] = user.user_id;
    vsRows[vsIdx][VISIT_SUMMARY_COLS.confirmed_at] = now;

    // Check drug_source_pending from meds
    var confirmHasPending = false;
    for (var cp = 1; cp < vmData.length; cp++) {
      if (String(vmData[cp][VISIT_MEDS_COLS.vn]) === vn) {
        if (String(vmData[cp][VISIT_MEDS_COLS.source]) === "hosp_pending"
            && String(vmData[cp][VISIT_MEDS_COLS.status]) !== "cancelled") {
          confirmHasPending = true;
          break;
        }
      }
    }
    vsRows[vsIdx][VISIT_SUMMARY_COLS.drug_source_pending] = confirmHasPending ? "Y" : "N";
    vsSheet
      .getRange(vsFoundRow, 1, 1, vsRows[0].length)
      .setValues([vsRows[vsIdx]]);

    appendAuditLog(user, "CONFIRM_ALL", "VISIT_MEDS", vn, null, {
      action_type: "confirm_all",
    });
  } else if (actionType === "edit") {
    // T164: Batch edit — read vmData once, build med_id lookup map
    var hasDrugChange = false;
    var newMeds = [];

    // Build med_id → row index map for O(1) lookup instead of O(n) per med
    var medIdMap = {};
    for (var r = 1; r < vmData.length; r++) {
      var mKey = String(vmData[r][VISIT_MEDS_COLS.med_id]);
      if (mKey) medIdMap[mKey] = r;
    }

    // Build existing drug set from MASTER_DRUGS for auto-register check
    // Key = drug_name|strength (composite) since same drug can have multiple strengths
    var mdSheet = ss.getSheetByName("MASTER_DRUGS");
    var existingDrugKeys = {};
    var inactiveDrugKeys = {};
    var mdData = [];
    if (mdSheet) {
      mdData = mdSheet.getDataRange().getValues();
      for (var md = 1; md < mdData.length; md++) {
        var mdKey = String(mdData[md][MASTER_DRUG_COLS.drug_name]).toLowerCase()
          + "|" + String(mdData[md][MASTER_DRUG_COLS.strength]).toLowerCase();
        if (String(mdData[md][MASTER_DRUG_COLS.active]) === "Y") {
          existingDrugKeys[mdKey] = true;
        } else {
          inactiveDrugKeys[mdKey] = md; // row index for reactivation
        }
      }
    }

    for (var e = 0; e < meds.length; e++) {
      var med = meds[e];
      var medId = String(med.med_id || "").trim();

      if (medId) {
        // Update existing med in memory
        var rowIdx = medIdMap[medId];
        if (rowIdx !== undefined) {
          var oldSource = String(vmData[rowIdx][VISIT_MEDS_COLS.source]);
          var oldNote = String(vmData[rowIdx][VISIT_MEDS_COLS.note]);
          var oldStatus = String(vmData[rowIdx][VISIT_MEDS_COLS.status]);
          var oldUnit = String(vmData[rowIdx][VISIT_MEDS_COLS.unit]);

          // is_changed tracks core drug data changes (drug_name, strength, qty, sig)
          var isChanged =
            String(vmData[rowIdx][VISIT_MEDS_COLS.drug_name]) !== String(med.drug_name) ||
            String(vmData[rowIdx][VISIT_MEDS_COLS.strength]) !== String(med.strength) ||
            Number(vmData[rowIdx][VISIT_MEDS_COLS.qty]) !== Number(med.qty) ||
            String(vmData[rowIdx][VISIT_MEDS_COLS.sig]) !== String(med.sig)
              ? "Y"
              : "N";

          var newSource = String(med.source || "hosp_stock");
          var newStatus = String(med.status || "confirmed");

          // has_drug_change='Y' if ANY field changed (source, note, unit, or core data)
          // Exclude draft→confirmed status transition — that's just initial confirm, not a drug change
          var statusActuallyChanged = oldStatus !== newStatus &&
            !(oldStatus === "draft" && newStatus === "confirmed");
          var anyFieldChanged =
            isChanged === "Y" ||
            oldSource !== newSource ||
            statusActuallyChanged ||
            oldNote !== String(med.note || "") ||
            oldUnit !== String(med.unit || "");

          if (anyFieldChanged) hasDrugChange = true;

          vmData[rowIdx][VISIT_MEDS_COLS.drug_name] = String(
            med.drug_name || "",
          );
          vmData[rowIdx][VISIT_MEDS_COLS.strength] = String(
            med.strength || "",
          );
          vmData[rowIdx][VISIT_MEDS_COLS.qty] = Math.max(1, Number(med.qty) || 0);
          vmData[rowIdx][VISIT_MEDS_COLS.unit] = String(med.unit || "");
          vmData[rowIdx][VISIT_MEDS_COLS.sig] = String(med.sig || "");
          vmData[rowIdx][VISIT_MEDS_COLS.source] = newSource;
          vmData[rowIdx][VISIT_MEDS_COLS.is_changed] = isChanged;
          vmData[rowIdx][VISIT_MEDS_COLS.note] = String(med.note || "");
          vmData[rowIdx][VISIT_MEDS_COLS.status] = newStatus;
          vmData[rowIdx][VISIT_MEDS_COLS.updated_by] = user.user_id;
          vmData[rowIdx][VISIT_MEDS_COLS.updated_at] = now;

          // Auto-register drug in MASTER_DRUGS if drug_name or strength changed
          // and the new combination doesn't exist (mirrors new med auto-register logic)
          if (isChanged === "Y") {
            var existDrugName = String(med.drug_name || "").trim();
            var existDrugStrength = String(med.strength || "").trim();
            var existDrugKey = existDrugName.toLowerCase() + "|" + existDrugStrength.toLowerCase();
            if (existDrugName && mdSheet && !existingDrugKeys[existDrugKey]) {
              existingDrugKeys[existDrugKey] = true; // prevent duplicate within same save
              var existInactiveIdx = inactiveDrugKeys[existDrugKey];
              if (existInactiveIdx !== undefined) {
                // Reactivate soft-deleted drug — write only the active cell
                mdSheet.getRange(existInactiveIdx + 1, MASTER_DRUG_COLS.active + 1).setValue("Y");
              } else {
                // Truly new combination — insert into MASTER_DRUGS
                var existNewRow = mdSheet.getLastRow() + 1;
                ensureTextFormat("MASTER_DRUGS", existNewRow);
                mdSheet.getRange(existNewRow, 1, 1, 5).setValues([[
                  Utilities.getUuid(),
                  existDrugName,
                  existDrugStrength,
                  String(med.unit || ""),
                  "Y",
                ]]);
              }
            }
          }
        }
        // If medId not found in map, skip (matches original behavior)
      } else {
        // Auto-register new drug in MASTER_DRUGS if not exists (or reactivate soft-deleted)
        var newDrugName = String(med.drug_name || "").trim();
        var newDrugStrength = String(med.strength || "").trim();
        var newDrugKey = newDrugName.toLowerCase() + "|" + newDrugStrength.toLowerCase();
        if (newDrugName && mdSheet && !existingDrugKeys[newDrugKey]) {
          existingDrugKeys[newDrugKey] = true; // prevent duplicate within same save
          var inactiveIdx = inactiveDrugKeys[newDrugKey];
          if (inactiveIdx !== undefined) {
            // Reactivate existing soft-deleted drug — write only the active cell
            mdSheet.getRange(inactiveIdx + 1, MASTER_DRUG_COLS.active + 1).setValue("Y");
          } else {
            // Truly new drug — insert
            var mdNewRow = mdSheet.getLastRow() + 1;
            ensureTextFormat("MASTER_DRUGS", mdNewRow);
            mdSheet.getRange(mdNewRow, 1, 1, 5).setValues([[
              Utilities.getUuid(),
              newDrugName,
              newDrugStrength,
              String(med.unit || ""),
              "Y",
            ]]);
          }
        }
        // Collect new med for batch append
        var addSource = String(med.source || "hosp_stock");
        hasDrugChange = true;

        newMeds.push([
          Utilities.getUuid(),
          vn,
          String(med.drug_name || ""),
          String(med.strength || ""),
          Math.max(1, Number(med.qty) || 0),
          String(med.unit || ""),
          String(med.sig || ""),
          addSource,
          "Y", // is_changed for new drugs
          1, // round
          "confirmed",
          String(med.note || ""),
          user.user_id,
          now,
        ]);
      }
    }

    // Write back all existing med updates in one call
    vmSheet.getDataRange().setValues(vmData);

    // Append new meds (format first to preserve leading zeros)
    for (var n = 0; n < newMeds.length; n++) {
      var vmNewRow = vmSheet.getLastRow() + 1;
      ensureTextFormat("VISIT_MEDS", vmNewRow);
      vmSheet.getRange(vmNewRow, 1, 1, newMeds[n].length).setValues([newMeds[n]]);
    }

    // Batch VISIT_SUMMARY update
    var vsIdx2 = vsFoundRow - 1;
    vsRows[vsIdx2][VISIT_SUMMARY_COLS.attended] = "Y";
    // Preserve existing has_drug_change='Y' — only escalate, never reset to N
    var prevDrugChange = String(vsRows[vsIdx2][VISIT_SUMMARY_COLS.has_drug_change]);
    vsRows[vsIdx2][VISIT_SUMMARY_COLS.has_drug_change] =
      (hasDrugChange || prevDrugChange === "Y") ? "Y" : "N";

    // Recalculate drug_source_pending from vmData (existing) + newMeds (appended)
    var editHasPending = false;
    for (var sp = 1; sp < vmData.length; sp++) {
      if (String(vmData[sp][VISIT_MEDS_COLS.vn]) === vn) {
        if (String(vmData[sp][VISIT_MEDS_COLS.source]) === "hosp_pending"
            && String(vmData[sp][VISIT_MEDS_COLS.status]) !== "cancelled") {
          editHasPending = true;
          break;
        }
      }
    }
    // Also check newMeds array (not yet in vmData)
    if (!editHasPending) {
      for (var np = 0; np < newMeds.length; np++) {
        // newMeds columns: [med_id, vn, drug_name, strength, qty, unit, sig, source, is_changed, round, status, note, updated_by, updated_at]
        if (String(newMeds[np][7]) === "hosp_pending") {
          editHasPending = true;
          break;
        }
      }
    }
    vsRows[vsIdx2][VISIT_SUMMARY_COLS.drug_source_pending] = editHasPending ? "Y" : "N";
    vsRows[vsIdx2][VISIT_SUMMARY_COLS.dispensing_confirmed] = "Y";
    vsRows[vsIdx2][VISIT_SUMMARY_COLS.confirmed_by] = user.user_id;
    vsRows[vsIdx2][VISIT_SUMMARY_COLS.confirmed_at] = now;
    vsSheet
      .getRange(vsFoundRow, 1, 1, vsRows[0].length)
      .setValues([vsRows[vsIdx2]]);

    appendAuditLog(user, "EDIT", "VISIT_MEDS", vn, null, {
      action_type: "edit",
      med_count: meds.length,
    });
  } else if (actionType === "absent") {
    // Mark patient as absent — keep meds as draft so they remain when patient arrives later
    var vsIdx3 = vsFoundRow - 1;
    vsRows[vsIdx3][VISIT_SUMMARY_COLS.attended] = "N";
    vsRows[vsIdx3][VISIT_SUMMARY_COLS.dispensing_confirmed] = "N";
    vsRows[vsIdx3][VISIT_SUMMARY_COLS.confirmed_by] = "";
    vsRows[vsIdx3][VISIT_SUMMARY_COLS.confirmed_at] = "";
    vsSheet
      .getRange(vsFoundRow, 1, 1, vsRows[0].length)
      .setValues([vsRows[vsIdx3]]);

    appendAuditLog(user, "ABSENT", "VISIT_SUMMARY", vn, null, {
      action_type: "absent",
    });
  } else if (actionType === "undo_absent") {
    // Undo absent — patient arrived late, restore attended status (meds were kept as draft)
    var vsIdx4 = vsFoundRow - 1;
    if (String(vsRows[vsIdx4][VISIT_SUMMARY_COLS.attended]) !== "N") {
      return { success: false, error: "Patient is not marked absent" };
    }

    // Recalculate drug_source_pending from meds (still in draft)
    var undoHasPending = false;
    for (var up = 1; up < vmData.length; up++) {
      if (String(vmData[up][VISIT_MEDS_COLS.vn]) === vn) {
        if (String(vmData[up][VISIT_MEDS_COLS.source]) === "hosp_pending"
            && String(vmData[up][VISIT_MEDS_COLS.status]) !== "cancelled") {
          undoHasPending = true;
          break;
        }
      }
    }

    vsRows[vsIdx4][VISIT_SUMMARY_COLS.attended] = "";
    vsRows[vsIdx4][VISIT_SUMMARY_COLS.dispensing_confirmed] = "N";
    vsRows[vsIdx4][VISIT_SUMMARY_COLS.confirmed_by] = "";
    vsRows[vsIdx4][VISIT_SUMMARY_COLS.confirmed_at] = "";
    vsRows[vsIdx4][VISIT_SUMMARY_COLS.drug_source_pending] = undoHasPending ? "Y" : "N";
    vsSheet
      .getRange(vsFoundRow, 1, 1, vsRows[0].length)
      .setValues([vsRows[vsIdx4]]);

    appendAuditLog(user, "UNDO_ABSENT", "VISIT_SUMMARY", vn, null, {
      action_type: "undo_absent",
    });
  } else if (actionType === "undo_confirm") {
    // Undo confirm — revert back to pending so drugs can be re-edited
    var vsIdx5 = vsFoundRow - 1;
    if (String(vsRows[vsIdx5][VISIT_SUMMARY_COLS.dispensing_confirmed]) !== "Y") {
      return { success: false, error: "Patient is not confirmed" };
    }

    // Reset meds to draft
    var hasUndoConfirmChanges = false;
    for (var uc = 1; uc < vmData.length; uc++) {
      if (String(vmData[uc][VISIT_MEDS_COLS.vn]) === vn) {
        if (String(vmData[uc][VISIT_MEDS_COLS.status]) === "confirmed") {
          vmData[uc][VISIT_MEDS_COLS.status] = "draft";
          vmData[uc][VISIT_MEDS_COLS.updated_by] = user.user_id;
          vmData[uc][VISIT_MEDS_COLS.updated_at] = now;
          hasUndoConfirmChanges = true;
        }
      }
    }
    if (hasUndoConfirmChanges) {
      vmSheet.getDataRange().setValues(vmData);
    }

    // Recalculate drug_source_pending
    var undoConfPending = false;
    for (var ucp = 1; ucp < vmData.length; ucp++) {
      if (String(vmData[ucp][VISIT_MEDS_COLS.vn]) === vn) {
        if (String(vmData[ucp][VISIT_MEDS_COLS.source]) === "hosp_pending"
            && String(vmData[ucp][VISIT_MEDS_COLS.status]) !== "cancelled") {
          undoConfPending = true;
          break;
        }
      }
    }

    vsRows[vsIdx5][VISIT_SUMMARY_COLS.dispensing_confirmed] = "N";
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.confirmed_by] = "";
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.confirmed_at] = "";
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.drug_source_pending] = undoConfPending ? "Y" : "N";
    // Reset attended and delivery dates since confirm is being undone
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.attended] = "";
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.drug_sent_date] = "";
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.drug_received_date] = "";
    vsRows[vsIdx5][VISIT_SUMMARY_COLS.drug_delivered_date] = "";
    vsSheet
      .getRange(vsFoundRow, 1, 1, vsRows[0].length)
      .setValues([vsRows[vsIdx5]]);

    appendAuditLog(user, "UNDO_CONFIRM", "VISIT_MEDS", vn, null, {
      action_type: "undo_confirm",
    });
  } else {
    return { success: false, error: "Invalid action_type: " + actionType };
  }

  var successMessages = {
    confirm_all: "Drugs confirmed",
    edit: "Drugs updated",
    absent: "Marked as absent",
    undo_absent: "Absent status reverted",
    undo_confirm: "Confirm status reverted",
  };
  return { success: true, data: { message: successMessages[actionType] || "Operation completed" } };
}

/**
 * visitMeds.batchConfirm — POST, batch confirm or absent multiple VNs at once.
 * data: { action: 'confirm' | 'absent', vns: string[] }
 * All authenticated users. staff_hsc: only own hosp_code VNs.
 */
function handleVisitMedsBatchConfirm(user, data) {
  var vns = data.vns;
  var batchAction = data.action || "confirm";
  if (!Array.isArray(vns) || vns.length === 0) {
    return { success: false, error: "vns array is required" };
  }
  if (vns.length > 200) {
    return { success: false, error: "Batch limit is 200 VNs" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  var vmSheet = ss.getSheetByName("VISIT_MEDS");
  if (!vsSheet || !vmSheet) return { success: false, error: "Sheet not found" };

  var now = new Date().toISOString();
  var vsRows = vsSheet.getDataRange().getValues();
  var vmData = vmSheet.getDataRange().getValues();

  // Build VN → row index lookup for VISIT_SUMMARY
  var vnSet = {};
  for (var v = 0; v < vns.length; v++) {
    vnSet[String(vns[v])] = true;
  }

  // Collect target rows from VISIT_SUMMARY
  var targetVsRows = [];
  for (var r = 1; r < vsRows.length; r++) {
    var rowVn = String(vsRows[r][VISIT_SUMMARY_COLS.vn]);
    if (vnSet[rowVn]) {
      var dc = String(vsRows[r][VISIT_SUMMARY_COLS.dispensing_confirmed]);
      var att = String(vsRows[r][VISIT_SUMMARY_COLS.attended]);
      if (batchAction === "confirm" && dc === "Y") continue;
      if (batchAction === "absent" && (att === "N" || dc === "Y")) continue;
      targetVsRows.push({ vsIdx: r, vsRowNum: r + 1, vn: rowVn });
    }
  }

  // staff_hsc: filter to own hosp_code only
  if (user.role === "staff_hsc") {
    targetVsRows = targetVsRows.filter(function (t) {
      return String(vsRows[t.vsIdx][VISIT_SUMMARY_COLS.hosp_code]) === user.hosp_code;
    });
  }

  if (targetVsRows.length === 0) {
    return { success: true, data: { message: "ไม่มีรายการที่ต้องอัปเดต", updated: 0 } };
  }

  // Build VN set from targets for VISIT_MEDS lookup
  var targetVnSet = {};
  for (var t = 0; t < targetVsRows.length; t++) {
    targetVnSet[targetVsRows[t].vn] = true;
  }

  // Update VISIT_MEDS in memory (only for confirm — absent keeps meds as draft)
  var hasVmChanges = false;
  if (batchAction === "confirm") {
    for (var m = 1; m < vmData.length; m++) {
      var medVn = String(vmData[m][VISIT_MEDS_COLS.vn]);
      if (targetVnSet[medVn]) {
        var medStatus = String(vmData[m][VISIT_MEDS_COLS.status]);
        if (medStatus === "cancelled") continue;
        vmData[m][VISIT_MEDS_COLS.status] = "confirmed";
        vmData[m][VISIT_MEDS_COLS.updated_by] = user.user_id;
        vmData[m][VISIT_MEDS_COLS.updated_at] = now;
        hasVmChanges = true;
      }
    }
    if (hasVmChanges) vmSheet.getDataRange().setValues(vmData);
  }

  // Update VISIT_SUMMARY — single write per target
  for (var u = 0; u < targetVsRows.length; u++) {
    var idx = targetVsRows[u].vsIdx;
    var rowNum = targetVsRows[u].vsRowNum;
    if (batchAction === "confirm") {
      vsRows[idx][VISIT_SUMMARY_COLS.attended] = "Y";
      vsRows[idx][VISIT_SUMMARY_COLS.dispensing_confirmed] = "Y";
      vsRows[idx][VISIT_SUMMARY_COLS.confirmed_by] = user.user_id;
      vsRows[idx][VISIT_SUMMARY_COLS.confirmed_at] = now;

      // Check drug_source_pending in same loop to avoid double write
      var hasPending = false;
      for (var pm = 1; pm < vmData.length; pm++) {
        if (String(vmData[pm][VISIT_MEDS_COLS.vn]) === targetVsRows[u].vn) {
          if (String(vmData[pm][VISIT_MEDS_COLS.source]) === "hosp_pending"
              && String(vmData[pm][VISIT_MEDS_COLS.status]) !== "cancelled") {
            hasPending = true;
            break;
          }
        }
      }
      vsRows[idx][VISIT_SUMMARY_COLS.drug_source_pending] = hasPending ? "Y" : "N";
    } else {
      vsRows[idx][VISIT_SUMMARY_COLS.attended] = "N";
      vsRows[idx][VISIT_SUMMARY_COLS.dispensing_confirmed] = "N";
      vsRows[idx][VISIT_SUMMARY_COLS.confirmed_by] = "";
      vsRows[idx][VISIT_SUMMARY_COLS.confirmed_at] = "";
    }
    vsSheet.getRange(rowNum, 1, 1, vsRows[0].length).setValues([vsRows[idx]]);
  }

  appendAuditLog(user, "BATCH_" + batchAction.toUpperCase(), "VISIT_MEDS", vns.join(","), null, {
    action: batchAction,
    count: targetVsRows.length,
  });

  return {
    success: true,
    data: {
      message: (batchAction === "confirm" ? "ยืนยัน" : "บันทึกไม่มา") + "สำเร็จ " + targetVsRows.length + " รายการ",
      updated: targetVsRows.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Drug Delivery Tracking (T190 — Phase 16)
// ---------------------------------------------------------------------------

/**
 * visitMeds.trackDelivery — POST, update delivery date fields on VISIT_SUMMARY.
 *
 * Payload: { vn, field, date }
 *   field: "drug_sent_date" | "drug_received_date" | "drug_delivered_date"
 *   date: ISO date string (YYYY-MM-DD) or "" to clear
 *
 * Role restrictions:
 *   staff_hosp / admin_hosp → drug_sent_date only
 *   staff_hsc → drug_received_date + drug_delivered_date (own hosp_code only)
 *   super_admin → any field
 */
function handleVisitMedsTrackDelivery(user, data) {
  var vn = String(data.vn || "").trim();
  var field = String(data.field || "").trim();
  var dateVal = String(data.date || "");

  if (!vn) return { success: false, error: "vn is required" };

  var allowedFields = ["drug_sent_date", "drug_received_date", "drug_delivered_date"];
  if (allowedFields.indexOf(field) === -1) {
    return { success: false, error: "Invalid field: " + field };
  }

  // Role-based field restrictions
  if (user.role === "staff_hosp" || user.role === "admin_hosp" || user.role === "staff_sao") {
    if (field !== "drug_sent_date") {
      return { success: false, error: "Role cannot update " + field };
    }
  } else if (user.role === "staff_hsc") {
    if (field === "drug_sent_date") {
      return { success: false, error: "Role cannot update " + field };
    }
  } else if (user.role !== "super_admin") {
    return { success: false, error: "Forbidden" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  if (!vsSheet) return { success: false, error: "Sheet not found" };

  var vsData = vsSheet.getDataRange().getValues();
  var vsIdx = -1;

  for (var v = 1; v < vsData.length; v++) {
    if (String(vsData[v][VISIT_SUMMARY_COLS.vn]) === vn) {
      vsIdx = v;
      break;
    }
  }

  if (vsIdx === -1) return { success: false, error: "VN not found" };

  // staff_hsc: verify VN belongs to own hosp_code
  if (user.role === "staff_hsc") {
    if (String(vsData[vsIdx][VISIT_SUMMARY_COLS.hosp_code]) !== user.hosp_code) {
      return { success: false, error: "Access denied: VN not in your facility" };
    }
  }

  // Validate drug_source_pending = Y
  var pending = String(vsData[vsIdx][VISIT_SUMMARY_COLS.drug_source_pending]);
  if (pending !== "Y") {
    return { success: false, error: "VN has no pending drugs" };
  }

  // Update the field
  var colIdx = VISIT_SUMMARY_COLS[field];
  vsSheet.getRange(vsIdx + 1, colIdx + 1).setValue(dateVal);

  appendAuditLog(user, "TRACK_DELIVERY", "VISIT_SUMMARY", vn, null, {
    field: field,
    date: dateVal,
  });

  return {
    success: true,
    data: { message: "อัปเดตสถานะการจัดส่งสำเร็จ", vn: vn, field: field, date: dateVal },
  };
}

/**
 * visitSummary.updateTel — POST, update patient phone number.
 * Access: staff_hsc (own hosp_code only), staff_hosp, admin_hosp, super_admin.
 */
function handleVisitSummaryUpdateTel(user, data) {
  var vn = String(data.vn || "").trim();
  var tel = String(data.tel || "").trim();

  if (!vn) return { success: false, error: "vn is required" };

  // Only allow authorized roles (check early before expensive sheet scan)
  if (["staff_hsc", "staff_hosp", "staff_sao", "admin_hosp", "super_admin"].indexOf(user.role) === -1) {
    return { success: false, error: "Forbidden" };
  }

  // Validate tel format: 9-10 digits starting with 0, or empty (clear)
  if (tel && !/^0\d{8,9}$/.test(tel)) {
    return { success: false, error: "รูปแบบเบอร์โทรไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0)" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  if (!vsSheet) return { success: false, error: "Sheet not found" };

  var vsData = vsSheet.getDataRange().getValues();
  var vsIdx = -1;

  for (var v = 1; v < vsData.length; v++) {
    if (String(vsData[v][VISIT_SUMMARY_COLS.vn]) === vn) {
      vsIdx = v;
      break;
    }
  }

  if (vsIdx === -1) return { success: false, error: "VN not found" };

  // staff_hsc: verify VN belongs to own hosp_code
  if (user.role === "staff_hsc") {
    if (String(vsData[vsIdx][VISIT_SUMMARY_COLS.hosp_code]) !== user.hosp_code) {
      return { success: false, error: "Access denied: VN not in your facility" };
    }
  }

  var oldTel = String(vsData[vsIdx][VISIT_SUMMARY_COLS.tel] || "");
  vsSheet.getRange(vsIdx + 1, VISIT_SUMMARY_COLS.tel + 1).setValue(tel);

  appendAuditLog(user, "UPDATE_TEL", "VISIT_SUMMARY", vn, null, {
    old_tel: oldTel,
    new_tel: tel,
  });

  return {
    success: true,
    data: { message: "อัปเดตเบอร์โทรสำเร็จ", vn: vn, tel: tel },
  };
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
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var statusFilter = params.status || "";
  var hospCodeFilter = params.hosp_code || "";
  var serviceDateFilter = params.service_date || "";
  var patientNameFilter = (params.patient_name || "").toLowerCase();
  var clinicTypeFilter = params.clinic_type || "";

  var ss = getSpreadsheet();
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  if (!vsSheet) return { success: true, data: [] };

  var facilitiesMap = getFacilitiesMap();
  var vsData = vsSheet.getDataRange().getValues();

  // Build user_id -> display name lookup for recorded_by resolution
  var usersSheet = ss.getSheetByName("USERS");
  var userNameMap = {};
  if (usersSheet) {
    var usersData = usersSheet.getDataRange().getValues();
    for (var u = 1; u < usersData.length; u++) {
      var uid = String(usersData[u][USERS_COLS.user_id]);
      var firstName = String(usersData[u][USERS_COLS.first_name] || "");
      var lastName = String(usersData[u][USERS_COLS.last_name] || "");
      userNameMap[uid] = (firstName + " " + lastName).trim();
    }
  }

  // Build followup records lookup: vn -> array of records
  var fuSheet = ss.getSheetByName("FOLLOWUP");
  var followupByVN = {};
  if (fuSheet) {
    var fuData = fuSheet.getDataRange().getValues();
    for (var f = 1; f < fuData.length; f++) {
      var fuVN = String(fuData[f][FOLLOWUP_COLS.vn]);
      var record = {
        followup_id: fuData[f][FOLLOWUP_COLS.followup_id] || "",
        followup_date: String(fuData[f][FOLLOWUP_COLS.followup_date] || ""),
        general_condition: String(
          fuData[f][FOLLOWUP_COLS.general_condition] || "",
        ),
        side_effect: String(fuData[f][FOLLOWUP_COLS.side_effect] || ""),
        drug_adherence: String(fuData[f][FOLLOWUP_COLS.drug_adherence] || ""),
        other_note: String(fuData[f][FOLLOWUP_COLS.other_note] || ""),
        recorded_by: fuData[f][FOLLOWUP_COLS.recorded_by] || "",
        recorded_by_name: userNameMap[String(fuData[f][FOLLOWUP_COLS.recorded_by])] || "",
        recorded_at: fuData[f][FOLLOWUP_COLS.recorded_at] || "",
      };
      if (!followupByVN[fuVN]) followupByVN[fuVN] = [];
      followupByVN[fuVN].push(record);
    }
    // Sort followup records newest first within each VN
    for (var vn in followupByVN) {
      followupByVN[vn].sort(function (a, b) {
        return String(b.followup_date).localeCompare(String(a.followup_date));
      });
    }
  }

  // Build meds lookup: vn -> array of confirmed meds
  var vmSheet = ss.getSheetByName("VISIT_MEDS");
  var medsByVN = {};
  if (vmSheet) {
    var vmData = vmSheet.getDataRange().getValues();
    for (var m = 1; m < vmData.length; m++) {
      if (String(vmData[m][VISIT_MEDS_COLS.status]) === "confirmed") {
        var medVN = String(vmData[m][VISIT_MEDS_COLS.vn]);
        if (!medsByVN[medVN]) medsByVN[medVN] = [];
        medsByVN[medVN].push({
          med_id: vmData[m][VISIT_MEDS_COLS.med_id] || "",
          drug_name: vmData[m][VISIT_MEDS_COLS.drug_name] || "",
          strength: vmData[m][VISIT_MEDS_COLS.strength] || "",
          qty: Number(vmData[m][VISIT_MEDS_COLS.qty]) || 0,
          unit: vmData[m][VISIT_MEDS_COLS.unit] || "",
          sig: vmData[m][VISIT_MEDS_COLS.sig] || "",
          source: vmData[m][VISIT_MEDS_COLS.source] || "",
          is_changed: vmData[m][VISIT_MEDS_COLS.is_changed] || "N",
          status: String(vmData[m][VISIT_MEDS_COLS.status]) || "",
        });
      }
    }
  }

  var results = [];

  for (var i = 1; i < vsData.length; i++) {
    var row = vsData[i];

    // Only visits with dispensing_confirmed = Y
    if (String(row[VISIT_SUMMARY_COLS.dispensing_confirmed]) !== "Y") continue;

    var vn = String(row[VISIT_SUMMARY_COLS.vn]);
    var hospCode = String(row[VISIT_SUMMARY_COLS.hosp_code]);
    var serviceDate = toDateStr(row[VISIT_SUMMARY_COLS.service_date]);

    // Service date filter
    if (serviceDateFilter && serviceDate !== serviceDateFilter) continue;

    // Hosp code filter
    if (hospCodeFilter && hospCode !== hospCodeFilter) continue;

    // Clinic type filter (contains-match for comma-separated values)
    var clinicType = String(row[VISIT_SUMMARY_COLS.clinic_type] || "");
    if (clinicTypeFilter) {
      var clinicArr = splitClinicTypes(clinicType);
      if (clinicArr.indexOf(clinicTypeFilter) === -1) continue;
    }

    // Patient name filter (case-insensitive substring match)
    var patientName = String(row[VISIT_SUMMARY_COLS.patient_name] || "");
    if (patientNameFilter && patientName.toLowerCase().indexOf(patientNameFilter) === -1) continue;

    // Compute followup_status
    var fuRecords = followupByVN[vn] || [];
    var followupStatus = fuRecords.length > 0 ? "followed" : "pending";

    // Status filter
    if (statusFilter && followupStatus !== statusFilter) continue;

    var hospName = facilitiesMap[hospCode] || getHospName(hospCode);

    results.push({
      vn: vn,
      patient_name: row[VISIT_SUMMARY_COLS.patient_name] || "",
      dob: toDateStr(row[VISIT_SUMMARY_COLS.dob]),
      tel: row[VISIT_SUMMARY_COLS.tel] || "",
      hn: row[VISIT_SUMMARY_COLS.hn] || "",
      hosp_code: hospCode,
      hosp_name: hospName,
      clinic_type: row[VISIT_SUMMARY_COLS.clinic_type] || "",
      service_date: toDateStr(row[VISIT_SUMMARY_COLS.service_date]),
      has_drug_change: row[VISIT_SUMMARY_COLS.has_drug_change] || "N",
      drug_source_pending: row[VISIT_SUMMARY_COLS.drug_source_pending] || "N",
      dispensing_confirmed: "Y",
      followup_status: followupStatus,
      followup_records: fuRecords,
      meds: medsByVN[vn] || [],
      drug_sent_date: toDateStr(row[VISIT_SUMMARY_COLS.drug_sent_date]),
      drug_received_date: toDateStr(row[VISIT_SUMMARY_COLS.drug_received_date]),
      drug_delivered_date: toDateStr(row[VISIT_SUMMARY_COLS.drug_delivered_date]),
    });
  }

  // Sort by followup_status (pending first), then service_date DESC
  results.sort(function (a, b) {
    if (a.followup_status !== b.followup_status) {
      return a.followup_status === "pending" ? -1 : 1;
    }
    return b.service_date.localeCompare(a.service_date);
  });

  return { success: true, data: results };
}

/**
 * followup.save — POST, insert a new followup record for a VN.
 * Access: super_admin, admin_hosp only.
 * Multiple followup records per VN are allowed.
 */
function handleFollowupSave(user, data) {
  debugTrace("handleFollowupSave.start", { vn: String(data.vn || ""), followup_date: String(data.followup_date || "") });
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var vn = String(data.vn || "").trim();
  var followupDate = String(data.followup_date || "").trim();
  var generalCondition = String(data.general_condition || "").trim();
  var sideEffect = String(data.side_effect || "").trim();
  var drugAdherence = String(data.drug_adherence || "").trim();
  var otherNote = String(data.other_note || "").trim();

  if (!vn) return { success: false, error: "vn is required" };
  if (!followupDate)
    return { success: false, error: "followup_date is required" };

  var ss = getSpreadsheet();

  // Validate VN exists and dispensing_confirmed = Y
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  if (!vsSheet) return { success: false, error: "VISIT_SUMMARY sheet not found" };
  var vsData = vsSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < vsData.length; i++) {
    if (String(vsData[i][VISIT_SUMMARY_COLS.vn]) === vn) {
      if (String(vsData[i][VISIT_SUMMARY_COLS.dispensing_confirmed]) !== "Y") {
        return {
          success: false,
          error: "Visit not yet confirmed for dispensing",
        };
      }
      found = true;
      break;
    }
  }
  if (!found) return { success: false, error: "VN not found in VISIT_SUMMARY" };

  // Insert followup record
  var fuSheet = ss.getSheetByName("FOLLOWUP");
  if (!fuSheet) return { success: false, error: "FOLLOWUP sheet not found" };
  var followupId = Utilities.getUuid();
  var now = new Date().toISOString();

  var fuNewRow = fuSheet.getLastRow() + 1;
  ensureTextFormat("FOLLOWUP", fuNewRow);
  fuSheet.getRange(fuNewRow, 1, 1, 9).setValues([[
    followupId,
    vn,
    followupDate,
    generalCondition,
    sideEffect,
    drugAdherence,
    otherNote,
    user.user_id,
    now,
  ]]);

  // Audit log
  appendAuditLog(user, "CREATE", "FOLLOWUP", followupId, null, {
    vn: vn,
    followup_date: followupDate,
  });

  return { success: true, data: { followup_id: followupId } };
}

/**
 * followup.update — POST, update an existing followup record.
 * Access: super_admin, admin_hosp only.
 */
function handleFollowupUpdate(user, data) {
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var followupId = String(data.followup_id || "").trim();
  if (!followupId) return { success: false, error: "followup_id is required" };

  var followupDate = String(data.followup_date || "").trim();
  var generalCondition = String(data.general_condition || "").trim();
  var sideEffect = String(data.side_effect || "").trim();
  var drugAdherence = String(data.drug_adherence || "").trim();
  var otherNote = String(data.other_note || "").trim();

  if (!followupDate) return { success: false, error: "followup_date is required" };

  var ss = getSpreadsheet();
  var fuSheet = ss.getSheetByName("FOLLOWUP");
  if (!fuSheet) return { success: false, error: "FOLLOWUP sheet not found" };

  var rows = fuSheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][FOLLOWUP_COLS.followup_id] === followupId) {
      foundRow = i + 1;
      break;
    }
  }
  if (foundRow === -1) return { success: false, error: "Followup record not found" };

  // Update row — preserve followup_id, vn, recorded_by, recorded_at
  var oldRow = rows[foundRow - 1];
  var updatedRow = [
    followupId,
    oldRow[FOLLOWUP_COLS.vn],
    followupDate,
    generalCondition,
    sideEffect,
    drugAdherence,
    otherNote,
    oldRow[FOLLOWUP_COLS.recorded_by],
    oldRow[FOLLOWUP_COLS.recorded_at],
  ];

  ensureTextFormat("FOLLOWUP", foundRow);
  fuSheet.getRange(foundRow, 1, 1, updatedRow.length).setValues([updatedRow]);

  // Audit log
  appendAuditLog(user, "UPDATE", "FOLLOWUP", followupId, {
    followup_date: String(oldRow[FOLLOWUP_COLS.followup_date] || ""),
  }, {
    followup_date: followupDate,
  });

  return { success: true, data: { followup_id: followupId } };
}

/**
 * followup.delete — POST, delete a followup record (hard delete from sheet).
 * Access: super_admin, admin_hosp only.
 */
function handleFollowupDelete(user, data) {
  if (user.role !== "super_admin" && user.role !== "admin_hosp" && user.role !== "staff_sao") {
    return { success: false, error: "Access denied: admin only" };
  }

  var followupId = String(data.followup_id || "").trim();
  if (!followupId) return { success: false, error: "followup_id is required" };

  var ss = getSpreadsheet();
  var fuSheet = ss.getSheetByName("FOLLOWUP");
  if (!fuSheet) return { success: false, error: "FOLLOWUP sheet not found" };

  var rows = fuSheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][FOLLOWUP_COLS.followup_id] === followupId) {
      foundRow = i + 1;
      break;
    }
  }
  if (foundRow === -1) return { success: false, error: "Followup record not found" };

  // Delete the row
  fuSheet.deleteRow(foundRow);

  // Audit log
  appendAuditLog(user, "DELETE", "FOLLOWUP", followupId, {}, {});

  return { success: true, data: { success: true } };
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
  if (user.role !== "super_admin" && user.role !== "admin_hosp") {
    return { success: false, error: "Access denied" };
  }

  var statusFilter = params.status || "";
  var roleFilter = params.role || "";

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  var data = sheet.getDataRange().getValues();

  // admin_hosp can only see staff_hosp + staff_hsc
  var visibleRoles = null;
  if (user.role === "admin_hosp") {
    visibleRoles = { staff_hosp: true, staff_hsc: true };
  }

  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowRole = String(row[USERS_COLS.role]);
    var rowStatus = String(row[USERS_COLS.status]);

    // Role visibility
    if (visibleRoles && !visibleRoles[rowRole]) continue;

    // Filters
    if (statusFilter && rowStatus !== statusFilter) continue;
    if (roleFilter && rowRole !== roleFilter) continue;

    results.push({
      user_id: row[USERS_COLS.user_id],
      username: String(row[USERS_COLS.username]),
      hosp_code: String(row[USERS_COLS.hosp_code]),
      hosp_name: getHospName(String(row[USERS_COLS.hosp_code])),
      first_name: String(row[USERS_COLS.first_name]),
      last_name: String(row[USERS_COLS.last_name]),
      tel: String(row[USERS_COLS.tel]),
      role: rowRole,
      status: rowStatus,
      created_at: String(row[USERS_COLS.created_at] || ""),
    });
  }

  // Sort by created_at DESC
  results.sort(function (a, b) {
    return b.created_at.localeCompare(a.created_at);
  });

  return { success: true, data: results };
}

/**
 * users.approve — POST, approve a pending user with assigned role.
 * Access: super_admin or admin_hosp.
 * Validates role permission: admin_hosp can only assign staff_hosp/staff_hsc.
 */
function handleUsersApprove(user, data) {
  debugTrace("handleUsersApprove.start", { target: String(data.user_id || "") });
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp") {
    return { success: false, error: "Access denied" };
  }

  var targetUserId = String(data.user_id || "").trim();
  var assignRole = String(data.role || "").trim();

  if (!targetUserId) return { success: false, error: "user_id is required" };
  if (!assignRole) return { success: false, error: "role is required" };

  // Validate assignable roles
  var assignableRoles = null;
  if (user.role === "admin_hosp") {
    assignableRoles = { staff_hosp: true, staff_hsc: true };
  }
  if (assignableRoles && !assignableRoles[assignRole]) {
    return { success: false, error: "You cannot assign this role" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  var rows = sheet.getDataRange().getValues();

  var foundRow = -1;
  var oldStatus = "";
  var oldRole = "";

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][USERS_COLS.user_id]) === targetUserId) {
      foundRow = i + 1;
      oldStatus = String(rows[i][USERS_COLS.status]);
      oldRole = String(rows[i][USERS_COLS.role]);
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: "User not found" };
  if (oldStatus !== "pending")
    return { success: false, error: "User is not pending approval" };

  // Update status and role
  sheet.getRange(foundRow, USERS_COLS.status + 1).setValue("active");
  sheet.getRange(foundRow, USERS_COLS.role + 1).setValue(assignRole);
  sheet.getRange(foundRow, USERS_COLS.approved_by + 1).setValue(user.user_id);

  // Audit log
  appendAuditLog(
    user,
    "APPROVE",
    "USERS",
    targetUserId,
    { status: oldStatus, role: oldRole },
    { status: "active", role: assignRole },
  );

  return { success: true, data: { message: "User approved" } };
}

/**
 * users.update — POST, update user role or status.
 * Access: super_admin or admin_hosp.
 * Suspend clears session token to force re-login.
 */
function handleUsersUpdate(user, data) {
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp") {
    return { success: false, error: "Access denied" };
  }

  var targetUserId = String(data.user_id || "").trim();
  var newStatus = String(data.status || "").trim();
  var newRole = String(data.role || "").trim();

  if (!targetUserId) return { success: false, error: "user_id is required" };
  if (!newStatus && !newRole)
    return { success: false, error: "Nothing to update" };

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  var rows = sheet.getDataRange().getValues();

  var foundRow = -1;
  var oldStatus = "";
  var oldRole = "";

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][USERS_COLS.user_id]) === targetUserId) {
      foundRow = i + 1;
      oldStatus = String(rows[i][USERS_COLS.status]);
      oldRole = String(rows[i][USERS_COLS.role]);
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: "User not found" };

  // Cannot modify super_admin unless you are super_admin
  if (oldRole === "super_admin" && user.role !== "super_admin") {
    return { success: false, error: "Cannot modify super_admin" };
  }

  // Validate role assignment permission
  if (newRole) {
    var assignableRoles = null;
    if (user.role === "admin_hosp") {
      assignableRoles = { staff_hosp: true, staff_hsc: true };
    }
    if (assignableRoles && !assignableRoles[newRole]) {
      return { success: false, error: "You cannot assign this role" };
    }
    sheet.getRange(foundRow, USERS_COLS.role + 1).setValue(newRole);
  }

  if (newStatus) {
    sheet.getRange(foundRow, USERS_COLS.status + 1).setValue(newStatus);

    // Suspend: clear session to force re-login
    if (newStatus === "inactive") {
      sheet.getRange(foundRow, USERS_COLS.session_token + 1).setValue("");
      sheet.getRange(foundRow, USERS_COLS.session_expires + 1).setValue("");
    }
  }

  // Audit log
  appendAuditLog(
    user,
    "UPDATE",
    "USERS",
    targetUserId,
    { status: oldStatus, role: oldRole },
    { status: newStatus || oldStatus, role: newRole || oldRole },
  );

  return { success: true, data: { message: "User updated" } };
}

/**
 * users.resetPassword — POST, reset user password to a new value.
 * Access: super_admin or admin_hosp.
 * Clears session to force re-login with new password.
 */
function handleUsersResetPassword(user, data) {
  debugTrace("handleUsersResetPassword.start", { target: String(data.user_id || "") });
  // Access control
  if (user.role !== "super_admin" && user.role !== "admin_hosp") {
    return { success: false, error: "Access denied" };
  }

  var targetUserId = String(data.user_id || "").trim();
  var newPassword = String(data.new_password || "").trim();

  if (!targetUserId) return { success: false, error: "user_id is required" };

  // Generate a secure temp password if not provided
  if (!newPassword) {
    newPassword =
      "Tmp" + Utilities.getUuid().replace(/-/g, "").substring(0, 10);
  }

  if (newPassword.length < 8)
    return { success: false, error: "Password must be at least 8 characters" };

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  var rows = sheet.getDataRange().getValues();

  var foundRow = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][USERS_COLS.user_id]) === targetUserId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: "User not found" };

  // Hash new password
  var newSalt = generateSalt();
  var newHash = hashPassword(newPassword, newSalt);

  // Update password and clear session
  sheet.getRange(foundRow, USERS_COLS.password_hash + 1).setValue(newHash);
  sheet.getRange(foundRow, USERS_COLS.password_salt + 1).setValue(newSalt);
  sheet.getRange(foundRow, USERS_COLS.session_token + 1).setValue("");
  sheet.getRange(foundRow, USERS_COLS.session_expires + 1).setValue("");
  // Set force_change only when admin didn't specify a password (auto-generated temp)
  var wasAutoGenerated = !String(data.new_password || "").trim();
  if (sheet.getLastColumn() >= USERS_COLS.force_change + 1) {
    sheet.getRange(foundRow, USERS_COLS.force_change + 1).setValue(wasAutoGenerated ? "Y" : "");
  }

  // Audit log
  appendAuditLog(user, "RESET_PASSWORD", "USERS", targetUserId, null, {
    action: "password_reset",
  });

  return { success: true, data: { message: "Password reset", temp_password: newPassword } };
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
  if (user.role !== "super_admin") {
    return { success: false, error: "Access denied: super_admin only" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("SETTINGS");
  if (!sheet) return { success: true, data: { settings: [] } };

  var data = sheet.getDataRange().getValues();
  var settings = [];

  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][SETTINGS_COLS.key] || "").trim();
    var value = String(data[i][SETTINGS_COLS.value] || "");
    if (key) {
      settings.push({ key: key, value: value });
    }
  }

  return { success: true, data: { settings: settings } };
}

/**
 * settings.save — POST, update key-value pairs in SETTINGS sheet.
 * Access: super_admin only.
 * If telegram_test=true, sends a test message via Telegram Bot API.
 */
function handleSettingsSave(user, data) {
  debugTrace("handleSettingsSave.start");
  // Access control
  if (user.role !== "super_admin") {
    return { success: false, error: "Access denied: super_admin only" };
  }

  var settings = data.settings;
  if (!settings || !settings.length) {
    return { success: false, error: "No settings provided" };
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("SETTINGS");
  if (!sheet) return { success: false, error: "SETTINGS sheet not found" };

  // Build lookup of existing keys -> row number
  var existingRows = sheet.getDataRange().getValues();
  var keyRowMap = {};
  for (var i = 1; i < existingRows.length; i++) {
    var existingKey = String(existingRows[i][SETTINGS_COLS.key]).trim();
    if (existingKey) keyRowMap[existingKey] = i + 1; // 1-based
  }

  // Update or insert each setting
  for (var s = 0; s < settings.length; s++) {
    var key = String(settings[s].key || "").trim();
    var value = String(settings[s].value || "");
    if (!key) continue;

    if (keyRowMap[key]) {
      // Update existing
      sheet.getRange(keyRowMap[key], SETTINGS_COLS.value + 1).setValue(value);
    } else {
      // Insert new
      sheet.appendRow([key, value]);
      ensureTextFormat("SETTINGS", sheet.getLastRow());
    }
  }

  // Handle Telegram test
  if (data.telegram_test) {
    // Re-read settings to get latest values including just-saved ones
    var freshSettings = getSettingsMap();
    var testResult = sendTelegramMessage(
      freshSettings,
      "ทดสอบการแจ้งเตือน\nระบบ: " +
        (freshSettings.system_name || "Telemed Tracking") +
        "\nสถานะ: ส่งสำเร็จ",
    );
    if (!testResult.success) {
      return {
        success: false,
        error: "Settings saved but Telegram test failed: " + testResult.error,
      };
    }
  }

  // Audit log
  appendAuditLog(user, "UPDATE", "SETTINGS", "", null, {
    updated_keys: settings.map(function (s) {
      return s.key;
    }),
    telegram_test: !!data.telegram_test,
  });

  return { success: true, data: { message: "Settings saved" } };
}

// ---------------------------------------------------------------------------
// Audit Log Handler
// ---------------------------------------------------------------------------

/**
 * auditLog.list — GET, return recent audit log entries.
 * Access: super_admin only.
 */
function handleAuditLogList(user, params) {
  if (user.role !== "super_admin") {
    return { success: false, error: "Access denied: super_admin only" };
  }

  var limit = Number(params.limit) || 100;

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("AUDIT_LOG");
  if (!sheet) return { success: true, data: [] };

  var data = sheet.getDataRange().getValues();
  var results = [];

  // Read from newest to oldest (skip header)
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    results.push({
      log_id: row[AUDIT_LOG_COLS.log_id] || "",
      user_id: String(row[AUDIT_LOG_COLS.user_id] || ""),
      action: String(row[AUDIT_LOG_COLS.action] || ""),
      module: String(row[AUDIT_LOG_COLS.module] || ""),
      target_id: String(row[AUDIT_LOG_COLS.target_id] || ""),
      old_value: String(row[AUDIT_LOG_COLS.old_value] || ""),
      new_value: String(row[AUDIT_LOG_COLS.new_value] || ""),
      created_at: String(row[AUDIT_LOG_COLS.created_at] || ""),
    });
    if (results.length >= limit) break;
  }

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// Settings Helpers
// ---------------------------------------------------------------------------

/**
 * Read SETTINGS sheet into a simple key-value object.
 */
function getSettingsMap() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("SETTINGS");
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][SETTINGS_COLS.key] || "").trim();
    var value = String(data[i][SETTINGS_COLS.value] || "");
    if (key) map[key] = value;
  }
  return map;
}

/**
 * Send a message via Telegram Bot API.
 * Returns { success: boolean, error?: string }
 */
function sendTelegramMessage(settings, message) {
  var botToken = settings.bot_token || "";
  var chatId = settings.chat_id || "";

  if (!botToken || !chatId) {
    return { success: false, error: "Bot token or Chat ID not configured" };
  }

  var url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  var payload = {
    chat_id: chatId,
    text: message,
    parse_mode: "HTML",
  };

  try {
    var options = {
      method: "post",
      payload: JSON.stringify(payload),
      contentType: "application/json",
      muteHttpExceptions: true,
    };
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();

    if (responseCode === 200) {
      return { success: true };
    } else {
      var errorBody = response.getContentText();
      return {
        success: false,
        error: "HTTP " + responseCode + ": " + errorBody,
      };
    }
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Telegram Notification Functions
// ---------------------------------------------------------------------------

/**
 * buildFollowupReminder — Queries VISIT_SUMMARY for confirmed visits without
 * follow-up records and sends a summary notification via Telegram.
 * Called by dailyTrigger() when notify_followup === "Y".
 */
function buildFollowupReminder(settings) {
  var ss = getSpreadsheet();
  var facilitiesMap = getFacilitiesMap();

  // Build set of VNs that already have a follow-up record
  var fuSheet = ss.getSheetByName("FOLLOWUP");
  var fuVNSet = {};
  if (fuSheet) {
    var fuData = fuSheet.getDataRange().getValues();
    for (var f = 1; f < fuData.length; f++) {
      var fuVN = String(fuData[f][FOLLOWUP_COLS.vn]).trim();
      if (fuVN) fuVNSet[fuVN] = true;
    }
  }

  // Find confirmed visits without follow-up, group by hosp_code
  var vsSheet = ss.getSheetByName("VISIT_SUMMARY");
  if (!vsSheet) return { sent: false };

  var vsData = vsSheet.getDataRange().getValues();
  var pendingByHosp = {};

  for (var v = 1; v < vsData.length; v++) {
    if (String(vsData[v][VISIT_SUMMARY_COLS.dispensing_confirmed]) === "Y") {
      var vn = String(vsData[v][VISIT_SUMMARY_COLS.vn]);
      if (!fuVNSet[vn]) {
        var hospCode = String(vsData[v][VISIT_SUMMARY_COLS.hosp_code]);
        if (!pendingByHosp[hospCode]) pendingByHosp[hospCode] = 0;
        pendingByHosp[hospCode]++;
      }
    }
  }

  var codes = Object.keys(pendingByHosp);
  if (codes.length === 0) return { sent: false };

  // Build message
  var systemName = settings.system_name || "Telemed Tracking";
  var message = "<b>" + systemName + "</b>\n";
  message += "แจ้งเตือนผู้ป่วยรอติดตาม\n\n";
  message += "จำนวน " + codes.length + " แห่ง:\n\n";

  var totalPending = 0;
  for (var c = 0; c < codes.length; c++) {
    var hospName = facilitiesMap[codes[c]] || getHospName(codes[c]);
    message += "- " + hospName + ": " + pendingByHosp[codes[c]] + " ราย\n";
    totalPending += pendingByHosp[codes[c]];
  }

  message += "\nรวม " + totalPending + " รายรอติดตาม";

  return sendTelegramMessage(settings, message);
}

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
  if (!SPREADSHEET_ID) return;

  var settings = getSettingsMap();

  // Guard: need bot_token and chat_id for any notification
  var botToken = settings.bot_token || "";
  var chatId = settings.chat_id || "";
  if (!botToken || !chatId) return;

  // --- Clinic Readiness Notification ---
  if (settings.notify_clinic_ready === "Y") {
    var systemName = settings.system_name || "Telemed Tracking";

    // Get tomorrow's date
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowStr = tomorrow.toISOString().split("T")[0];

    var ss = getSpreadsheet();
    var facilitiesMap = getFacilitiesMap();

    // Query tomorrow's clinics
    var csSheet = ss.getSheetByName("CLINIC_SCHEDULE");
    if (csSheet) {
      var csData = csSheet.getDataRange().getValues();
      var clinics = [];

      for (var i = 1; i < csData.length; i++) {
        var serviceDate = toDateStr(csData[i][CLINIC_SCHEDULE_COLS.service_date]);
        if (serviceDate === tomorrowStr) {
          var hospCode = String(csData[i][CLINIC_SCHEDULE_COLS.hosp_code]);
          var hospName = facilitiesMap[hospCode] || getHospName(hospCode);
          var clinicType = String(csData[i][CLINIC_SCHEDULE_COLS.clinic_type]);
          var serviceTime = String(
            csData[i][CLINIC_SCHEDULE_COLS.service_time] || "",
          );
          var appointCount =
            Number(csData[i][CLINIC_SCHEDULE_COLS.appoint_count]) || 0;

          clinics.push({
            hosp_code: hospCode,
            hosp_name: hospName,
            clinic_type: clinicType,
            service_time: serviceTime,
            appoint_count: appointCount,
          });
        }
      }

      // Build message
      var message = "<b>" + systemName + "</b>\n";
      message += "คลินิกวันพรุ่งนี้ (" + tomorrowStr + ")\n\n";

      if (clinics.length === 0) {
        message += "ไม่มีนัดคลินิก\n";
      } else {
        for (var c = 0; c < clinics.length; c++) {
          var clinic = clinics[c];
          message += "- " + clinic.hosp_name + "\n";
          message += "   ประเภท: " + clinic.clinic_type;
          if (clinic.service_time) message += " | เวลา: " + clinic.service_time;
          message += "\n";
          message += "   จำนวนนัด: " + clinic.appoint_count + " ราย\n";
          if (c < clinics.length - 1) message += "\n";
        }
      }

      // Check equipment readiness
      var rlSheet = ss.getSheetByName("READINESS_LOG");
      var notReadyFacilities = [];
      if (rlSheet) {
        var rlData = rlSheet.getDataRange().getValues();
        var latestReadiness = {};
        for (var r = 1; r < rlData.length; r++) {
          var rHospCode = String(rlData[r][READINESS_LOG_COLS.hosp_code]);
          var rCheckDate = toDateStr(rlData[r][READINESS_LOG_COLS.check_date]);
          var rStatus = String(rlData[r][READINESS_LOG_COLS.overall_status]);
          if (
            !latestReadiness[rHospCode] ||
            rCheckDate > latestReadiness[rHospCode].check_date
          ) {
            latestReadiness[rHospCode] = {
              status: rStatus,
              check_date: rCheckDate,
            };
          }
        }

        // Check readiness of facilities with tomorrow's clinics
        var checkedCodes = {};
        for (var cl = 0; cl < clinics.length; cl++) {
          var cHospCode = clinics[cl].hosp_code;
          if (cHospCode && !checkedCodes[cHospCode]) {
            checkedCodes[cHospCode] = true;
            var readiness = latestReadiness[cHospCode];
            if (!readiness || readiness.status !== "ready") {
              notReadyFacilities.push(clinics[cl].hosp_name);
            }
          }
        }
      }

      if (notReadyFacilities.length > 0) {
        message += "\n<b>อุปกรณ์ยังไม่พร้อม:</b>\n";
        for (var nr = 0; nr < notReadyFacilities.length; nr++) {
          message += "  [X] " + notReadyFacilities[nr] + "\n";
        }
      }

      sendTelegramMessage(settings, message);
    }
  }

  // --- Follow-up Reminder Notification ---
  if (settings.notify_followup === "Y") {
    try { buildFollowupReminder(settings); } catch (e) { /* non-critical */ }
  }
}

// ---------------------------------------------------------------------------
// Sheet Setup & Sample Data
// ---------------------------------------------------------------------------

/**
 * setupSheets — Creates all required sheets with header rows.
 * Run once from GAS Editor: select this function and click Run.
 * Safe to re-run: skips sheets that already exist.
 */
function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var sheets = {
    USERS: [
      "user_id", "username", "hosp_code", "first_name", "last_name", "tel",
      "password_hash", "password_salt", "role", "status", "approved_by",
      "session_token", "session_expires", "created_at", "last_login", "force_change",
    ],
    HOSPITAL: ["hosp_code", "hosp_name", "hosp_type", "active"],
    FACILITIES: ["hosp_code", "hosp_name", "contact_name", "contact_tel", "active"],
    EQUIPMENT: [
      "equip_id", "hosp_code", "set_type", "device_type", "os", "status",
      "is_backup", "software", "internet_mbps", "responsible_person",
      "responsible_tel", "note", "updated_at", "updated_by",
    ],
    MASTER_DRUGS: ["drug_id", "drug_name", "strength", "unit", "active"],
    CLINIC_SCHEDULE: [
      "schedule_id", "service_date", "hosp_code", "clinic_type", "service_time",
      "appoint_count", "telemed_link", "link_added_by", "incident_note", "updated_at",
    ],
    READINESS_LOG: [
      "log_id", "hosp_code", "check_date", "cam_ok", "mic_ok", "pc_ok",
      "internet_ok", "software_ok", "overall_status", "note", "checked_by", "checked_at",
    ],
    VISIT_SUMMARY: [
      "vn", "hn", "patient_name", "dob", "tel", "clinic_type", "hosp_code",
      "service_date", "attended", "has_drug_change", "drug_source_pending",
      "dispensing_confirmed", "import_round1_at", "import_round2_at",
      "diff_status", "confirmed_by", "confirmed_at",
      "drug_sent_date", "drug_received_date", "drug_delivered_date",
    ],
    VISIT_MEDS: [
      "med_id", "vn", "drug_name", "strength", "qty", "unit", "sig",
      "source", "is_changed", "round", "status", "note", "updated_by", "updated_at",
    ],
    FOLLOWUP: [
      "followup_id", "vn", "followup_date", "general_condition", "side_effect",
      "drug_adherence", "other_note", "recorded_by", "recorded_at",
    ],
    AUDIT_LOG: [
      "log_id", "user_id", "action", "module", "target_id",
      "old_value", "new_value", "created_at",
    ],
    SETTINGS: ["key", "value"],
  };

  var created = [];
  var skipped = [];

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      skipped.push(name);
    } else {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight("bold");
      sheet.setFrozenRows(1);
      created.push(name);
    }

    // Set Plain Text format (@) for all columns that store codes/IDs/text
    // to prevent Google Sheets from stripping leading zeros (e.g. "00588" → 588)
    var textColumns = [
      "hosp_code", "vn", "hn", "tel", "drug_name",
      "user_id", "equip_id", "schedule_id", "log_id", "drug_id",
      "followup_id", "med_id", "session_token", "password_hash",
      "password_salt", "key", "approved_by", "link_added_by",
      "checked_by", "updated_by", "confirmed_by", "recorded_by",
      "responsible_tel", "contact_tel",
    ];
    for (var col = 0; col < sheets[name].length; col++) {
      if (textColumns.indexOf(sheets[name][col]) !== -1) {
        // Handle multi-letter columns (AA, AB, etc.)
        var colLetter = columnToLetter(col + 1);
        sheet.getRange(colLetter + ":" + colLetter).setNumberFormat("@");
      }
    }
  }

  Logger.log("Setup complete.");
  Logger.log("Created: " + (created.length ? created.join(", ") : "none"));
  Logger.log("Skipped (already exist): " + (skipped.length ? skipped.join(", ") : "none"));
}

/**
 * sampleData — Populates sheets with initial seed data.
 * Run AFTER setupSheets(). Safe to re-run: checks if data exists first.
 *
 * Creates:
 * - HOSPITAL: 16 facilities (1 สสอ. + 1 รพ. + 14 รพ.สต.)
 * - FACILITIES: 14 รพ.สต. (contact info empty)
 * - MASTER_DRUGS: 15 common drugs (drug_id auto-generated)
 * - SETTINGS: 6 default key-value pairs
 * - USERS: 1 super_admin account (hosp_code 00588, password: password123)
 */
function sampleData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // --- HOSPITAL ---
  var hospSheet = ss.getSheetByName("HOSPITAL");
  if (hospSheet && hospSheet.getLastRow() <= 1) {
    var hospitals = [
      ["00588", "สำนักงานสาธารณสุขอำเภอสอง", "สสอ.", "Y"],
      ["11170", "โรงพยาบาลสอง", "รพ.", "Y"],
      ["06413", "รพ.สต.บ้านหนุน", "รพ.สต.", "Y"],
      ["06414", "รพ.สต.ทุ่งน้าว", "รพ.สต.", "Y"],
      ["06415", "รพ.สต.บ้านวังดิน", "รพ.สต.", "Y"],
      ["06416", "รพ.สต.บ้านลูนิเกตุ", "รพ.สต.", "Y"],
      ["06417", "รพ.สต.บ้านห้วยขอน", "รพ.สต.", "Y"],
      ["06418", "รพ.สต.ห้วยหม้าย", "รพ.สต.", "Y"],
      ["06419", "รพ.สต.เตาปูน", "รพ.สต.", "Y"],
      ["06420", "รพ.สต.บ้านนาไร่เดียว", "รพ.สต.", "Y"],
      ["06421", "รพ.สต.หัวเมือง", "รพ.สต.", "Y"],
      ["06422", "รพ.สต.บ้านวังฟ่อน", "รพ.สต.", "Y"],
      ["06423", "รพ.สต.สะเอียบ", "รพ.สต.", "Y"],
      ["06424", "รพ.สต.บ้านป่าเลา", "รพ.สต.", "Y"],
      ["06425", "รพ.สต.บ้านนาหลวง", "รพ.สต.", "Y"],
      ["06426", "รพ.สต.แดนชุมพล", "รพ.สต.", "Y"],
      ["10368", "สถานบริการสาธารณสุขชุมชนแม่แรม", "สสช.", "Y"],
      ["11760", "รพ.สต.บ้านหนองเสี้ยว", "รพ.สต.", "Y"],
    ];
    hospSheet
      .getRange(2, 1, hospitals.length, hospitals[0].length)
      .setValues(hospitals);
    Logger.log("HOSPITAL: inserted " + hospitals.length + " rows");
  } else {
    Logger.log("HOSPITAL: skipped (already has data)");
  }

  // --- FACILITIES ---
  var facSheet = ss.getSheetByName("FACILITIES");
  if (facSheet && facSheet.getLastRow() <= 1) {
    var facilities = [
      ["06413", "รพ.สต.บ้านหนุน", "", "", "Y"],
      ["06414", "รพ.สต.ทุ่งน้าว", "", "", "Y"],
      ["06415", "รพ.สต.บ้านวังดิน", "", "", "Y"],
      ["06416", "รพ.สต.บ้านลูนิเกตุ", "", "", "Y"],
      ["06417", "รพ.สต.บ้านห้วยขอน", "", "", "Y"],
      ["06418", "รพ.สต.ห้วยหม้าย", "", "", "Y"],
      ["06419", "รพ.สต.เตาปูน", "", "", "Y"],
      ["06420", "รพ.สต.บ้านนาไร่เดียว", "", "", "Y"],
      ["06421", "รพ.สต.หัวเมือง", "", "", "Y"],
      ["06422", "รพ.สต.บ้านวังฟ่อน", "", "", "Y"],
      ["06423", "รพ.สต.สะเอียบ", "", "", "Y"],
      ["06424", "รพ.สต.บ้านป่าเลา", "", "", "Y"],
      ["06425", "รพ.สต.บ้านนาหลวง", "", "", "Y"],
      ["06426", "รพ.สต.แดนชุมพล", "", "", "Y"],
      ["10368", "สสช.แม่แรม", "", "", "Y"],
      ["11760", "รพ.สต.บ้านหนองเสี้ยว", "", "", "Y"],
    ];
    facSheet
      .getRange(2, 1, facilities.length, facilities[0].length)
      .setValues(facilities);
    Logger.log("FACILITIES: inserted " + facilities.length + " rows");
  } else {
    Logger.log("FACILITIES: skipped (already has data)");
  }

  // --- MASTER_DRUGS ---
  var drugSheet = ss.getSheetByName("MASTER_DRUGS");
  if (drugSheet && drugSheet.getLastRow() <= 1) {
    var drugs = [
      [Utilities.getUuid(), "Paracetamol", "500 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Amlodipine", "5 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Losartan", "50 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Metformin", "500 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Simvastatin", "20 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Omeprazole", "20 mg", "Capsule", "Y"],
      [Utilities.getUuid(), "Cetirizine", "10 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Amoxicillin", "500 mg", "Capsule", "Y"],
      [Utilities.getUuid(), "Diclofenac", "50 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Prednisolone", "5 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Salbutamol", "2 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Ibuprofen", "400 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Chlorpheniramine", "4 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Ranitidine", "150 mg", "Tablet", "Y"],
      [Utilities.getUuid(), "Diazepam", "5 mg", "Tablet", "Y"],
    ];
    drugSheet.getRange(2, 1, drugs.length, drugs[0].length).setValues(drugs);
    Logger.log("MASTER_DRUGS: inserted " + drugs.length + " rows");
  } else {
    Logger.log("MASTER_DRUGS: skipped (already has data)");
  }

  // --- SETTINGS ---
  var setSheet = ss.getSheetByName("SETTINGS");
  if (setSheet && setSheet.getLastRow() <= 1) {
    var settings = [
      ["bot_token", ""],
      ["chat_id", ""],
      ["system_name", "Telemed Tracking คปสอ.สอง"],
      ["app_url", "https://telemed-song.pages.dev"],
      ["notify_clinic_ready", "Y"],
      ["notify_followup", "Y"],
      ["notify_new_user", "Y"],
    ];
    setSheet
      .getRange(2, 1, settings.length, settings[0].length)
      .setValues(settings);
    Logger.log("SETTINGS: inserted " + settings.length + " rows");
  } else {
    Logger.log("SETTINGS: skipped (already has data)");
  }

  // --- USERS (1 super_admin) ---
  var userSheet = ss.getSheetByName("USERS");
  if (userSheet && userSheet.getLastRow() <= 1) {
    var salt = Utilities.getUuid();
    var hash = hashPassword("password123", salt);
    var now = new Date().toISOString();
    var adminRow = [
      Utilities.getUuid(), // user_id
      "admin", // username
      "00588", // hosp_code (สสอ.สอง)
      "ผู้ดูแลระบบ", // first_name
      "", // last_name
      "", // tel
      hash, // password_hash
      salt, // password_salt
      "super_admin", // role
      "active", // status
      "", // approved_by
      "", // session_token
      "", // session_expires
      now, // created_at
      now, // last_login
      "", // force_change
    ];
    var adminNewRow = userSheet.getLastRow() + 1;
    ensureTextFormat("USERS", adminNewRow);
    userSheet.getRange(adminNewRow, 1, 1, adminRow.length).setValues([adminRow]);
    Logger.log(
      "USERS: inserted 1 super_admin (username=admin, hosp_code=00588, password=password123)",
    );
  } else {
    Logger.log("USERS: skipped (already has data)");
  }

  Logger.log("Sample data complete.");
}
