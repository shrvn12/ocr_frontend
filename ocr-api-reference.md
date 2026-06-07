# OCR Backend — Complete API Reference

Base URL: `http://localhost:5000/api/v1`

All responses follow the envelope:
```json
{ "success": true|false, "message": "...", "data": {...}|[...], "meta": {...} }
```
`meta` appears on paginated list endpoints: `{ total, page, limit, totalPages }`

Authentication: Pass `Authorization: Bearer <accessToken>` on all protected routes.

---

## Role Definitions

| Role | Description |
|---|---|
| `PUBLIC` | No token required |
| `UPLOADER` | Can upload documents, see own documents only |
| `REVIEWER` | Can review, correct, approve, reject documents |
| `ADMIN` | Full access to everything |

---

## 1. Auth Module

### POST /auth/register
**Access:** PUBLIC

Create a new user account. Returns the user object and a JWT token pair.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Full name (2–100 chars) |
| `email` | string | ✅ | Unique email address |
| `password` | string | ✅ | Min 8 chars — needs uppercase, lowercase, number, symbol |
| `role` | enum | ❌ | `ADMIN` \| `REVIEWER` \| `UPLOADER` (default: `UPLOADER`) |

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "cuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "UPLOADER",
      "createdAt": "2024-06-15T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": "7d"
    }
  }
}
```

---

### POST /auth/login
**Access:** PUBLIC

Authenticate with email and password. Returns JWT token pair.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ | Registered email |
| `password` | string | ✅ | Account password |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "cuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "REVIEWER"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": "7d"
    }
  }
}
```

---

### POST /auth/refresh
**Access:** PUBLIC

Exchange a refresh token for a new token pair.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `refreshToken` | string | ✅ | Valid refresh JWT |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Tokens refreshed.",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": "7d"
    }
  }
}
```

---

### GET /auth/me
**Access:** ADMIN, REVIEWER, UPLOADER

Get the currently authenticated user's profile and document count.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "REVIEWER",
    "isActive": true,
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z",
    "_count": {
      "documents": 12
    }
  }
}
```

---

### PATCH /auth/me/password
**Access:** ADMIN, REVIEWER, UPLOADER

Change own account password.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `currentPassword` | string | ✅ | Existing password |
| `newPassword` | string | ✅ | Must differ from current; same complexity rules |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Password updated successfully.",
  "data": null
}
```

---

### GET /auth/users
**Access:** ADMIN only

List all registered users with pagination.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `page` | number | ❌ | Page number (default: 1) |
| `limit` | number | ❌ | Per page (default: 20) |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "REVIEWER",
      "isActive": true,
      "createdAt": "2024-06-15T10:00:00.000Z",
      "_count": { "documents": 5 }
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### PATCH /auth/users/:userId/toggle-active
**Access:** ADMIN only

Activate or deactivate a user account.

**Response: 200 OK**
```json
{
  "success": true,
  "message": "User deactivated.",
  "data": {
    "id": "cuid",
    "name": "John Doe",
    "email": "john@example.com",
    "isActive": false
  }
}
```

---

## 2. Document Module

### POST /documents/upload
**Access:** UPLOADER, ADMIN

Upload a document image. Streams to Cloudinary, creates a DB record, and auto-triggers OCR in the background. Responds immediately without waiting for OCR.

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|---|---|---|---|
| `document` | file | ✅ | jpeg / png / webp / tiff / pdf — max 10MB |

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Document uploaded. OCR processing started.",
  "data": {
    "id": "cuid",
    "originalName": "weighbridge-slip.jpg",
    "cloudinaryUrl": "https://res.cloudinary.com/your-cloud/image/upload/...",
    "cloudinaryId": "ocr-documents/1718445600000-weighbridge-slip.jpg",
    "status": "UPLOADED",
    "uploadedBy": {
      "id": "cuid",
      "name": "Truck Operator",
      "email": "operator@example.com"
    },
    "extractedFields": [],
    "createdAt": "2024-06-15T10:00:00.000Z"
  }
}
```

---

### GET /documents
**Access:** ADMIN, REVIEWER, UPLOADER (UPLOADERs see only their own)

