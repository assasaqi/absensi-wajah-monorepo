import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app'

describe('Pengujian Login Seluruh Akun Guru & Admin', () => {
  const app = createApp()

  const accounts = [
    {
      roleName: 'Guru Matematika (Bu Rina)',
      nip: '198204241990022001',
      password: 'guru123',
      expectedName: 'Bu Rina',
      expectedRole: 'GURU',
    },
    {
      roleName: 'Guru Sosiologi (Pak Budi Santoso)',
      nip: '198501102010011002',
      password: 'guru123',
      expectedName: 'Pak Budi Santoso',
      expectedRole: 'GURU',
    },
    {
      roleName: 'Administrator Sekolah',
      nip: '197901012005011000',
      password: 'admin123',
      expectedName: 'Administrator Sekolah',
      expectedRole: 'ADMIN',
    },
  ]

  for (const acc of accounts) {
    it(`harus berhasil login untuk akun: ${acc.roleName} (NIP: ${acc.nip})`, async () => {
      // 1. Test POST /api/auth/login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          nip: acc.nip,
          password: acc.password,
        })

      expect(loginRes.status).toBe(200)
      expect(loginRes.body).toHaveProperty('token')
      expect(loginRes.body.user).toMatchObject({
        nama: acc.expectedName,
        nip: acc.nip,
        role: acc.expectedRole,
      })

      const token = loginRes.body.token

      // 2. Test GET /api/auth/me dengan token hasil login
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(meRes.status).toBe(200)
      expect(meRes.body).toMatchObject({
        nama: acc.expectedName,
        nip: acc.nip,
        role: acc.expectedRole,
      })

      // 3. Test GET /api/classes/active untuk memastikan hak akses kelas sesuai peran
      const classesRes = await request(app)
        .get('/api/classes/active')
        .set('Authorization', `Bearer ${token}`)

      expect(classesRes.status).toBe(200)
      expect(Array.isArray(classesRes.body)).toBe(true)

      console.log(`\n✅ [LOGIN SUKSES] ${acc.roleName}`)
      console.log(`   - User ID : ${meRes.body.id}`)
      console.log(`   - Nama    : ${meRes.body.nama}`)
      console.log(`   - NIP     : ${meRes.body.nip}`)
      console.log(`   - Role    : ${meRes.body.role}`)
      console.log(`   - Kelas   : ${classesRes.body.map((c: any) => c.nama).join(', ')}`)
    })
  }
})
