import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app'
import { signJwtToken } from '../server/middleware/auth'
import { generateDeterministicVector } from '../server/utils/faceRecognition'

describe('Backend API Absensi Pengenalan Wajah (PRD Specification)', () => {
  const app = createApp()

  const guruToken = signJwtToken({
    id: 1,
    nip: '198204241990022001',
    nama: 'Bu Rina',
    role: 'GURU',
  })

  const otherGuruToken = signJwtToken({
    id: 2,
    nip: '198501102010011002',
    nama: 'Pak Budi Santoso',
    role: 'GURU',
  })

  const adminToken = signJwtToken({
    id: 3,
    nip: '197901012005011000',
    nama: 'Administrator Sekolah',
    role: 'ADMIN',
  })

  describe('2.1 Autentikasi & Rate Limiting (/api/auth/login)', () => {
    it('harus mengembalikan 400 jika payload tidak valid (Zod validation)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ nip: '12', password: '12' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('ValidationError')
    })

    it('harus mengembalikan 401 jika NIP atau password salah', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ nip: '198204241990022001', password: 'wrongpassword' })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('InvalidCredentials')
    })

    it('harus mengembalikan 200 OK beserta JWT token dan data user saat login berhasil', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ nip: '198204241990022001', password: 'guru123' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('token')
      expect(res.body.user).toMatchObject({
        id: 1,
        nama: 'Bu Rina',
        role: 'GURU',
      })
    })

    it('GET /api/auth/me harus mengembalikan profil guru yang terotentikasi', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        id: 1,
        nama: 'Bu Rina',
        nip: '198204241990022001',
      })
    })
  })

  describe('3.1 & 3.2 Middleware JWT & RBAC', () => {
    it('harus menolak request tanpa header Authorization (401)', async () => {
      const res = await request(app).get('/api/classes/active')
      expect(res.status).toBe(401)
    })

    it('harus menolak request dengan token JWT palsu/rusak (401)', async () => {
      const res = await request(app)
        .get('/api/classes/active')
        .set('Authorization', 'Bearer invalid.jwt.token')
      expect(res.status).toBe(401)
    })

    it('harus mencegah Guru mengakses kelas milik Guru lain (RBAC 403 Forbidden)', async () => {
      // Class 4 belongs to teacherId 2 (Pak Budi), Bu Rina is teacherId 1
      const res = await request(app)
        .get('/api/classes/4/students')
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(403)
      expect(res.body.error).toBe('Forbidden')
    })

    it('harus mengizinkan ADMIN mengakses kelas mana pun', async () => {
      const res = await request(app)
        .get('/api/classes/4/students')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('2.2 Manajemen Kelas & Siswa', () => {
    it('GET /api/classes/active harus mengembalikan daftar kelas guru beserta _count.students', async () => {
      const res = await request(app)
        .get('/api/classes/active')
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toMatchObject({
        id: 1,
        nama: 'XI IPA 1',
      })
      expect(res.body[0]._count).toHaveProperty('students')
    })

    it('GET /api/classes/:classId/students harus mengembalikan daftar siswa beserta faceData', async () => {
      const res = await request(app)
        .get('/api/classes/1/students')
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('nama')
      expect(res.body[0]).toHaveProperty('nis')
      expect(res.body[0]).toHaveProperty('faceData')
    })
  })

  describe('2.3 Transaksi Absensi', () => {
    it('POST /api/attendance/sessions harus membuat sesi baru dengan status AKTIF (201)', async () => {
      const res = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${guruToken}`)
        .send({ classId: 2, tanggal: '2026-10-27' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        classId: 2,
        status: 'AKTIF',
      })
    })

    it('POST /api/attendance/scan harus mengenali vektor wajah siswa dengan akurat (200)', async () => {
      // Ambil siswa pertama dari kelas 1
      const studentsRes = await request(app)
        .get('/api/classes/1/students')
        .set('Authorization', `Bearer ${guruToken}`)
      const firstStudent = studentsRes.body[0]

      const studentVector = Array.isArray(firstStudent.faceData)
        ? firstStudent.faceData
        : generateDeterministicVector(firstStudent.id)

      const res = await request(app)
        .post('/api/attendance/scan')
        .set('Authorization', `Bearer ${guruToken}`)
        .send({
          sessionId: 1,
          faceVector: studentVector,
        })

      expect(res.status).toBe(200)
      expect(res.body.match).toBe(true)
      expect(res.body.studentId).toBe(firstStudent.id)
      expect(res.body.confidence).toBeGreaterThanOrEqual(0.8)
      expect(res.body.student).toMatchObject({
        id: firstStudent.id,
        nama: firstStudent.nama,
        nis: firstStudent.nis,
      })
    })

    it('POST /api/attendance/scan harus mengembalikan match: false jika vektor wajah tidak cocok', async () => {
      const unknownVector = new Array(16)
        .fill(0)
        .map((_, idx) => (idx % 2 === 0 ? 1 : -1))

      const res = await request(app)
        .post('/api/attendance/scan')
        .set('Authorization', `Bearer ${guruToken}`)
        .send({
          sessionId: 1,
          faceVector: unknownVector,
        })

      expect(res.status).toBe(200)
      expect(res.body.match).toBe(false)
      expect(res.body.studentId).toBeNull()
    })

    it('POST /api/attendance/records harus mencatat kehadiran siswa (201)', async () => {
      const studentsRes = await request(app)
        .get('/api/classes/1/students')
        .set('Authorization', `Bearer ${guruToken}`)
      const targetStudent = studentsRes.body[0]

      const res = await request(app)
        .post('/api/attendance/records')
        .set('Authorization', `Bearer ${guruToken}`)
        .send({
          sessionId: 1,
          studentId: targetStudent.id,
          status: 'HADIR',
          metode: 'WAJAH',
          waktuPindai: '2026-10-26T07:12:00.000Z',
        })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        sessionId: 1,
        studentId: targetStudent.id,
        status: 'HADIR',
        metode: 'WAJAH',
      })
    })

    it('PUT /api/attendance/sessions/:sessionId/complete harus menutup sesi', async () => {
      const completeRes = await request(app)
        .put('/api/attendance/sessions/1/complete')
        .set('Authorization', `Bearer ${guruToken}`)
        .send({
          catatanGuru: 'Sesi selesai tepat pukul 07.30 WIB.',
        })

      expect(completeRes.status).toBe(200)
      expect(completeRes.body).toMatchObject({
        id: 1,
        status: 'SELESAI',
        catatanGuru: 'Sesi selesai tepat pukul 07.30 WIB.',
      })
    })
  })

  describe('2.4 Laporan & Rekapitulasi', () => {
    it('GET /api/attendance/sessions/:sessionId/summary harus mengembalikan metrik sesi dan daftar records', async () => {
      const res = await request(app)
        .get('/api/attendance/sessions/1/summary')
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('sessionId', 1)
      expect(res.body).toHaveProperty('classId', 1)
      expect(res.body).toHaveProperty('persentase')
      expect(res.body).toHaveProperty('totalHadir')
      expect(Array.isArray(res.body.records)).toBe(true)
    })

    it('GET /api/attendance/reports/monthly harus mengembalikan rekap bulanan dan rincian harian', async () => {
      const res = await request(app)
        .get('/api/attendance/reports/monthly?classId=1&month=10&year=2026')
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(200)
      expect(res.body.summary).toMatchObject({
        classId: 1,
        namaKelas: 'XI IPA 1',
        month: 10,
        year: 2026,
      })
      expect(Array.isArray(res.body.dailyRincian)).toBe(true)
    })

    it('harus memblokir akses laporan bulanan lintas kelas oleh guru lain (RBAC 403)', async () => {
      const res = await request(app)
        .get('/api/attendance/reports/monthly?classId=1&month=10&year=2026')
        .set('Authorization', `Bearer ${otherGuruToken}`)

      expect(res.status).toBe(403)
    })
  })

  describe('Fitur Baru: Pendaftaran Wajah & Detail Siswa', () => {
    it('GET /api/students/:studentId harus mengembalikan data detail siswa dan riwayat absensi', async () => {
      const studentsRes = await request(app)
        .get('/api/classes/1/students')
        .set('Authorization', `Bearer ${guruToken}`)
      const studentId = studentsRes.body[0].id

      const res = await request(app)
        .get(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${guruToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('student')
      expect(res.body.student).toHaveProperty('nama')
      expect(res.body).toHaveProperty('stats')
      expect(res.body).toHaveProperty('history')
    })

    it('POST /api/students/:studentId/face harus mendaftarkan / memperbarui data wajah siswa', async () => {
      const studentsRes = await request(app)
        .get('/api/classes/1/students')
        .set('Authorization', `Bearer ${guruToken}`)
      const studentId = studentsRes.body[0].id

      const newVector = generateDeterministicVector(999)
      const res = await request(app)
        .post(`/api/students/${studentId}/face`)
        .set('Authorization', `Bearer ${guruToken}`)
        .send({
          faceVector: newVector,
          fotoProfil: 'https://example.com/face-updated.jpg',
        })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        success: true,
        message: 'Wajah siswa berhasil didaftarkan dan disimpan ke database',
      })
    })
  })

  describe('3.3 Rate Limiting pada /api/auth/login (max 5 req/min)', () => {
    it('harus mengembalikan 429 Too Many Requests setelah 5 request login dalam 1 menit', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ nip: '198204241990022001', password: 'guru123' })
      await request(app)
        .post('/api/auth/login')
        .send({ nip: '198204241990022001', password: 'guru123' })

      const sixthRes = await request(app)
        .post('/api/auth/login')
        .send({ nip: '198204241990022001', password: 'guru123' })

      expect(sixthRes.status).toBe(429)
      expect(sixthRes.body.error).toBe('TooManyRequests')
    })
  })
})
