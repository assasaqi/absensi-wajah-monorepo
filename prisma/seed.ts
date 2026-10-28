import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateDeterministicVector } from '../server/utils/faceRecognition'

const prisma = new PrismaClient()

const STUDENT_NAMES = [
  'Aditya Pratama',
  'Ahmad Fauzi',
  'Aisyah Putri',
  'Aldi Taher',
  'Bima Sakti Nugroho',
  'Bagas Kara',
  'Bella Saphira',
  'Citra Kirana Dewi',
  'Chandra Wijaya',
  'Dinda Hauw',
  'Dimas Anggara',
  'Fajar Ramadhan',
  'Farhan Rasyid',
  'Febri Hariyadi',
  'Gilang Dirga Saputra',
  'Gita Gutawa',
  'Hana Saraswati',
  'Intan Permata',
  'Irfan Hakim',
  'Joko Anwar',
  'Kartika Putri',
  'Lesti Kejora',
  'Muhammad Rizki',
  'Nabila Putri',
  'Nadia Vega',
  'Omar Daniel',
  'Prilly Latuconsina',
  'Putri Marino',
  'Rizky Maulana',
  'Raffi Ahmad',
  'Siti Badriah',
  'Syifa Hadju',
  'Titi Kamal',
  'Uus Wijaya',
  'Vanesha Prescilla',
  'Yuki Kato',
]

async function main() {
  console.log('🌱 Memulai proses seeding database MySQL (Prisma)...')

  const defaultPassword = await bcrypt.hash('guru123', 10)
  const adminPassword = await bcrypt.hash('admin123', 10)

  const buRina = await prisma.teacher.upsert({
    where: { nip: '198204241990022001' },
    update: { nama: 'Bu Rina', password: defaultPassword, role: 'GURU' },
    create: {
      nama: 'Bu Rina',
      nip: '198204241990022001',
      password: defaultPassword,
      role: 'GURU',
    },
  })

  const pakBudi = await prisma.teacher.upsert({
    where: { nip: '198501102010011002' },
    update: {
      nama: 'Pak Budi Santoso',
      password: defaultPassword,
      role: 'GURU',
    },
    create: {
      nama: 'Pak Budi Santoso',
      nip: '198501102010011002',
      password: defaultPassword,
      role: 'GURU',
    },
  })

  await prisma.teacher.upsert({
    where: { nip: '197901012005011000' },
    update: {
      nama: 'Administrator Sekolah',
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      nama: 'Administrator Sekolah',
      nip: '197901012005011000',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const classesConfig = [
    { id: 1, nama: 'XI IPA 1', ruang: 'Ruang XI IPA 1', teacherId: buRina.id, count: 36, nisPrefix: '2401' },
    { id: 2, nama: 'XI IPA 2', ruang: 'Ruang XI IPA 2', teacherId: buRina.id, count: 34, nisPrefix: '2402' },
    { id: 3, nama: 'XI IPA 3', ruang: 'Ruang XI IPA 3', teacherId: buRina.id, count: 35, nisPrefix: '2403' },
    { id: 4, nama: 'XII IPS 1', ruang: 'Ruang XII IPS 1', teacherId: pakBudi.id, count: 30, nisPrefix: '2301' },
  ]

  const sessionDate = new Date('2026-10-26T00:00:00.000Z')

  for (const c of classesConfig) {
    const cls = await prisma.class.upsert({
      where: { id: c.id },
      update: { nama: c.nama, ruang: c.ruang, teacherId: c.teacherId },
      create: {
        id: c.id,
        nama: c.nama,
        ruang: c.ruang,
        teacherId: c.teacherId,
      },
    })

    const classStudents = []
    for (let i = 1; i <= c.count; i++) {
      const nama = STUDENT_NAMES[(i - 1 + c.id * 3) % STUDENT_NAMES.length]
      const nis = `${c.nisPrefix}${String(i).padStart(3, '0')}`
      const st = await prisma.student.upsert({
        where: { nis },
        update: {
          nama,
          noAbsen: i,
          classId: cls.id,
          faceData: generateDeterministicVector(i + c.id * 100),
        },
        create: {
          nama,
          nis,
          noAbsen: i,
          classId: cls.id,
          faceData: generateDeterministicVector(i + c.id * 100),
          fotoProfil: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            nama,
          )}&background=E2F2EC&color=146350`,
        },
      })
      classStudents.push(st)
    }

    // Buat sesi absensi aktif untuk setiap kelas
    let session = await prisma.attendanceSession.findFirst({
      where: { classId: cls.id, tanggal: sessionDate },
    })
    if (!session) {
      session = await prisma.attendanceSession.create({
        data: {
          classId: cls.id,
          tanggal: sessionDate,
          status: 'AKTIF',
          catatanGuru:
            '1 siswa belum tercatat. Pilih Hadir, Izin, Sakit, atau Alpa sebelum menyimpan hasil sesi.',
        },
      })
    }

    for (const st of classStudents) {
      const status =
        st.noAbsen === 12 || st.noAbsen === 15
          ? 'IZIN'
          : st.noAbsen === 18
            ? 'SAKIT'
            : st.noAbsen === 29
              ? 'BELUM_TERCATAT'
              : 'HADIR'

      const metode = status === 'HADIR' ? 'WAJAH' : 'MANUAL'
      const waktuPindai =
        status === 'HADIR' ? new Date('2026-10-26T07:12:00.000+07:00') : null
      const catatan =
        st.noAbsen === 12
          ? 'Keperluan keluarga'
          : st.noAbsen === 15
            ? 'Lomba Olimpiade Sains'
            : st.noAbsen === 18
              ? 'Surat orang tua'
              : st.noAbsen === 29
                ? 'Belum tercatat • Tunggu keputusan guru'
                : 'Cocok'

      await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: st.id,
          },
        },
        update: { status, metode, waktuPindai, catatan },
        create: {
          sessionId: session.id,
          studentId: st.id,
          status,
          metode,
          waktuPindai,
          catatan,
        },
      })
    }
  }

  console.log('✅ Seeding seluruh kelas & siswa ke database MySQL selesai!')
}

main()
  .catch((e) => {
    console.error('Gagal melakukan seeding MySQL:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