List documents with optional status filter. UPLOADERs are automatically scoped to their own documents.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 20, max: 100 |
| `status` | enum | ❌ | `UPLOADED` \| `OCR_PROCESSING` \| `OCR_FAILED` \| `READY_FOR_REVIEW` \| `APPROVED` \| `REJECTED` |
| `uploadedById` | string | ❌ | Filter by uploader (ADMIN / REVIEWER only) |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "originalName": "weighbridge-slip.jpg",
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "status": "APPROVED",
      "uploadedBy": { "id": "cuid", "name": "Truck Operator" },
      "extractedFields": [
        { "fieldName": "vehicle_number", "finalValue": "MH12AB1234", "confidence": 0.921 },
        { "fieldName": "weight", "finalValue": "5200.00", "confidence": 0.874 },
        { "fieldName": "date", "finalValue": "2024-06-15", "confidence": 0.95 }
      ],
      "_count": { "auditLogs": 4 },
      "createdAt": "2024-06-15T10:00:00.000Z"
    }
  ],
  "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6 }
}
```

---

### GET /documents/:id
**Access:** ADMIN, REVIEWER, UPLOADER (own only)

Get a single document with all extracted fields and the last 20 audit events.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "originalName": "weighbridge-slip.jpg",
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "cloudinaryId": "ocr-documents/...",
    "status": "READY_FOR_REVIEW",
    "ocrRawText": "Vehicle No: MH12AB1234\nWeight: 5200 Kgs\nDate: 15/06/2024",
    "ocrProcessedAt": "2024-06-15T10:05:00.000Z",
    "reviewedAt": null,
    "reviewNotes": null,
    "uploadedBy": { "id": "cuid", "name": "Truck Operator", "email": "operator@example.com" },
    "extractedFields": [
      {
        "id": "cuid",
        "fieldName": "vehicle_number",
        "rawValue": "MH12AB1234",
        "correctedValue": null,
        "finalValue": "MH12AB1234",
        "confidence": 0.921,
        "isManuallySet": false
      },
      {
        "id": "cuid",
        "fieldName": "weight",
        "rawValue": "5200.00",
        "correctedValue": null,
        "finalValue": "5200.00",
        "confidence": 0.874,
        "isManuallySet": false
      },
      {
        "id": "cuid",
        "fieldName": "date",
        "rawValue": "2024-06-15",
        "correctedValue": null,
        "finalValue": "2024-06-15",
        "confidence": 0.95,
        "isManuallySet": false
      }
    ],
    "auditLogs": [
      {
        "id": "cuid",
        "action": "OCR_COMPLETED",
        "oldValue": null,
        "newValue": "READY_FOR_REVIEW",
        "fieldName": null,
        "metadata": { "avgConfidence": "0.915", "fieldsExtracted": ["vehicle_number", "weight", "date"] },
        "user": { "id": "cuid", "name": "Truck Operator", "role": "UPLOADER" },
        "createdAt": "2024-06-15T10:05:00.000Z"
      }
    ]
  }
}
```

---

### PATCH /documents/:id/status
**Access:** ADMIN only

Manually override document status. Enforces valid state transitions.

**Valid transitions:**
- `UPLOADED` → `OCR_PROCESSING`
- `OCR_PROCESSING` → `OCR_FAILED` | `READY_FOR_REVIEW`
- `OCR_FAILED` → `OCR_PROCESSING`
- `READY_FOR_REVIEW` → `APPROVED` | `REJECTED`
- `REJECTED` → `OCR_PROCESSING`
- `APPROVED` → (terminal — no transitions)

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `status` | enum | ✅ | Target status — must be a valid transition from current |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Document status updated.",
  "data": {
    "id": "cuid",
    "status": "OCR_PROCESSING",
    "updatedAt": "2024-06-15T10:10:00.000Z"
  }
}
```

---

### DELETE /documents/:id
**Access:** ADMIN (any doc) | UPLOADER (own doc in UPLOADED status only)

Delete a document and its Cloudinary asset. Cascade deletes extracted fields and audit logs.

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Document deleted successfully.",
  "data": null
}
```

---

## 3. OCR Module

### POST /ocr/:documentId/process
**Access:** ADMIN only

Manually trigger the full OCR pipeline. Normally this runs automatically after upload.

**Pipeline:** Vision API → parse fields → upsert extracted_fields → status `READY_FOR_REVIEW`

