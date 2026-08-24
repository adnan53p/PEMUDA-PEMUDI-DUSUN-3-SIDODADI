# Phase 02 — Organization Public Pages

Implemented:
- Homepage visual preserved, hero image corrected to an Indonesia-based youth community photo and overlay lightened.
- Public route `/profil`.
- Public route `/keabsahan` with document archive UI and PDF preview modal.
- Public route `/kepengurusan` with professional organization chart.
- Navbar and footer updated to use valid React Router destinations.
- Hash route scroll manager for links back to homepage sections.
- One sample PDF is included only to test preview behavior and is clearly marked as NOT an official document.

Intentionally not implemented:
- Real official document data (not provided yet).
- Real names/photos of officers (not provided yet).
- Login / Superadmin / Admin / Humas.
- Activity workspace, RAB, finance transactions, LPJ.
- Backend/database.

Verification:
- TypeScript/TSX syntax transpile: PASS (23 files).
- Full npm build could not be run in the audit environment because npm dependency installation timed out; run `npm install` then `npm run build` locally.
