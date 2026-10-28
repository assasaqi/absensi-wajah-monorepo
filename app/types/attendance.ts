export type AttendanceStatus =
  | 'hadir'
  | 'izin'
  | 'sakit'
  | 'alpa'
  | 'belum_tercatat'

export type ApiAttendanceStatus =
  | 'HADIR'
  | 'IZIN'
  | 'SAKIT'
  | 'ALPA'
  | 'BELUM_TERCATAT'

export interface StudentAttendance {
  id: number
  nis: string
  absenNo: string
  name: string
  initials: string
  avatarColor: 'mint' | 'indigo' | 'amber' | 'stone'
  status: AttendanceStatus
  scanTime: string
  method: string
  note: string
  sessionNote: string
  dateDay: string
  dateMonth: string
}

export interface ClassRoom {
  id: number
  name: string
  studentCount: number
  room: string
  entryDeadline: string
}

export interface DailyRecapRow {
  id: string
  sessionId?: number
  tanggal: string
  dateLabel: string
  daySubtitle: string
  hadir: number
  izin: number
  sakit: number
  alpa: number
}

export interface TeacherProfile {
  id: number
  name: string
  initials: string
  subject: string
  nip: string
  school: string
  homeroomClass: string
  currentDateLabel: string
  currentDateUpper: string
  currentDateShort: string
}

const AVATAR_COLORS: Array<'mint' | 'indigo' | 'amber' | 'stone'> = [
  'stone',
  'indigo',
  'mint',
  'amber',
]

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function formatIndonesianDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date()
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthsFull = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  const monthsShort = [
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

  const dayName = days[d.getDay()]
  const dayNum = d.getDate()
  const monthFull = monthsFull[d.getMonth()]
  const monthShort = monthsShort[d.getMonth()]
  const year = d.getFullYear()

  const full = `${dayName}, ${dayNum} ${monthFull} ${year}`
  return {
    full,
    upper: full.toUpperCase(),
    short: `${dayName}, ${dayNum} ${monthShort} ${year}`,
    dateDay: String(dayNum).padStart(2, '0'),
    dateMonth: monthShort.toUpperCase(),
  }
}

export function formatTimeWib(isoStr: string | null | undefined): string {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return '-'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}.${mm} WIB`
}

export function mapApiRecordToStudentAttendance(
  record: {
    id: number
    studentId: number
    status: ApiAttendanceStatus
    waktuPindai: string | null
    metode: 'WAJAH' | 'MANUAL'
    catatan: string | null
    student: {
      id: number
      nama: string
      nis: string
      noAbsen: number
      fotoProfil: string
    }
  },
  sessionDate?: string,
): StudentAttendance {
  const st = record.student
  const absenNo = String(st.noAbsen).padStart(2, '0')
  const statusLower = record.status.toLowerCase() as AttendanceStatus
  const scanTime = formatTimeWib(record.waktuPindai)
  const dateFmt = formatIndonesianDate(sessionDate)

  const note =
    statusLower === 'hadir'
      ? `${absenNo} • Masuk ${scanTime !== '-' ? scanTime : '07.12 WIB'}`
      : statusLower === 'izin'
        ? `${absenNo} • ${record.catatan || 'Keperluan keluarga'}`
        : statusLower === 'sakit'
          ? `${absenNo} • ${record.catatan || 'Surat orang tua'}`
          : statusLower === 'alpa'
            ? `${absenNo} • ${record.catatan || 'Tanpa keterangan'}`
            : `${absenNo} • Belum tercatat`

  const sessionNote =
    statusLower === 'hadir'
      ? `${scanTime !== '-' ? scanTime : '07.12 WIB'} • ${record.catatan || 'Cocok'}`
      : statusLower === 'izin'
        ? `Surat izin • ${record.catatan || 'Sudah diverifikasi'}`
        : statusLower === 'sakit'
          ? `Surat sakit • ${record.catatan || 'Sudah diverifikasi'}`
          : statusLower === 'alpa'
            ? `Tanpa keterangan • ${record.catatan || 'Dicatat guru'}`
            : 'Belum tercatat • Tunggu keputusan guru'

  return {
    id: st.id,
    nis: st.nis,
    absenNo,
    name: st.nama,
    initials: getInitials(st.nama),
    avatarColor: AVATAR_COLORS[st.id % AVATAR_COLORS.length],
    status: statusLower,
    scanTime,
    method: record.metode === 'WAJAH' ? 'Pengenalan wajah' : 'Input manual',
    note,
    sessionNote,
    dateDay: dateFmt.dateDay,
    dateMonth: dateFmt.dateMonth,
  }
}