**Response: 200 OK**
```json
{
  "success": true,
  "message": "OCR processing complete.",
  "data": {
    "id": "cuid",
    "status": "READY_FOR_REVIEW",
    "ocrRawText": "Vehicle No: MH12AB1234\nWeight: 5200 Kgs\nDate: 15/06/2024",
    "ocrProcessedAt": "2024-06-15T10:05:00.000Z",
    "extractedFields": [
      { "fieldName": "vehicle_number", "rawValue": "MH12AB1234", "finalValue": "MH12AB1234", "confidence": 0.921 },
      { "fieldName": "weight", "rawValue": "5200.00", "finalValue": "5200.00", "confidence": 0.874 },
      { "fieldName": "date", "rawValue": "2024-06-15", "finalValue": "2024-06-15", "confidence": 0.95 }
    ]
  }
}
```

---

### POST /ocr/:documentId/retry
**Access:** ADMIN, REVIEWER

Retry OCR on a document with status `OCR_FAILED` or `REJECTED`. Resets all extracted fields.

**Response: 200 OK**
```json
{
  "success": true,
  "message": "OCR retry successful.",
  "data": {
    "id": "cuid",
    "status": "READY_FOR_REVIEW",
    "ocrProcessedAt": "2024-06-15T11:00:00.000Z",
    "extractedFields": [
      { "fieldName": "vehicle_number", "rawValue": "MH12AB1234", "finalValue": "MH12AB1234", "confidence": 0.934 },
      { "fieldName": "weight", "rawValue": "5200.00", "finalValue": "5200.00", "confidence": 0.891 },
      { "fieldName": "date", "rawValue": "2024-06-15", "finalValue": "2024-06-15", "confidence": 0.961 }
    ]
  }
}
```

---

### GET /ocr/:documentId/result
**Access:** ADMIN, REVIEWER, UPLOADER (own docs only)

Get parsed OCR fields with per-field confidence and a summary. Document must be in `READY_FOR_REVIEW`, `APPROVED`, or `REJECTED` status.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "documentId": "cuid",
    "status": "READY_FOR_REVIEW",
    "ocrRawText": "Vehicle No: MH12AB1234\nWeight: 5200 Kgs\nDate: 15/06/2024",
    "ocrProcessedAt": "2024-06-15T10:05:00.000Z",
    "extractedFields": [
      {
        "id": "cuid",
        "fieldName": "vehicle_number",
        "rawValue": "MH12AB1234",
        "correctedValue": null,
        "finalValue": "MH12AB1234",
        "confidence": 0.921,
        "isManuallySet": false
      },
      {
        "id": "cuid",
        "fieldName": "weight",
        "rawValue": "52OO.00",
        "correctedValue": null,
        "finalValue": "52OO.00",
        "confidence": 0.58,
        "isManuallySet": false
      },
      {
        "id": "cuid",
        "fieldName": "date",
        "rawValue": "2024-06-15",
        "correctedValue": null,
        "finalValue": "2024-06-15",
        "confidence": 0.95,
        "isManuallySet": false
      }
    ],
    "summary": {
      "totalFields": 3,
      "extractedCount": 3,
      "correctedCount": 0,
      "avgConfidence": 0.817
    }
  }
}
```

---

## 4. Review Module

### GET /reviews
**Access:** ADMIN, REVIEWER

FIFO queue of all `READY_FOR_REVIEW` documents. Oldest-processed first. Filterable by confidence range and correction status.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 20 |
| `minConfidence` | number | ❌ | 0–1 — docs with at least one field above this value |
| `maxConfidence` | number | ❌ | 0–1 — docs with at least one field below this value |
| `hasCorrections` | boolean | ❌ | `true` = only docs with at least one manual correction |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "originalName": "weighbridge-slip.jpg",
      "status": "READY_FOR_REVIEW",
      "ocrProcessedAt": "2024-06-15T10:05:00.000Z",
      "uploadedBy": { "id": "cuid", "name": "Truck Operator" },
      "extractedFields": [
        { "fieldName": "vehicle_number", "finalValue": "MH12AB1234", "confidence": 0.921 },
        { "fieldName": "weight", "finalValue": "52OO.00", "confidence": 0.58 },
        { "fieldName": "date", "finalValue": "2024-06-15", "confidence": 0.95 }
      ],
      "_count": { "auditLogs": 2 },
      "_meta": {
        "avgConfidence": 0.817,
        "correctedCount": 0,
        "missingCount": 0
      }
    }
  ],
  "meta": { "total": 34, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

### GET /reviews/:id
**Access:** ADMIN, REVIEWER

Full review view for a single document. Includes per-field flags (`needsReview`, `isCorrected`, `isMissing`) and the complete audit trail.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "originalName": "weighbridge-slip.jpg",
    "status": "READY_FOR_REVIEW",
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "ocrRawText": "Vehicle No: MH12AB1234\nWeight: 52OO Kgs\nDate: 15/06/2024",
    "uploadedBy": { "id": "cuid", "name": "Truck Operator", "email": "operator@example.com" },
    "extractedFields": [
      {
        "id": "cuid",
        "fieldName": "vehicle_number",
        "rawValue": "MH12AB1234",
        "correctedValue": null,
        "finalValue": "MH12AB1234",
        "confidence": 0.921,
        "isManuallySet": false,
        "needsReview": false,
        "isCorrected": false,
        "isMissing": false
      },
      {
        "id": "cuid",
        "fieldName": "weight",
        "rawValue": "52OO.00",
        "correctedValue": null,
        "finalValue": "52OO.00",
        "confidence": 0.58,
        "isManuallySet": false,
        "needsReview": true,
        "isCorrected": false,
        "isMissing": false
      }
    ],
    "auditLogs": [
      {
        "action": "OCR_COMPLETED",
        "newValue": "READY_FOR_REVIEW",
        "user": { "id": "cuid", "name": "Truck Operator", "role": "UPLOADER" },
        "createdAt": "2024-06-15T10:05:00.000Z"
      }
    ],
    "_meta": {
      "avgConfidence": 0.817,
      "correctedCount": 0,
      "missingCount": 0,
      "lowConfCount": 1
    }
  }
}
```

