import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.routes'
import { classesRouter } from './routes/classes.routes'
import { attendanceRouter } from './routes/attendance.routes'
import { studentsRouter } from './routes/students.routes'
import { authenticateJWT } from './middleware/auth'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  // Public Healthcheck
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'absensi-wajah-backend',
      timestamp: new Date().toISOString(),
    })
  })

  // 2.1 Public Auth Route
  app.use('/api/auth', authRouter)

  // 3.1 Protected API Routes (JWT Verification Middleware)
  app.use('/api/classes', authenticateJWT, classesRouter)
  app.use('/api/students', authenticateJWT, studentsRouter)
  app.use('/api/attendance', authenticateJWT, attendanceRouter)

  // 404 Handler for unknown /api/* endpoints
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'NotFound',
      message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    })
  })

  return app
}

export const app = createApp()
