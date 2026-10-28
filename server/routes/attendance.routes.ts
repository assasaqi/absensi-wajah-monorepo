import { Router, type Request } from 'express'
import { dbRepository } from '../db/repository'
import { checkClassAccess } from '../middleware/auth'
import { scanRateLimiter } from '../middleware/rateLimit'
import { validateBody, validateQuery } from '../middleware/validate'
import {
  completeSessionSchema,
  createAttendanceRecordSchema,
  createSessionSchema,
  monthlyReportQuerySchema,
  scanAttendanceSchema,
} from '../schemas/validation'
import {
  extractVectorFromImage,
  matchStudentFace,
} from '../utils/faceRecognition'

export const attendanceRouter = Router()

/**
 * 2.3 POST /api/attendance/sessions
 * Payload: { classId, tanggal }
 * Response: 201 Created { id, classId, tanggal, status }
 */
attendanceRouter.post(
  '/sessions',
  validateBody(createSessionSchema),
  async (req, res) => {
    try {
      const { classId, tanggal } = req.body as {
        classId: number
        tanggal: string
      }

      const access = await checkClassAccess(req.user, classId)
      if (!access.allowed) {
        res.status(access.status).json({
          error: access.status === 403 ? 'Forbidden' : 'NotFound',
          message: access.message,
        })
        return
      }

      const session = await dbRepository.createSession(classId, tanggal)
      res.status(201).json({
        id: session.id,
        classId: session.classId,
        tanggal:
          session.tanggal instanceof Date
            ? session.tanggal.toISOString().slice(0, 10)
            : session.tanggal,
        status: session.status,
      })
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal membuat sesi absensi di MySQL',
      })
    }
  },
)

/**
 * 2.3 POST /api/attendance/scan
 * Payload: { sessionId, faceVector | image }
 * Response: 200 OK { match: boolean, studentId, confidence }
 */
attendanceRouter.post(
  '/scan',
  scanRateLimiter,
  validateBody(scanAttendanceSchema),
  async (req, res) => {
    try {
      const { sessionId, faceVector, image } = req.body as {
        sessionId: number
        faceVector?: number[]
        image?: string
      }

      const session = await dbRepository.findSessionById(sessionId)
      if (!session) {
        res.status(404).json({
          error: 'NotFound',
          message: `Sesi absensi dengan id ${sessionId} tidak ditemukan`,
        })
        return
      }

      const access = await checkClassAccess(req.user, session.classId)
      if (!access.allowed) {
        res.status(access.status).json({
          error: access.status === 403 ? 'Forbidden' : 'NotFound',
          message: access.message,
        })
        return
      }

      const students = await dbRepository.findStudentsByClassId(session.classId)
      const queryVector =
        Array.isArray(faceVector) && faceVector.length > 0
          ? faceVector
          : extractVectorFromImage(image || '')

      const result = matchStudentFace(queryVector, students)
      res.status(200).json({
        match: result.match,
        studentId: result.studentId,
        confidence: result.confidence,
        student: result.student,
      })
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal memproses pemindaian wajah di MySQL',
      })
    }
  },
)

/**
 * 2.3 POST /api/attendance/records
 * Payload: { sessionId, studentId, status, metode, waktuPindai, catatan }
 * Response: 201 Created { id, status, ... }
 */