> **Note:** `needsReview: true` when `confidence < 0.75`. Fields are flagged automatically — no client-side threshold logic needed.

---

### PATCH /reviews/:id/fields
**Access:** ADMIN, REVIEWER

Correct a single extracted field. Creates an audit log entry with old value, new value, and optional reason.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `fieldName` | enum | ✅ | `vehicle_number` \| `weight` \| `date` |
| `correctedValue` | string | ✅ | New corrected value (1–255 chars) |
| `reason` | string | ❌ | Correction reason — stored in audit log (max 500 chars) |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Field corrected successfully.",
  "data": {
    "id": "cuid",
    "fieldName": "weight",
    "rawValue": "52OO.00",
    "correctedValue": "5200.00",
    "finalValue": "5200.00",
    "confidence": 0.58,
    "isManuallySet": true,
    "updatedAt": "2024-06-15T11:00:00.000Z"
  }
}
```

---

### PATCH /reviews/:id/fields/bulk
**Access:** ADMIN, REVIEWER

Correct multiple fields atomically in a single transaction. If any field is invalid, the entire batch rolls back. No-op corrections (same value) are silently skipped.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `corrections` | array | ✅ | Array of `{ fieldName, correctedValue, reason? }` — min 1 item |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "2 field(s) corrected successfully.",
  "data": [
    {
      "fieldName": "vehicle_number",
      "rawValue": "MH 12 AB 1234",
      "correctedValue": "MH12AB1234",
      "finalValue": "MH12AB1234",
      "isManuallySet": true
    },
    {
      "fieldName": "date",
      "rawValue": "15-06-2024",
      "correctedValue": "2024-06-15",
      "finalValue": "2024-06-15",
      "isManuallySet": true
    }
  ]
}
```

---

### POST /reviews/:id/approve
**Access:** ADMIN, REVIEWER

Approve a document. Commits `finalValue` for all fields (`correctedValue ?? rawValue`) and sets status to `APPROVED`.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `notes` | string | ❌ | Optional reviewer notes (max 1000 chars) |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Document approved successfully.",
  "data": {
    "id": "cuid",
    "status": "APPROVED",
    "reviewedAt": "2024-06-15T11:30:00.000Z",
    "reviewNotes": null,
    "extractedFields": [
      { "fieldName": "vehicle_number", "finalValue": "MH12AB1234", "isManuallySet": false },
      { "fieldName": "weight", "finalValue": "5200.00", "isManuallySet": true },
      { "fieldName": "date", "finalValue": "2024-06-15", "isManuallySet": false }
    ]
  }
}
```

---

### POST /reviews/:id/reject
**Access:** ADMIN, REVIEWER

Reject a document. Rejection `notes` are mandatory (min 5 chars). Document can be re-processed via `POST /ocr/:id/retry`.

**Request Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `notes` | string | ✅ | Rejection reason — min 5 chars, max 1000 chars |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Document rejected.",
  "data": {
    "id": "cuid",
    "status": "REJECTED",
    "reviewedAt": "2024-06-15T11:45:00.000Z",
    "reviewNotes": "Image too blurry to verify weight value reliably."
  }
}
```

