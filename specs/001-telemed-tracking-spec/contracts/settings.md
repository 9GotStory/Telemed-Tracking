# Settings API Contract

## settings.get

**Method**: GET
**Access**: super_admin only
**Query Params**: `?action=settings.get&token=xxx`

**Response**:
```json
{
  "success": true,
  "data": {
    "telegram_bot_token": "123456:ABCdef...",
    "telegram_chat_id": "-1001234567890",
    "alert_time": "07:00",
    "system_name": "Telemed Tracking คปสอ.สอง",
    "telegram_active": "Y",
    "app_url": "https://telemed-song.pages.dev"
  }
}
```

**GAS Logic**:
1. Validate caller is super_admin
2. Read all key-value pairs from SETTINGS sheet
3. Return as flat object

---

## settings.save

**Method**: POST
**Access**: super_admin only
**Request Body**:
```json
{
  "action": "settings.save",
  "token": "xxx",
  "data": {
    "telegram_bot_token": "123456:ABCdef...",
    "telegram_chat_id": "-1001234567890",
    "alert_time": "07:00",
    "system_name": "Telemed Tracking คปสอ.สอง",
    "telegram_active": "Y",
    "telegram_test": false
  }
}
```

**OR (Test Send)**:
```json
{
  "action": "settings.save",
  "token": "xxx",
  "data": {
    "telegram_test": true
  }
}
```

**Response (Normal Save)**:
```json
{ "success": true, "data": { "message": "Settings saved" } }
```

**Response (Test Send)**:
```json
{ "success": true, "data": { "message": "Test message sent successfully" } }
```

**Response (Test Send Error)**:
```json
{ "success": false, "error": "Failed to send: invalid bot token" }
```

**GAS Logic**:

**Normal Save** (`telegram_test` is false or absent):
1. Validate caller is super_admin
2. Update each key-value in SETTINGS sheet
3. Log to AUDIT_LOG

**Test Send** (`telegram_test` is true):
1. Read current SETTINGS (bot_token, chat_id)
2. Call Telegram Bot API `sendMessage` with test message
3. Return success/failure
4. Do NOT update settings
