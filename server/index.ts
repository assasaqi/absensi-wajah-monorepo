import 'dotenv/config'
import { app } from './app'

const PORT = Number(process.env.PORT) || 3001

const server = app.listen(PORT, () => {
  console.log(
    `🚀 [API] Server Absensi Pengenalan Wajah berjalan di http://localhost:${PORT}`,
  )
  console.log(`   - POST /api/auth/login`)
  console.log(`   - GET  /api/classes/active`)
  console.log(`   - GET  /api/classes/:classId/students`)
  console.log(`   - POST /api/attendance/sessions`)
  console.log(`   - POST /api/attendance/scan`)
  console.log(`   - POST /api/attendance/records`)
  console.log(`   - PUT  /api/attendance/sessions/:sessionId/complete`)
  console.log(`   - GET  /api/attendance/sessions/:sessionId/summary`)
  console.log(`   - GET  /api/attendance/reports/monthly`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.log(
      `ℹ️ [API] Port ${PORT} sudah digunakan oleh instance server API yang sedang aktif (http://localhost:${PORT}).`,
    )
    process.exit(0)
  } else {
    console.error('❌ [API] Server error:', err)
    process.exit(1)
  }
})
