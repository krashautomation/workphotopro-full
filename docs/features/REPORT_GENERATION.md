# Report Generation Feature - File Map & Dependency Overview

## Overview

The Work Photo Pro system has a cross-repo report generation feature. The **mobile app** triggers report creation via API calls, while the **web app** handles the actual generation (HTML display and PDF creation).

---

## Repository Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP (WorkPhotoProV2)                         │
│                                                                             │
│  User opens ShareJob → calls POST /api/reports → gets report URL            │
│  Opens web URL in browser OR shares via WhatsApp/Messages/Share sheet       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEB APP (WorkPhotoPro)                            │
│                                                                             │
│  1. POST /api/reports → Creates report in Appwrite                          │
│  2. GET /reports/[reportId] → Renders HTML web report                      │
│  3. PDF generation → Appwrite Function (pdfkit)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile App Files

### Report Trigger & Sharing

| File | Purpose |
|------|---------|
| `app/(jobs)/share-job.tsx` | Main UI - calls `POST https://web.workphotopro.com/api/reports` with jobId, userId, userName |
| `app/(jobs)/share-report-modal.tsx` | Modal for sharing via WhatsApp, Messages, native Share sheet |
| `app/(jobs)/[job].tsx` | Job screen that integrates the report sharing UI |
| `app/(jobs)/job-uploads.tsx` | Upload screen that displays report URL when attached |

### Permissions & Types

| File | Purpose |
|------|---------|
| `hooks/useJobReportsPermission.ts` | Checks `canShareJobReports` membership flag for role-based access |
| `utils/types.ts:288-304` | `Report` TypeScript interface |

### API Interaction

- **Report Creation Endpoint**: `POST {EXPO_PUBLIC_WEB_API_URL}/api/reports`
- **Report URL Format**: `https://web.workphotopro.com/reports/{reportId}`
- **Permissions**: Controlled via `canShareJobReports` on team membership

---

## Web App Files

### Report API (Creation)

| File | Purpose |
|------|---------|
| `app/api/reports/route.ts` | Creates reports from job messages - fetches job chat, extracts text entries & images, stores in Appwrite |

### Report Display (Web UI)

| File | Purpose |
|------|---------|
| `app/(web)/reports/[reportId]/page.tsx` | Displays report - shows company logo/name, job info, chronological text/images, footer |
| `app/(web)/reports/[reportId]/DownloadPdfButton.tsx` | Client component - downloads pre-generated PDF from Appwrite Storage |

### PDF Generation (Appwrite Function)

| File | Purpose |
|------|---------|
| `appwrite-function-pdf/src/main.js` | Main PDF generator - uses pdfkit to create PDF with header, job info, content, footer |
| `appwrite-function-pdf/package.json` | Dependencies: pdfkit@0.15.0, node-appwrite@12.0.0, image-size@1.0.2 |

### Database/Storage Scripts

| File | Purpose |
|------|---------|
| `scripts/setup-reports-collection.js` | Creates Appwrite 'reports' collection with all required attributes |
| `scripts/update-reports-pdf-fields.js` | Adds PDF-related fields to reports collection |
| `scripts/validate-database-types.ts` | TypeScript validation script |

### Types

| File | Purpose |
|------|---------|
| `lib/types.ts` | Defines Report interface with fields: jobId, jobTitle, createdBy, createdByName, textEntries, images, messageCount, orgName, logoUrl, pdfFileId, pdfGeneratedAt |

---

## Current PDF Layout (pdfkit)

### Structure
```
┌────────────────────────────────────────┐
│  HEADER                                │
│  [Logo] Company Name                   │
│  "Job Report" Title                    │
├────────────────────────────────────────┤
│  JOB INFO                              │
│  Job Name                              │
│  Description                           │
│  Date                                  │
├────────────────────────────────────────┤
│  CONTENT (Single Column)              │
│  ┌──────────────────────────────────┐  │
│  │ Text entry (gray background)    │  │
│  └──────────────────────────────────┘  │
│           ┌─────────────┐               │
│           │   Image     │               │
│           │ (50% width) │               │
│           └─────────────┘               │
│  ┌──────────────────────────────────┐  │
│  │ Text entry (gray background)    │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  FOOTER                                │
│  "Generated using Work Photo Pro"      │
└────────────────────────────────────────┘
```

### Limitations
- Single-column layout only
- Images rendered at 50% page width with gray frame
- Text entries have gray background
- No professional title page
- No emoji support (plain text only)

---

## Dependencies & Libraries

### Mobile App
- `expo-clipboard` - Copy report URL to clipboard
- `expo-sharing` - Native share sheet
- `react-native-linking` - Open WhatsApp, Messages, browser

### Web App
- `pdfkit@0.15.0` - PDF generation (server-side)
- `node-appwrite@12.0.0` - Appwrite SDK
- `image-size@1.0.2` - Image dimension detection

### Not Currently Used (Available for Implementation)
- Word export libraries (docx, html-docx-js)
- Emoji rendering libraries (noto-emoji, Twemoji)

---

## Features to Implement

| Feature | Priority | Location | Notes |
|---------|----------|----------|-------|
| Professional title page | High | `appwrite-function-pdf/src/main.js` | Add metadata, branding |
| Two-column layout | High | `appwrite-function-pdf/src/main.js` | Photos/comments side-by-side |
| Emoji rendering | Medium | `appwrite-function-pdf/src/main.js` | Need emoji-compatible font |
| Word export | Low | New API endpoint + library | .docx format |

---

## Implementation Notes

### PDF Generation (Appwrite Function)
- Runs server-side in Appwrite Cloud Functions
- Uses pdfkit for PDF creation
- Stores generated PDF in Appwrite Storage
- Links PDF via `pdfFileId` in report document

### Emoji Handling
- pdfkit renders text as-is (no emoji support built-in)
- Need to embed emoji-compatible font (e.g., Noto Color Emoji)
- Alternative: Use image-based emoji rendering

### Word Export (Not Implemented)
- Would need new API endpoint: `POST /api/reports/[id]/word`
- Libraries to consider: `docx`, `html-docx-js`
- Store in Appwrite Storage similar to PDF

---

## Related Mobile App Code

### Report Creation (share-job.tsx:60-103)
```typescript
const apiUrl = process.env.EXPO_PUBLIC_WEB_API_URL || 'https://web.workphotopro.com/api/reports';
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobId, userId: user.$id, userName: user.name }),
});
const data = await response.json();
// data.reportId, data.reportUrl
```

### Report Sharing (share-report-modal.tsx)
- Copy to clipboard
- Native Share (message + URL)
- WhatsApp direct share
- iMessage/SMS share

---

## Environment Variables

### Mobile App
- `EXPO_PUBLIC_WEB_API_URL` - Web app API base URL (default: https://web.workphotopro.com)

---

*Last updated: March 2026*