---

## 5. Audit Module

### GET /audit
**Access:** ADMIN only

Global audit log across all documents and users. Filterable by action type, user, and date range.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 50 |
| `action` | enum | ❌ | `FIELD_CORRECTED` \| `STATUS_CHANGED` \| `DOCUMENT_APPROVED` \| `DOCUMENT_REJECTED` \| `OCR_COMPLETED` \| `DOCUMENT_UPLOADED` |
| `userId` | string | ❌ | Filter by actor user ID |
| `fromDate` | string | ❌ | ISO date string e.g. `2024-01-01` |
| `toDate` | string | ❌ | ISO date string |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "action": "FIELD_CORRECTED",
      "fieldName": "weight",
      "oldValue": "52OO.00",
      "newValue": "5200.00",
      "metadata": { "reason": "OCR misread zero as letter O" },
      "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" },
      "document": { "id": "cuid", "originalName": "slip.jpg", "status": "APPROVED" },
      "createdAt": "2024-06-15T11:00:00.000Z"
    }
  ],
  "meta": { "total": 480, "page": 1, "limit": 50, "totalPages": 10 }
}
```

---

### GET /audit/documents/:documentId
**Access:** ADMIN, REVIEWER, UPLOADER

Full chronological audit trail for a single document. Returns all events in descending order.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 50 |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "action": "DOCUMENT_APPROVED",
      "oldValue": "READY_FOR_REVIEW",
      "newValue": "APPROVED",
      "fieldName": null,
      "metadata": { "notes": null },
      "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" },
      "createdAt": "2024-06-15T11:30:00.000Z"
    },
    {
      "id": "cuid",
      "action": "FIELD_CORRECTED",
      "fieldName": "weight",
      "oldValue": "52OO.00",
      "newValue": "5200.00",
      "metadata": { "reason": "OCR misread zero as letter O" },
      "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" },
      "createdAt": "2024-06-15T11:00:00.000Z"
    },
    {
      "id": "cuid",
      "action": "OCR_COMPLETED",
      "newValue": "READY_FOR_REVIEW",
      "metadata": {
        "fieldsExtracted": ["vehicle_number", "weight", "date"],
        "rawTextLength": 58,
        "wordCount": 12,
        "avgConfidence": "0.817"
      },
      "user": { "id": "cuid", "name": "Truck Operator", "role": "UPLOADER" },
      "createdAt": "2024-06-15T10:05:00.000Z"
    },
    {
      "id": "cuid",
      "action": "DOCUMENT_UPLOADED",
      "newValue": "UPLOADED",
      "metadata": { "originalName": "slip.jpg", "fileSize": 204800, "format": "jpg" },
      "user": { "id": "cuid", "name": "Truck Operator", "role": "UPLOADER" },
      "createdAt": "2024-06-15T10:00:00.000Z"
    }
  ],
  "meta": { "total": 4, "page": 1, "limit": 50, "totalPages": 1 }
}
```

---

### GET /audit/users/me
**Access:** ADMIN, REVIEWER, UPLOADER

View own audit activity log.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `action` | enum | ❌ | Filter by action type |
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 50 |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "action": "FIELD_CORRECTED",
      "fieldName": "weight",
      "oldValue": "52OO.00",
      "newValue": "5200.00",
      "document": { "id": "cuid", "originalName": "slip.jpg", "status": "APPROVED" },
      "createdAt": "2024-06-15T11:00:00.000Z"
    }
  ],
  "meta": { "total": 38, "page": 1, "limit": 50, "totalPages": 1 }
}
```

---

### GET /audit/users/:userId
**Access:** ADMIN only

View any user's activity log.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `action` | enum | ❌ | Filter by action type |
| `page / limit` | number | ❌ | Pagination |

**Response:** Same shape as `GET /audit/users/me`

---

### GET /audit/fields/:fieldName
**Access:** ADMIN, REVIEWER

All corrections ever made to a specific field type across all documents.

**Path Params:**
| Param | Values | Description |
|---|---|---|
| `fieldName` | `vehicle_number` \| `weight` \| `date` | Field to inspect |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "action": "FIELD_CORRECTED",
      "fieldName": "weight",
      "oldValue": "52OO.00",
      "newValue": "5200.00",
      "metadata": { "reason": "OCR misread zero as O" },
      "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" },
      "document": { "id": "cuid", "originalName": "slip.jpg", "status": "APPROVED" },
      "createdAt": "2024-06-15T11:00:00.000Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 50, "totalPages": 1 }
}
```

