import { Router } from 'express'
import { dbRepository } from '../db/repository'
import { prisma } from '../db/prisma'
import { checkClassAccess } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { registerFaceSchema } from '../schemas/validation'
import {
  extractVectorFromImage,
  generateDeterministicVector,
} from '../utils/faceRecognition'

export const studentsRouter = Router()

/**
 * GET /api/students/:studentId
 * Mengambil profil detail siswa beserta riwayat & statistik kehadiran individual
 */
studentsRouter.get('/:studentId', async (req, res) => {
  try {
    const studentId = Number(req.params.studentId)
    if (!Number.isInteger(studentId) || studentId <= 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Parameter studentId harus berupa angka bulat positif',
      })
      return
    }

    const student = await dbRepository.findStudentById(studentId)
    if (!student) {
      res.status(404).json({
        error: 'NotFound',
        message: `Siswa dengan id ${studentId} tidak ditemukan`,
      })
      return
    }

    const access = await checkClassAccess(req.user, student.classId)
    if (!access.allowed) {
      res.status(access.status).json({
        error: access.status === 403 ? 'Forbidden' : 'NotFound',
        message: access.message,
      })
      return
    }

    // Ambil histori record absensi siswa
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: true,
      },
      orderBy: { session: { tanggal: 'desc' } },
      take: 15,
    })

    let totalHadir = 0
    let totalIzin = 0
    let totalSakit = 0
    let totalAlpa = 0

    for (const r of records) {
      if (r.status === 'HADIR') totalHadir++
      else if (r.status === 'IZIN') totalIzin++
      else if (r.status === 'SAKIT') totalSakit++
      else if (r.status === 'ALPA') totalAlpa++
    }

    const totalTercatat = totalHadir + totalIzin + totalSakit + totalAlpa
    const persentase =
      totalTercatat > 0 ? Math.round((totalHadir / totalTercatat) * 100) : 100

    res.status(200).json({
      student: {
        id: student.id,
        nama: student.nama,
        nis: student.nis,
        noAbsen: student.noAbsen,
        classId: student.classId,
        fotoProfil: student.fotoProfil,
        hasFaceData: !!student.faceData,
      },
      stats: {
        persentase,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlpa,
        totalTercatat,
      },
      history: records.map((r) => ({
        id: r.id,
        tanggal: r.session.tanggal.toISOString().slice(0, 10),
        status: r.status,
        metode: r.metode,
        waktuPindai: r.waktuPindai?.toISOString() || null,
        catatan: r.catatan,
      })),
    })
  } catch (err) {
    res.status(500).json({
      error: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal mengambil detail siswa dari MySQL',
    })
  }
})

/**
 * POST /api/students/:studentId/face
 * Mendaftarkan atau memperbarui vektor wajah & foto profil siswa
 */
studentsRouter.post(
  '/:studentId/face',
  validateBody(registerFaceSchema),
  async (req, res) => {
    try {
      const studentId = Number(req.params.studentId)
      if (!Number.isInteger(studentId) || studentId <= 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Parameter studentId harus berupa angka bulat positif',
        })
        return
      }

      const student = await dbRepository.findStudentById(studentId)
      if (!student) {
        res.status(404).json({
          error: 'NotFound',
          message: `Siswa dengan id ${studentId} tidak ditemukan`,
        })
        return
      }

      const access = await checkClassAccess(req.user, student.classId)
      if (!access.allowed) {
        res.status(access.status).json({
          error: access.status === 403 ? 'Forbidden' : 'NotFound',
          message: access.message,
        })
        return
      }

      const { faceVector, image, fotoProfil } = req.body as {
        faceVector?: number[]
        image?: string
        fotoProfil?: string
      }

      const vectorToSave =
        Array.isArray(faceVector) && faceVector.length > 0
          ? faceVector
          : image
            ? extractVectorFromImage(image, student.id)
            : generateDeterministicVector(student.id)

      const updated = await dbRepository.updateStudentFace(
        student.id,
        vectorToSave,
        fotoProfil,
      )

      res.status(200).json({
        success: true,
        message: 'Wajah siswa berhasil didaftarkan dan disimpan ke database',
        student: {
          id: updated.id,
          nama: updated.nama,
          nis: updated.nis,
          noAbsen: updated.noAbsen,
          fotoProfil: updated.fotoProfil,
        },
      })
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal mendaftarkan wajah siswa ke MySQL',
      })
    }
  },
)
