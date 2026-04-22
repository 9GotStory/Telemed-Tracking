# Master Drug API Contract

## masterDrug.list

**Method**: GET
**Access**: All authenticated users (used in Module 5 dropdowns)
**Query Params**: `?action=masterDrug.list&token=xxx&active=Y&search=metformin`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "drug_id": "uuid",
      "drug_name": "Metformin",
      "strength": "500 mg",
      "unit": "เม็ด",
      "active": "Y"
    }
  ]
}
```

**GAS Logic**:
- Return all drugs, optionally filtered by `active` (Y/N) and `search` (text search on drug_name)
- Ordered by drug_name

---

## masterDrug.save

**Method**: POST
**Access**: super_admin, admin_hosp
**Request Body**:
```json
{
  "action": "masterDrug.save",
  "token": "xxx",
  "data": {
    "drug_id": "uuid-or-empty-for-new",
    "drug_name": "Metformin",
    "strength": "500 mg",
    "unit": "เม็ด"
  }
}
```

**Response**:
```json
{ "success": true, "data": { "drug_id": "uuid" } }
```

**Response (Error — FK Violation)**:
```json
{ "success": false, "error": "Cannot change drug_name: referenced in VISIT_MEDS" }
```

**GAS Logic**:
1. If editing existing drug (drug_id provided):
   - Check if `drug_name` changed
   - If changed: query VISIT_MEDS for any row with old drug_name
   - If found: reject with error
2. If new: generate UUID, insert with `active = Y`
3. Log to AUDIT_LOG

---

## masterDrug.delete

**Method**: POST
**Access**: super_admin, admin_hosp
**Request Body**:
```json
{
  "action": "masterDrug.delete",
  "token": "xxx",
  "data": { "drug_id": "uuid" }
}
```

**Response**:
```json
{ "success": true, "data": { "message": "Drug deactivated" } }
```

**GAS Logic**:
1. Set `active = N` (soft delete — never remove row)
2. Log to AUDIT_LOG

---

## masterDrug.import

**Method**: POST
**Access**: super_admin, admin_hosp
**Request Body**:
```json
{
  "action": "masterDrug.import",
  "token": "xxx",
  "data": {
    "drugs": [
      { "drug_name": "Metformin", "strength": "500 mg", "unit": "เม็ด", "active": "Y" },
      { "drug_name": "Amlodipine", "strength": "5 mg", "unit": "เม็ด", "active": "Y" }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "skipped": 3,
    "errors": ["Row 12: drug_name is empty"]
  }
}
```

**GAS Logic**:
1. For each drug in array:
   - Validate: drug_name, strength, unit required
   - Check if drug_name already exists → skip (don't overwrite)
   - If new → insert with generated UUID
2. Return summary counts
3. Log to AUDIT_LOG: action=IMPORT
