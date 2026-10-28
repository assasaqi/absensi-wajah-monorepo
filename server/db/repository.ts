import type {
  AttendanceMethod,
  AttendanceStatus,
  Role,
} from '@prisma/client'
import { prisma } from './prisma'

export type DbRole = Role
export type DbAttendanceStatus = AttendanceStatus
export type DbAttendanceMethod = AttendanceMethod

const DAY_NAMES_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

class PrismaAttendanceRepository {
  public async findTeacherByNip(nip: string) {
    const normalized = nip.replace(/\s+/g, '')
    return prisma.teacher.findUnique({
      where: { nip: normalized },
    })
  }

  public async findTeacherById(id: number) {
    return prisma.teacher.findUnique({
      where: { id },
    })
  }

  public async findActiveClassesForTeacher(teacherId: number, role: DbRole) {
    return prisma.class.findMany({
      where: role === 'ADMIN' ? {} : { teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            nama: true,
            nip: true,
            role: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { id: 'asc' },
    })
  }

  public async findClassById(classId: number) {
    return prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            nama: true,
            nip: true,
            role: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
    })
  }

  public async findStudentsByClassId(classId: number) {
    return prisma.student.findMany({
      where: { classId },
      orderBy: [{ noAbsen: 'asc' }, { id: 'asc' }],
    })
  }

  public async findStudentById(studentId: number) {
    return prisma.student.findUnique({
      where: { id: studentId },
    })
  }

  public async updateStudentFace(
    studentId: number,
    faceData: number[],
    fotoProfil?: string,
  ) {
    return prisma.student.update({
      where: { id: studentId },
      data: {
        faceData,
        ...(fotoProfil ? { fotoProfil } : {}),
      },
    })
  }

  public async findLatestSessionByClassId(classId: number) {
    return prisma.attendanceSession.findFirst({
      where: { classId },
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
    })
  }

  public async createSession(classId: number, tanggalInput: string) {
    const dateStr = new Date(tanggalInput).toISOString().slice(0, 10)
    const dateObj = new Date(`${dateStr}T00:00:00.000Z`)

    const existing = await prisma.attendanceSession.findFirst({
      where: {
        classId,
        tanggal: dateObj,
      },
    })

    if (existing) {
      return existing
    }

    const students = await prisma.student.findMany({
      where: { classId },
      select: { id: true },
    })

    return prisma.$transaction(async (tx) => {
      const createdSession = await tx.attendanceSession.create({
        data: {
          classId,
          tanggal: dateObj,
          status: 'AKTIF',
        },
      })

      if (students.length > 0) {
        await tx.attendanceRecord.createMany({
          data: students.map((st) => ({
            sessionId: createdSession.id,
            studentId: st.id,
            status: 'BELUM_TERCATAT',
            metode: 'MANUAL',
          })),
          skipDuplicates: true,
        })
      }

      return createdSession
    })
  }

  public async findSessionById(sessionId: number) {
    return prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    })
  }

  public async upsertAttendanceRecord(params: {
    sessionId: number
    studentId: number
    status: DbAttendanceStatus
    metode: DbAttendanceMethod
    waktuPindai?: string | null
    catatan?: string | null
  }) {
    const waktuPindaiDate = params.waktuPindai
      ? new Date(params.waktuPindai)
      : params.status === 'HADIR'
        ? new Date()
        : null

    return prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId: params.sessionId,
          studentId: params.studentId,
        },
      },
      update: {
        status: params.status,
        metode: params.metode,
        waktuPindai: waktuPindaiDate,
        ...(params.catatan !== undefined ? { catatan: params.catatan } : {}),
      },
      create: {
        sessionId: params.sessionId,
        studentId: params.studentId,
        status: params.status,
        metode: params.metode,
        waktuPindai: waktuPindaiDate,
        catatan: params.catatan ?? null,
      },
      include: {
        student: true,
      },
    })
  }

  public async completeSession(sessionId: number, catatanGuru: string) {
    const session = await this.findSessionById(sessionId)
    if (!session) return null

    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.attendanceRecord.updateMany({
        where: {
          sessionId,
          status: 'BELUM_TERCATAT',
        },
        data: {
          status: 'ALPA',
          catatan: 'Tanpa keterangan',
        },
      })

      const updatedSession = await tx.attendanceSession.update({
        where: { id: sessionId },
        data: {
          status: 'SELESAI',
          catatanGuru,
        },
      })

      return {
        id: updatedSession.id,
        classId: updatedSession.classId,
        tanggal: updatedSession.tanggal.toISOString().slice(0, 10),
        status: updatedSession.status,
        catatanGuru: updatedSession.catatanGuru,
        convertedToAlpa: updateResult.count,
      }
    })
  }

  public async getSessionSummary(sessionId: number) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            teacher: {
              select: { id: true, nama: true, nip: true, role: true },
            },
            _count: {
              select: { students: true },
            },
          },
        },
        records: {
          include: {
            student: true,
          },
          orderBy: {
            student: {
              noAbsen: 'asc',
            },
          },
        },
      },
    })

    if (!session) return null

    let totalHadir = 0
    let totalIzin = 0
    let totalSakit = 0
    let totalAlpa = 0
    let totalBelumTercatat = 0

    const enrichedRecords = session.records.map((r) => {
      if (r.status === 'HADIR') totalHadir++
      else if (r.status === 'IZIN') totalIzin++
      else if (r.status === 'SAKIT') totalSakit++
      else if (r.status === 'ALPA') totalAlpa++
      else if (r.status === 'BELUM_TERCATAT') totalBelumTercatat++

      return {
        id: r.id,
        sessionId: r.sessionId,
        studentId: r.studentId,
        status: r.status,
        waktuPindai: r.waktuPindai ? r.waktuPindai.toISOString() : null,
        metode: r.metode,
        catatan: r.catatan,
        student: {
          id: r.student.id,
          nama: r.student.nama,
          nis: r.student.nis,
          noAbsen: r.student.noAbsen,
          fotoProfil: r.student.fotoProfil,
        },
      }
    })

    const totalSiswa =
      session.records.length || session.class._count.students || 0
    const persentase =
      totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0

    return {
      sessionId: session.id,
      classId: session.classId,
      namaKelas: session.class.nama,
      ruangKelas: session.class.ruang,
      teacher: session.class.teacher,
      tanggal: session.tanggal.toISOString().slice(0, 10),
      status: session.status,
      catatanGuru: session.catatanGuru ?? '',
      persentase,
      totalSiswa,
      totalTercatat: totalSiswa - totalBelumTercatat,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlpa,
      totalBelumTercatat,
      records: enrichedRecords,
    }
  }

  public async getMonthlyReport(classId: number, month: number, year: number) {
    const cls = await this.findClassById(classId)
    if (!cls) return null

    const startDate = new Date(Date.UTC(year, month - 1, 1))
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        records: true,
      },
      orderBy: {
        tanggal: 'desc',
      },
    })

    const jumlahSiswa = cls._count.students

    let totalHadir = 0
    let totalIzin = 0
    let totalSakit = 0
    let totalAlpa = 0

    const dailyRincian = sessions.map((ses, index) => {
      let hadir = 0
      let izin = 0
      let sakit = 0
      let alpa = 0

      for (const rec of ses.records) {
        if (rec.status === 'HADIR') hadir++
        else if (rec.status === 'IZIN') izin++
        else if (rec.status === 'SAKIT') sakit++
        else if (rec.status === 'ALPA' || rec.status === 'BELUM_TERCATAT')
          alpa++
      }

      totalHadir += hadir
      totalIzin += izin
      totalSakit += sakit
      totalAlpa += alpa

      const d = ses.tanggal
      const dayNum = d.getUTCDate()
      const monthLabel = MONTH_SHORT_ID[d.getUTCMonth()]
      const dayName = DAY_NAMES_ID[d.getUTCDay()]

      return {
        id: `ses-${ses.id}`,
        sessionId: ses.id,
        tanggal: d.toISOString().slice(0, 10),
        dateLabel: `${dayNum} ${monthLabel}`,
        daySubtitle: index === 0 ? `${dayName} • Terbaru` : dayName,
        hadir,
        izin,
        sakit,
        alpa,
      }
    })

    const hariSekolah = sessions.length
    const totalKapasitas = hariSekolah * jumlahSiswa
    const persentase =
      totalKapasitas > 0
        ? Number(((totalHadir / totalKapasitas) * 100).toFixed(1))
        : 0

    return {
      summary: {
        classId: cls.id,
        namaKelas: cls.nama,
        month,
        year,
        jumlahSiswa,
        hariSekolah,
        persentase,
        persentaseLabel: `${String(persentase).replace('.', ',')}%`,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlpa,
        totalKehadiran: totalHadir,
        totalKapasitas,
      },
      dailyRincian,
    }
  }
}

export const dbRepository = new PrismaAttendanceRepository()