attendanceRouter.post(
  '/records',
  validateBody(createAttendanceRecordSchema),
  async (req, res) => {
    try {
      const { sessionId, studentId, status, metode, waktuPindai, catatan } =
        req.body as {
          sessionId: number
          studentId: number
          status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' | 'BELUM_TERCATAT'
          metode: 'WAJAH' | 'MANUAL'
          waktuPindai?: string | null
          catatan?: string | null
        }

      const session = await dbRepository.findSessionById(sessionId)
      if (!session) {
        res.status(404).json({
          error: 'NotFound',
          message: `Sesi absensi dengan id ${sessionId} tidak ditemukan`,
        })
        return
      }

      const access = await checkClassAccess(req.user, session.classId)
      if (!access.allowed) {
        res.status(access.status).json({
          error: access.status === 403 ? 'Forbidden' : 'NotFound',
          message: access.message,
        })
        return
      }

      const student = await dbRepository.findStudentById(studentId)
      if (!student || student.classId !== session.classId) {
        res.status(400).json({
          error: 'InvalidStudent',
          message: 'Siswa tidak terdaftar pada kelas di sesi absensi ini',
        })
        return
      }

      const record = await dbRepository.upsertAttendanceRecord({
        sessionId,
        studentId,
        status,
        metode,
        waktuPindai,
        catatan,
      })

      res.status(201).json({
        id: record.id,
        sessionId: record.sessionId,
        studentId: record.studentId,
        status: record.status,
        metode: record.metode,
        waktuPindai: record.waktuPindai
          ? record.waktuPindai.toISOString()
          : null,
        catatan: record.catatan,
      })
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan catatan kehadiran ke MySQL',
      })
    }
  },
)

/**
 * 2.3 PUT /api/attendance/sessions/:sessionId/complete
 * Payload: { catatanGuru }
 * Fungsi: Menutup sesi, merubah status siswa BELUM_TERCATAT menjadi ALPA.
 * Response: 200 OK
 */
attendanceRouter.put(
  '/sessions/:sessionId/complete',
  validateBody(completeSessionSchema),
  async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId)
      if (!Number.isInteger(sessionId) || sessionId <= 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Parameter sessionId harus berupa angka bulat positif',
        })
        return
      }

      const session = await dbRepository.findSessionById(sessionId)
      if (!session) {
        res.status(404).json({
          error: 'NotFound',
          message: `Sesi absensi dengan id ${sessionId} tidak ditemukan`,
        })
        return
      }

      const access = await checkClassAccess(req.user, session.classId)
      if (!access.allowed) {
        res.status(access.status).json({
          error: access.status === 403 ? 'Forbidden' : 'NotFound',
          message: access.message,
        })
        return
      }

      const { catatanGuru } = req.body as { catatanGuru: string }
      const result = await dbRepository.completeSession(sessionId, catatanGuru)
      res.status(200).json(result)
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menyelesaikan sesi absensi di MySQL',
      })
    }
  },
)

/**
 * 2.4 GET /api/attendance/sessions/:sessionId/summary
 * Response: 200 OK { persentase, totalHadir, totalIzin, totalSakit, totalAlpa, records: [] }
 */
attendanceRouter.get('/sessions/:sessionId/summary', async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId)
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Parameter sessionId harus berupa angka bulat positif',
      })
      return
    }

    const session = await dbRepository.findSessionById(sessionId)
    if (!session) {
      res.status(404).json({
        error: 'NotFound',
        message: `Sesi absensi dengan id ${sessionId} tidak ditemukan`,
      })
      return
    }

    const access = await checkClassAccess(req.user, session.classId)
    if (!access.allowed) {
      res.status(access.status).json({
        error: access.status === 403 ? 'Forbidden' : 'NotFound',
        message: access.message,
      })
      return
    }

    const summary = await dbRepository.getSessionSummary(sessionId)
    res.status(200).json(summary)
  } catch (err) {
    res.status(500).json({
      error: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal mengambil ringkasan sesi dari MySQL',
    })
  }
})

/**
 * 2.4 GET /api/attendance/reports/monthly
 * Query Params: ?classId=1&month=10&year=2026
 * Response: 200 OK { summary: {...}, dailyRincian: [...] }
 */
attendanceRouter.get(
  '/reports/monthly',
  validateQuery(monthlyReportQuerySchema),
  async (req, res) => {
    try {
      const { classId, month, year } = (
        req as Request & {
          validatedQuery: { classId: number; month: number; year: number }
        }
      ).validatedQuery

      const access = await checkClassAccess(req.user, classId)
      if (!access.allowed) {
        res.status(access.status).json({
          error: access.status === 403 ? 'Forbidden' : 'NotFound',
          message: access.message,
        })
        return
      }

      const report = await dbRepository.getMonthlyReport(classId, month, year)
      res.status(200).json(report)
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal mengambil laporan bulanan dari MySQL',
      })
    }
  },
)
