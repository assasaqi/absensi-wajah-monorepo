import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { dbRepository, type DbRole } from '../db/repository'

const JWT_SECRET =
  process.env.JWT_SECRET || 'hadir-absensi-wajah-super-secret-jwt-key-2026'

export interface JwtUserPayload {
  id: number
  nip: string
  nama: string
  role: DbRole
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}

export function signJwtToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

export function verifyJwtToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload
}

/**
 * 3.1 JWT Verification Middleware
 * Validates Bearer token on /api/* routes.
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token autentikasi tidak ditemukan pada header Authorization',
    })
    return
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Format token Bearer tidak valid',
    })
    return
  }

  try {
    const decoded = verifyJwtToken(token)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token JWT tidak valid atau telah kedaluwarsa',
    })
  }
}

/**
 * 3.2 Role-Based Access Control (RBAC) Helper
 * Ensures teacherId owns the target classId (unless user is ADMIN).
 */
export async function checkClassAccess(
  user: JwtUserPayload | undefined,
  classId: number,
): Promise<{
  allowed: boolean
  status: number
  message?: string
}> {
  if (!user) {
    return {
      allowed: false,
      status: 401,
      message: 'Pengguna belum terautentikasi',
    }
  }

  const targetClass = await dbRepository.findClassById(classId)
  if (!targetClass) {
    return {
      allowed: false,
      status: 404,
      message: `Kelas dengan id ${classId} tidak ditemukan`,
    }
  }

  if (user.role !== 'ADMIN' && targetClass.teacherId !== user.id) {
    return {
      allowed: false,
      status: 403,
      message:
        'Akses ditolak (RBAC): Anda tidak memiliki hak akses terhadap kelas ini',
    }
  }

  return { allowed: true, status: 200 }
}
