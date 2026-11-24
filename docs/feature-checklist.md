# LEGALMETRIX Feature Regression Checklist

Baseline recorded before Task 0 follow-on changes.

## Shared authentication and shell

- Login page and public consumer-vigilance mode.
- Email/password login and 1-click demo-account access.
- Demo accounts: Citizen, Inspector, Deputy Controller, Director General, and Administrator.
- Logout and session restoration from browser storage.
- Mobile and desktop sidebar navigation.
- Header notification dropdown, read/unread notification state, GTIN lookup, role switcher, public certificate verification, network status, manual offline synchronization, and view breadcrumb/title.
- Public `/verify/:certificateId` and `?verify=` / `#verify/` certificate verification without authentication.
- Global success/error/info toast notifications.
- Offline queue status and network connectivity indicator.

## Citizen

- Consumer Vigilance dashboard.
- Citizen-specific statistics and market-surveillance overview.
- Inspect own product / quick packaging image check.
- Upload or capture a package photo.
- Predefined demo package catalog and preset loading.
- Live camera scanner and image preview.
- Import packaging evidence from a product URL.
- Quick-test e-commerce URL presets.
- Gemini-assisted statutory OCR and compliance evaluation.
- Offline queueing for package inspections.
- Statutory reports view:
  - Inspection/report selection
  - On-screen report
  - Print report
  - Download PDF report
- Compliance certificate registry and certificate verification.
- Public certificate QR verification.
- National consumer helpline link (1915).
- Evidence and compliance views available after a citizen starts or loads an inspection.

## Inspector

- Field Enforcement dashboard.
- Export surveillance records as CSV.
- New commodity inspection.
- Image photo/camera upload, live camera scanner, and image preview.
- Retail package and wholesale/bulk master-box inspection modes.
- Predefined compliant, violation, contradiction, and bulk-carton demo presets.
- Import from real-time product URL and predefined e-commerce URL presets.
- Multi-panel evidence capture and package-level/bulk-box details.
- Launch Gemini multimodal screening.
- Analysis progress/error/retry/fallback UI.
- Offline queueing and synchronization of buffered inspections.
- Compliance results matrix and statutory rule findings.
- Overall officer determination and remarks.
- Open evidence viewer with bounding boxes, image layers, zoom, pin/tag/reticle modes, recalibration, box calibration, and officer evidence notes.
- Dispute/appeal status review interface.
- Statutory penalty reference.
- Compliance certificate issuance for non-citizen inspections.
- Bulk / e-commerce intake:
  - Manual field master-box entry
  - Marketplace URL batch intake
  - Bulk box evaluation and Rule 26-style exception handling
- Surveillance history with status/category/search filters, CSV export, and record detail navigation.
- Inspection PDF reports with print/download.
- Read-only view of the rule repository.
- Compliance certificate registry.
- Notifications and GTIN registry lookup.

## Deputy Controller

- Enforcement dashboard and all Inspector navigation items.
- Review and finalize officer determinations.
- Adjudicate manufacturer dispute appeals.
- Manufacturer response and officer decision entry.
- Compounding/adjudication status management.
- Review evidence and compliance findings.
- Generate statutory reports.
- Certificate registry access.
- Restricted from editing statutory rules or changing system configuration, per the permission matrix.

## Director General

- Enforcement dashboard and administrative navigation.
- New inspection and bulk/e-commerce intake.
- Surveillance history and reports/audits.
- Rule repository review and permitted rule amendment/codification through the permission matrix.
- Certificate issuance and revocation.
- Executive determination/override and appeal/adjudication access.
- System configuration access.
- Demo-environment management and audit access.
- Notifications and GTIN lookup.

## Administrator

- Enforcement dashboard and all supervisory navigation.
- New inspection and bulk/e-commerce intake.
- Surveillance history and reports/audits.
- Compliance certificate registry, issuance, and revocation.
- Full rule repository:
  - Browse rules
  - Filter/search
  - View rule details and version history
  - Amend rule parameters
  - Create/save rule records
  - Rule audit log
  - Penalty reference
- System configuration:
  - AI confidence and screening-policy controls
  - Demo preset management
  - Database/demo environment reset
  - Audit log review
  - Service/API status and configuration details
- Full audit trail and system audit management.
- Executive determination/override and dispute adjudication access.
- Notifications and GTIN lookup.

## Cross-role compliance and evidence features

- Statutory declaration matrix, including generic name, net quantity, MRP, manufacturer/packer/importer, packing date, consumer care, country of origin, barcode, nutrition, and category-specific fields.
- Deterministic LMPC rule evaluation and Schedule II/font/readability checks.
- Cross-panel consistency and contradiction checks.
- OCR image attribution and 2D bounding-box evidence.
- Original, enhanced, and thresholded image layers.
- Chain-of-custody evidence and tamper-verification hash display.
- Certificate validity, tamper digest, public verification URL, active/revoke state, and PDF/public certificate view.
- Dispute lifecycle states and officer/manufacturer remarks.
- Penalty and statutory reference material.

## API routes

### Health and dashboard

- `GET /api/health`
- `GET /api/dashboard`

### Inspections

- `GET /api/inspections`
- `GET /api/inspections/:id`
- `POST /api/inspections`
- `POST /api/inspections/:id/analyze`
- `POST /api/images/preprocess`
- `POST /api/inspections/:id/verify`
- `POST /api/inspections/:id/dispute`
- `POST /api/inspections/:id/recalibrate-front-ocr`
- `POST /api/inspections/:id/calibrate-box`
- `POST /api/inspections/sync`

### Rules and rule audit

- `GET /api/rules`
- `GET /api/rules/audit-logs`
- `POST /api/rules`
- `PUT /api/rules/:id`

### URL import and bulk intake

- `POST /api/products/fetch-url`
- `POST /api/scrape-url`
- `GET /api/scrape-url`
- `POST /api/intake/url`
- `POST /api/bulk-intake`

### Citizen reports

- `GET /api/citizen/reports`
- `GET /api/citizen/reports/:id`
- `POST /api/citizen/reports`
- `PATCH /api/citizen/reports/:id/status`

### Certificates

- `GET /api/certificates`
- `POST /api/certificates`
- `GET /api/certificates/:id`
- `POST /api/certificates/generate`
- `POST /api/certificates/:id/revoke`

### Audit, notifications, and risk/search

- `GET /api/audit-logs`
- `POST /api/audit-logs`
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `GET /api/risk-scoring`
- `GET /api/search/gtin/:barcode`

### Authentication and demo reset

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/demo-accounts`
- `POST /api/demo/reset`

### Frontend fallback routes

- Vite development middleware and static production fallback are served by the Express app.
- `GET *` SPA fallback in production.
- Public browser route `/verify/:certificateId` (frontend route, backed by `GET /api/certificates/:id`).

## Baseline validation

- Initial lint attempt: failed before compilation because local `tsc` was not present in `node_modules`.
- Dependency restoration: `npm install` completed successfully from the existing package manifest.
- Final baseline lint: `npm run lint` passed (`tsc --noEmit`, exit code 0).
- Final baseline build: `npm run build` passed (exit code 0).
- Build note: Vite emitted a large-chunk warning for the main bundle; no build failure occurred.
