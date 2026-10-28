import { z } from 'zod'

export const loginSchema = z.object({
  nip: z
    .string({ required_error: 'NIP wajib diisi' })
    .trim()
    .min(3, 'NIP minimal 3 karakter'),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(4, 'Password minimal 4 karakter'),
})

export const createSessionSchema = z.object({
  classId: z.coerce
    .number({ required_error: 'classId wajib diisi' })
    .int()
    .positive('classId harus berupa angka positif'),
  tanggal: z
    .string({ required_error: 'tanggal wajib diisi' })
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Format tanggal tidak valid (gunakan YYYY-MM-DD atau ISO string)',
    }),
})

export const scanAttendanceSchema = z
  .object({
    sessionId: z.coerce
      .number({ required_error: 'sessionId wajib diisi' })
      .int()
      .positive('sessionId harus berupa angka positif'),
    faceVector: z
      .array(z.number())
      .min(4, 'faceVector minimal memiliki 4 dimensi')
      .optional(),
    image: z.string().min(4, 'Data gambar tidak valid').optional(),
  })
  .refine(
    (data) =>
      (Array.isArray(data.faceVector) && data.faceVector.length > 0) ||
      (typeof data.image === 'string' && data.image.length > 0),
    {
      message: 'Wajib menyertakan faceVector (array angka) atau image (string)',
      path: ['faceVector'],
    },
  )

export const createAttendanceRecordSchema = z.object({
  sessionId: z.coerce.number().int().positive('sessionId harus angka positif'),
  studentId: z.coerce.number().int().positive('studentId harus angka positif'),
  status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPA', 'BELUM_TERCATAT'], {
    errorMap: () => ({
      message:
        'Status harus salah satu dari HADIR, IZIN, SAKIT, ALPA, atau BELUM_TERCATAT',
    }),
  }),
  metode: z
    .enum(['WAJAH', 'MANUAL'], {
      errorMap: () => ({ message: 'Metode harus WAJAH atau MANUAL' }),
    })
    .default('WAJAH'),
  waktuPindai: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      'waktuPindai harus berupa format ISO DateTime yang valid',
    ),
  catatan: z.string().max(500).nullable().optional(),
})

export const completeSessionSchema = z.object({
  catatanGuru: z
    .string()
    .max(1000, 'Catatan guru maksimal 1000 karakter')
    .optional()
    .default(''),
})

export const monthlyReportQuerySchema = z.object({
  classId: z.coerce.number().int().positive('classId wajib berupa angka positif'),
  month: z.coerce
    .number()
    .int()
    .min(1, 'Bulan minimal 1')
    .max(12, 'Bulan maksimal 12'),
  year: z.coerce
    .number()
    .int()
    .min(2020, 'Tahun minimal 2020')
    .max(2100, 'Tahun maksimal 2100'),
})

export const registerFaceSchema = z
  .object({
    faceVector: z.array(z.number()).min(4).optional(),
    image: z.string().min(4).optional(),
    fotoProfil: z.string().optional(),
  })
  .refine((data) => data.faceVector || data.image || data.fotoProfil, {
    message: 'Wajib menyertakan data faceVector, image, atau fotoProfil',
  })