---

### GET /audit/stats/corrections
**Access:** ADMIN only

Aggregated correction statistics — which fields get corrected most, top correcting users, action breakdown.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "correctionsByField": [
      { "fieldName": "weight", "count": 42 },
      { "fieldName": "vehicle_number", "count": 18 },
      { "fieldName": "date", "count": 9 }
    ],
    "topCorrectingUsers": [
      { "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" }, "count": 38 },
      { "user": { "id": "cuid", "name": "System Admin", "role": "ADMIN" }, "count": 31 }
    ],
    "actionBreakdown": [
      { "action": "FIELD_CORRECTED", "count": 69 },
      { "action": "DOCUMENT_APPROVED", "count": 210 },
      { "action": "DOCUMENT_REJECTED", "count": 14 },
      { "action": "OCR_COMPLETED", "count": 249 },
      { "action": "DOCUMENT_UPLOADED", "count": 249 }
    ]
  }
}
```

---

## 6. Search Module

### GET /search
**Access:** ADMIN, REVIEWER, UPLOADER

Universal search across document filename and all extracted field values.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search term — matches filename, vehicle number, weight, date |
| `page` | number | ❌ | Default: 1 |
| `limit` | number | ❌ | Default: 20 |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": "cuid",
      "originalName": "weighbridge-slip.jpg",
      "status": "APPROVED",
      "extractedFields": [
        { "fieldName": "vehicle_number", "finalValue": "MH12AB1234", "confidence": 0.921 }
      ],
      "uploadedBy": { "id": "cuid", "name": "Truck Operator" }
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### GET /search/vehicle
**Access:** ADMIN, REVIEWER, UPLOADER

Search by vehicle number. Input is normalised (spaces and dashes stripped, uppercased). Partial match supported.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `vehicleNumber` | string | ✅ | Partial or full plate — `MH12`, `MH12AB1234`, `mh 12 ab 1234` all work |
| `status` | enum | ❌ | Widen scope (default: APPROVED only; ADMIN can pass any status) |
| `page / limit` | number | ❌ | Pagination |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": "cuid",
      "status": "APPROVED",
      "extractedFields": [
        { "fieldName": "vehicle_number", "rawValue": "MH12AB1234", "finalValue": "MH12AB1234", "confidence": 0.921 },
        { "fieldName": "weight", "finalValue": "5200.00", "confidence": 0.874 },
        { "fieldName": "date", "finalValue": "2024-06-15", "confidence": 0.95 }
      ],
      "uploadedBy": { "id": "cuid", "name": "Truck Operator" }
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### GET /search/date
**Access:** ADMIN, REVIEWER, UPLOADER

Search by document date range. Matches against the extracted `date` field (stored as `YYYY-MM-DD`).

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `fromDate` | string | ❌ | `YYYY-MM-DD` — at least one of fromDate/toDate required |
| `toDate` | string | ❌ | `YYYY-MM-DD` |
| `status` | enum | ❌ | Optional status filter |
| `page / limit` | number | ❌ | Pagination |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": "cuid",
      "status": "APPROVED",
      "extractedFields": [
        { "fieldName": "date", "finalValue": "2024-06-15", "confidence": 0.95 }
      ]
    }
  ],
  "meta": { "total": 18, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### GET /search/status
**Access:** ADMIN, REVIEWER, UPLOADER

Get all documents in a given workflow status.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `status` | enum | ✅ | `UPLOADED` \| `OCR_PROCESSING` \| `OCR_FAILED` \| `READY_FOR_REVIEW` \| `APPROVED` \| `REJECTED` |
| `page / limit` | number | ❌ | Pagination |

> **Note:** UPLOADERs can only search `APPROVED` or `REJECTED` documents.

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": "cuid",
      "originalName": "slip.jpg",
      "status": "READY_FOR_REVIEW",
      "extractedFields": [...],
      "_count": { "auditLogs": 2 }
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### GET /search/confidence
**Access:** ADMIN, REVIEWER, UPLOADER

Find documents where extracted fields fall above or below a confidence threshold.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `threshold` | number | ✅ | 0–1 confidence value |
| `operator` | enum | ❌ | `above` \| `below` (default: `below`) |
| `fieldName` | enum | ❌ | Narrow to `vehicle_number` \| `weight` \| `date` (default: any field) |
| `page / limit` | number | ❌ | Pagination |

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": "cuid",
      "status": "READY_FOR_REVIEW",
      "extractedFields": [
        { "fieldName": "weight", "rawValue": "52OO.00", "confidence": 0.58, "isManuallySet": false }
      ],
      "uploadedBy": { "id": "cuid", "name": "Truck Operator" }
    }
  ],
  "meta": { "total": 7, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

## 7. Dashboard Module

### GET /dashboard
**Access:** ADMIN, REVIEWER

Full aggregated dashboard — all metrics in a single call.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `days` | number | ❌ | Throughput window in days (default: 30) |

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "statusCounts": {
      "uploaded": 4,
      "ocrProcessing": 1,
      "ocrFailed": 2,
      "pendingReview": 18,
      "approved": 210,
      "rejected": 14,
      "total": 249
    },
    "confidence": {
      "overall": { "high": 580, "medium": 124, "low": 43 },
      "byField": {
        "vehicle_number": { "high": 201, "medium": 38, "low": 8 },
        "weight": { "high": 178, "medium": 56, "low": 13 },
        "date": { "high": 201, "medium": 30, "low": 22 }
      },
      "totalFields": 747,
      "avgConfidence": 0.871
    },
    "throughput": [
      { "date": "2024-06-01", "uploaded": 8, "approved": 6, "rejected": 1 },
      { "date": "2024-06-02", "uploaded": 11, "approved": 9, "rejected": 0 }
    ],
    "correctionRate": {
      "totalExtracted": 747,
      "totalCorrected": 69,
      "correctionRate": 9.24,
      "byField": [
        { "fieldName": "weight", "correctedCount": 42 },
        { "fieldName": "vehicle_number", "correctedCount": 18 },
        { "fieldName": "date", "correctedCount": 9 }
      ]
    },
    "recentActivity": [
      {
        "action": "DOCUMENT_APPROVED",
        "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" },
        "document": { "id": "cuid", "originalName": "slip.jpg", "status": "APPROVED" },
        "createdAt": "2024-06-15T11:30:00.000Z"
      }
    ],
    "generatedAt": "2024-06-15T12:00:00.000Z"
  }
}
```

