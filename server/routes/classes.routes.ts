import { Router } from 'express'
import { dbRepository } from '../db/repository'
import { checkClassAccess } from '../middleware/auth'

export const classesRouter = Router()

/**
 * 2.2 GET /api/classes/active
 * Headers: Authorization: Bearer <token>
 * Response: 200 OK [{ id, nama, ruang, teacherId, _count: { students } }]
 */
classesRouter.get('/active', async (req, res) => {
  try {
    const user = req.user!
    const classes = await dbRepository.findActiveClassesForTeacher(
      user.id,
      user.role,
    )
    res.status(200).json(classes)
  } catch (err) {
    res.status(500).json({
      error: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar kelas dari MySQL',
    })
  }
})

/**
 * 2.2 GET /api/classes/:classId/students
 * Headers: Authorization: Bearer <token>
 * Response: 200 OK [{ id, nama, nis, faceData, ... }]
 */
classesRouter.get('/:classId/students', async (req, res) => {
  try {
    const classId = Number(req.params.classId)
    if (!Number.isInteger(classId) || classId <= 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Parameter classId harus berupa angka bulat positif',
      })
      return
    }

    const access = await checkClassAccess(req.user, classId)
    if (!access.allowed) {
      res.status(access.status).json({
        error: access.status === 403 ? 'Forbidden' : 'NotFound',
        message: access.message,
      })
      return
    }

    const students = await dbRepository.findStudentsByClassId(classId)
    res.status(200).json(
      students.map((s) => ({
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        noAbsen: s.noAbsen,
        classId: s.classId,
        fotoProfil: s.fotoProfil,
        faceData: s.faceData,
      })),
    )
  } catch (err) {
    res.status(500).json({
      error: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar siswa dari MySQL',
    })
  }
})

/**
 * GET /api/classes/:classId/latest-session
 * Returns or initializes today's session for the given class in MySQL
 */
classesRouter.get('/:classId/latest-session', async (req, res) => {
  try {
    const classId = Number(req.params.classId)
    if (!Number.isInteger(classId) || classId <= 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Parameter classId harus berupa angka bulat positif',
      })
      return
    }

    const access = await checkClassAccess(req.user, classId)
    if (!access.allowed) {
      res.status(access.status).json({
        error: access.status === 403 ? 'Forbidden' : 'NotFound',
        message: access.message,
      })
      return
    }

    let session = await dbRepository.findLatestSessionByClassId(classId)
    if (!session) {
      const todayIso = new Date().toISOString().slice(0, 10)
      session = await dbRepository.createSession(classId, todayIso)
    }

    const summary = await dbRepository.getSessionSummary(session.id)
    res.status(200).json(summary)
  } catch (err) {
    res.status(500).json({
      error: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal mengambil sesi kelas dari MySQL',
    })
  }
})
