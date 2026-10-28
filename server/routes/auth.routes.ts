import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { dbRepository } from '../db/repository'
import { authenticateJWT, signJwtToken } from '../middleware/auth'
import { loginRateLimiter } from '../middleware/rateLimit'
import { validateBody } from '../middleware/validate'
import { loginSchema } from '../schemas/validation'

export const authRouter = Router()

/**
 * 2.1 POST /api/auth/login
 * Payload: { nip, password }
 * Response: 200 OK { token, user: { id, nama, nip, role } }
 */
authRouter.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  async (req, res) => {
    try {
      const { nip, password } = req.body as { nip: string; password: string }

      const teacher = await dbRepository.findTeacherByNip(nip)
      if (!teacher) {
        res.status(401).json({
          error: 'InvalidCredentials',
          message: 'NIP atau password salah',
        })
        return
      }

      const isPasswordValid = await bcrypt.compare(password, teacher.password)
      if (!isPasswordValid) {
        res.status(401).json({
          error: 'InvalidCredentials',
          message: 'NIP atau password salah',
        })
        return
      }

      const token = signJwtToken({
        id: teacher.id,
        nip: teacher.nip,
        nama: teacher.nama,
        role: teacher.role,
      })

      res.status(200).json({
        token,
        user: {
          id: teacher.id,
          nama: teacher.nama,
          nip: teacher.nip,
          role: teacher.role,
        },
      })
    } catch (err) {
      res.status(500).json({
        error: 'DatabaseError',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal terhubung ke database MySQL',
      })
    }
  },
)

/**
 * GET /api/auth/me
 * Returns the currently authenticated teacher from MySQL
 */
authRouter.get('/me', authenticateJWT, async (req, res) => {
  try {
    const teacher = await dbRepository.findTeacherById(req.user!.id)
    if (!teacher) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Data guru tidak ditemukan di database',
      })
      return
    }
    res.status(200).json({
      id: teacher.id,
      nama: teacher.nama,
      nip: teacher.nip,
      role: teacher.role,
    })
  } catch (err) {
    res.status(500).json({
      error: 'DatabaseError',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal mengambil profil guru dari MySQL',
    })
  }
})