---

### GET /dashboard/status
**Access:** ADMIN, REVIEWER

Status bucket counts only.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "uploaded": 4,
    "ocrProcessing": 1,
    "ocrFailed": 2,
    "pendingReview": 18,
    "approved": 210,
    "rejected": 14,
    "total": 249
  }
}
```

---

### GET /dashboard/confidence
**Access:** ADMIN, REVIEWER

Confidence distribution — high (≥0.85) / medium (0.65–0.84) / low (<0.65) — broken down by field.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "overall": { "high": 580, "medium": 124, "low": 43 },
    "byField": {
      "vehicle_number": { "high": 201, "medium": 38, "low": 8 },
      "weight": { "high": 178, "medium": 56, "low": 13 },
      "date": { "high": 201, "medium": 30, "low": 22 }
    },
    "totalFields": 747,
    "avgConfidence": 0.871
  }
}
```

---

### GET /dashboard/throughput
**Access:** ADMIN, REVIEWER

Daily upload / approve / reject counts as a time series.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `days` | number | ❌ | Window size in days (default: 30) |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    { "date": "2024-06-01", "uploaded": 8, "approved": 6, "rejected": 1 },
    { "date": "2024-06-02", "uploaded": 11, "approved": 9, "rejected": 0 },
    { "date": "2024-06-03", "uploaded": 6, "approved": 5, "rejected": 2 }
  ]
}
```

---

### GET /dashboard/correction-rate
**Access:** ADMIN, REVIEWER

How often OCR-extracted fields are manually corrected — overall and per field.

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "totalExtracted": 747,
    "totalCorrected": 69,
    "correctionRate": 9.24,
    "byField": [
      { "fieldName": "weight", "correctedCount": 42 },
      { "fieldName": "vehicle_number", "correctedCount": 18 },
      { "fieldName": "date", "correctedCount": 9 }
    ]
  }
}
```

