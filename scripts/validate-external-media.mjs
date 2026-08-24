import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const failures = []
const requireText = (rel, needle, note = needle) => {
  if (!exists(rel) || !read(rel).includes(needle)) failures.push(`${rel}: missing ${note}`)
}
const forbidText = (rel, needle, note = needle) => {
  if (exists(rel) && read(rel).includes(needle)) failures.push(`${rel}: forbidden ${note}`)
}

requireText('src/data/mediaUploadService.ts', "IMAGEKIT_FUNCTION = 'imagekit-media'", 'ImageKit Edge Function target')
requireText('src/data/mediaUploadService.ts', 'supabase.functions.invoke', 'authenticated Supabase Edge Function invocation')
requireText('src/components/internal/ActivityMediaManager.tsx', "scope: 'activity-photo'", 'ImageKit activity photo upload')
requireText('src/components/internal/ActivityMediaManager.tsx', "provider === 'imagekit'", 'ImageKit media deletion path')
requireText('src/pages/internal/HumasWorkspace.tsx', "scope: 'transaction-evidence'", 'Humas private evidence upload')
requireText('src/pages/internal/AdminFinancePage.tsx', "scope: 'transaction-evidence'", 'Admin private evidence upload')
requireText('src/components/internal/SecureEvidencePreview.tsx', 'fetchExternalMediaBlob(transactionId)', 'signed private evidence fetch')
requireText('supabase/migrations/202608240005_external_media_imagekit.sql', "add value if not exists 'imagekit'", 'ImageKit media provider enum')
requireText('supabase/migrations/202608240005_external_media_imagekit.sql', 'external_file_id', 'ImageKit fileId persistence')
requireText('supabase/migrations/202608240005_external_media_imagekit.sql', "provider = 'imagekit'", 'ImageKit evidence provider')
requireText('supabase/functions/imagekit-media/index.ts', 'IMAGEKIT_PRIVATE_KEY', 'server-only ImageKit private key')
requireText('supabase/functions/imagekit-media/index.ts', 'https://upload.imagekit.io/api/v1/files/upload', 'ImageKit server upload')
requireText('supabase/functions/imagekit-media/index.ts', "body.set('isPrivateFile', isPrivateFile ? 'true' : 'false')", 'private evidence flag')
requireText('supabase/functions/imagekit-media/index.ts', "handleSignedUrl", 'short-lived signed evidence URL')
requireText('supabase/functions/imagekit-media/index.ts', 'imageKitFileDetails', 'file scope verification before delete')
requireText('src/prototype/activityMedia.ts', "'youtube'", 'YouTube provider')
requireText('src/prototype/activityMedia.ts', "'google-drive'", 'Google Drive provider')

// Binary media must never switch to Supabase Storage and secrets must never enter React/Vite.
for (const rel of [
  'src/data/mediaUploadService.ts',
  'src/components/internal/ActivityMediaManager.tsx',
  'src/pages/internal/HumasWorkspace.tsx',
  'src/pages/internal/AdminFinancePage.tsx',
]) {
  forbidText(rel, '.storage.from(', 'Supabase Storage usage')
  forbidText(rel, 'IMAGEKIT_PRIVATE_KEY', 'ImageKit private key in frontend')
  forbidText(rel, 'service_role', 'service-role in frontend')
  forbidText(rel, 'VITE_MEDIA_API_URL', 'legacy Cloudflare media API env')
}

forbidText('.env.example', 'VITE_IMAGEKIT_PRIVATE_KEY', 'private key exposed as Vite variable')
forbidText('.env.example', 'VITE_MEDIA_API_URL', 'legacy Cloudflare media API env')
if (exists('cloudflare/media-api/src/index.ts')) failures.push('Legacy Cloudflare Worker must not ship in ImageKit final package')

// Public snapshot may expose evidence presence, never the private evidence URL.
const phase03 = read('supabase/migrations/202608240003_phase03_operations_finance.sql')
if (!phase03.includes("'evidence_present'")) failures.push('Phase03 public snapshot: evidence_present missing')
const publicTxBlock = phase03.slice(phase03.indexOf("'transactions'"), phase03.indexOf("'reports'"))
if (/['"]url['"]\s*,\s*(?:te\.)?url/i.test(publicTxBlock)) failures.push('Public snapshot appears to expose transaction evidence URL')

if (failures.length) {
  console.error('EXTERNAL MEDIA IMAGEKIT AUDIT: FAIL')
  failures.forEach((item) => console.error(`- ${item}`))
  process.exit(1)
}

console.log('EXTERNAL MEDIA IMAGEKIT + VIDEO AUDIT: PASS')
console.log('ImageKit upload broker, private evidence signing, file-scope deletion, Supabase metadata-only persistence, and video-link separation checked.')