---

### GET /dashboard/activity
**Access:** ADMIN, REVIEWER

Recent audit event feed — latest N events across all documents.

**Query Params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `limit` | number | ❌ | Number of events to return (default: 10) |

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "action": "DOCUMENT_APPROVED",
      "fieldName": null,
      "oldValue": "READY_FOR_REVIEW",
      "newValue": "APPROVED",
      "user": { "id": "cuid", "name": "Lead Reviewer", "role": "REVIEWER" },
      "document": { "id": "cuid", "originalName": "slip.jpg", "status": "APPROVED" },
      "createdAt": "2024-06-15T11:30:00.000Z"
    }
  ]
}
```

---

## Error Responses

All errors follow the same envelope:

```json
{
  "success": false,
  "message": "Human-readable error description.",
  "errors": [ { "field": "email", "message": "must be a valid email" } ]
}
```

`errors` array only appears on validation failures (400).

| HTTP Status | When |
|---|---|
| `400` | Validation failed, invalid status transition, bad request |
| `401` | Missing token, invalid token, expired token, wrong password |
| `403` | Insufficient role, deactivated account, accessing another user's data |
| `404` | Document / user / field not found |
| `409` | Email already registered, duplicate record |
| `413` | File exceeds `MAX_FILE_SIZE_MB` limit |
| `415` | Unsupported file MIME type |
| `502` | Cloudinary upload failed, Google Vision API error |
| `500` | Unexpected server error |

---

## Health Check

### GET /health
**Access:** PUBLIC — no auth, no rate limit

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-06-15T10:00:00.000Z"
}
```

---

## Quick Reference — All Endpoints

| Method | Path | Roles |
|---|---|---|
| POST | /api/v1/auth/register | PUBLIC |
| POST | /api/v1/auth/login | PUBLIC |
| POST | /api/v1/auth/refresh | PUBLIC |
| GET | /api/v1/auth/me | All |
| PATCH | /api/v1/auth/me/password | All |
| GET | /api/v1/auth/users | ADMIN |
| PATCH | /api/v1/auth/users/:userId/toggle-active | ADMIN |
| POST | /api/v1/documents/upload | UPLOADER, ADMIN |
| GET | /api/v1/documents | All |
| GET | /api/v1/documents/:id | All |
| PATCH | /api/v1/documents/:id/status | ADMIN |
| DELETE | /api/v1/documents/:id | ADMIN, UPLOADER* |
| POST | /api/v1/ocr/:documentId/process | ADMIN |
| POST | /api/v1/ocr/:documentId/retry | ADMIN, REVIEWER |
| GET | /api/v1/ocr/:documentId/result | All |
| GET | /api/v1/reviews | ADMIN, REVIEWER |
| GET | /api/v1/reviews/:id | ADMIN, REVIEWER |
| PATCH | /api/v1/reviews/:id/fields | ADMIN, REVIEWER |
| PATCH | /api/v1/reviews/:id/fields/bulk | ADMIN, REVIEWER |
| POST | /api/v1/reviews/:id/approve | ADMIN, REVIEWER |
| POST | /api/v1/reviews/:id/reject | ADMIN, REVIEWER |
| GET | /api/v1/audit | ADMIN |
| GET | /api/v1/audit/documents/:documentId | All |
| GET | /api/v1/audit/users/me | All |
| GET | /api/v1/audit/users/:userId | ADMIN |
| GET | /api/v1/audit/fields/:fieldName | ADMIN, REVIEWER |
| GET | /api/v1/audit/stats/corrections | ADMIN |
| GET | /api/v1/search | All |
| GET | /api/v1/search/vehicle | All |
| GET | /api/v1/search/date | All |
| GET | /api/v1/search/status | All |
| GET | /api/v1/search/confidence | All |
| GET | /api/v1/dashboard | ADMIN, REVIEWER |
| GET | /api/v1/dashboard/status | ADMIN, REVIEWER |
| GET | /api/v1/dashboard/confidence | ADMIN, REVIEWER |
| GET | /api/v1/dashboard/throughput | ADMIN, REVIEWER |
| GET | /api/v1/dashboard/correction-rate | ADMIN, REVIEWER |
| GET | /api/v1/dashboard/activity | ADMIN, REVIEWER |
| GET | /health | PUBLIC |
