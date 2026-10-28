import {
  formatIndonesianDate,
  getInitials,
  mapApiRecordToStudentAttendance,
  type ApiAttendanceStatus,
  type AttendanceStatus,
  type ClassRoom,
  type DailyRecapRow,
  type StudentAttendance,
  type TeacherProfile,
} from '~/types/attendance'

const TOKEN_STORAGE_KEY = 'hadir_jwt_token'
const ACTIVE_CLASS_ID_KEY = 'hadir_active_class_id'
const LAST_SCANNED_STUDENT_ID_KEY = 'hadir_last_scanned_student_id'

export function getStoredJwtToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredJwtToken(token: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredJwtToken(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function getActiveClassId(): number {
  if (typeof window === 'undefined') return 1
  const val = Number(window.localStorage.getItem(ACTIVE_CLASS_ID_KEY))
  return Number.isInteger(val) && val > 0 ? val : 1
}

export function setActiveClassId(classId: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACTIVE_CLASS_ID_KEY, String(classId))
}

export async function getValidActiveClassId(): Promise<number> {
  try {
    const classes = await attendanceApi.getActiveClasses()
    if (!classes || classes.length === 0) return 1
    const currentId = getActiveClassId()
    const found = classes.find((c) => c.id === currentId)
    if (found) return found.id
    setActiveClassId(classes[0].id)
    return classes[0].id
  } catch {
    return 1
  }
}

export function getLastScannedStudentId(): number | null {
  if (typeof window === 'undefined') return null
  const val = Number(window.localStorage.getItem(LAST_SCANNED_STUDENT_ID_KEY))
  return Number.isInteger(val) && val > 0 ? val : null
}

export function setLastScannedStudentId(studentId: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LAST_SCANNED_STUDENT_ID_KEY, String(studentId))
}

/**
 * Authenticates against MySQL backend (/api/auth/login) using seeded teacher credentials
 * if no JWT token is present in browser storage.
 */
export async function ensureAuthenticated(): Promise<string> {
  const existing = getStoredJwtToken()
  if (existing) return existing

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nip: '198204241990022001',
      password: 'guru123',
    }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(
      (errBody as { message?: string }).message ||
        'Gagal login ke database MySQL. Pastikan server MySQL aktif dan sudah di-seed (npm run db:push && npm run db:seed).',
    )
  }

  const data = (await res.json()) as { token: string }
  setStoredJwtToken(data.token)
  return data.token
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = await ensureAuthenticated()
  const doRequest = (jwt: string) =>
    fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${jwt}`,
      },
    })

  let res = await doRequest(token)
  if (res.status === 401) {
    clearStoredJwtToken()
    token = await ensureAuthenticated()
    res = await doRequest(token)
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(
      (errBody as { message?: string }).message ||
        `Request ke ${path} gagal (HTTP ${res.status})`,
    )
  }

  return (await res.json()) as T
}

export interface SessionSummaryResponse {
  sessionId: number
  classId: number
  namaKelas: string
  ruangKelas: string | null
  teacher?: {
    id: number
    nama: string
    nip: string
    role: string
  }
  tanggal: string
  status: 'AKTIF' | 'SELESAI'
  catatanGuru: string
  persentase: number
  totalSiswa: number
  totalTercatat: number
  totalHadir: number
  totalIzin: number
  totalSakit: number
  totalAlpa: number
  totalBelumTercatat: number
  records: Array<{
    id: number
    sessionId: number
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
  }>
}

export const attendanceApi = {
  login: async (nip: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, password }),
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(
        (errBody as { message?: string }).message || 'Login gagal',
      )
    }
    const data = (await res.json()) as {
      token: string
      user: { id: number; nama: string; nip: string; role: string }
    }
    setStoredJwtToken(data.token)

    // Reset active class to the first accessible class of this user
    try {
      const classes = await attendanceApi.getActiveClasses()
      if (classes.length > 0) {
        setActiveClassId(classes[0].id)
      }
    } catch {
      // ignore
    }

    return data
  },

  getTeacherProfile: async (): Promise<TeacherProfile> => {
    const me = await apiFetch<{
      id: number
      nama: string
      nip: string
      role: string
    }>('/api/auth/me')
    const dateFmt = formatIndonesianDate()

    const subject =
      me.role === 'ADMIN'
        ? 'Administrator Sistem'
        : me.nip === '198501102010011002'
          ? 'Guru Sosiologi'
          : 'Guru Matematika'

    const homeroomClass =
      me.role === 'ADMIN'
        ? 'Akses Semua Kelas'
        : me.nip === '198501102010011002'
          ? 'Wali Kelas XII IPS 1'
          : 'Wali Kelas XI IPA 1'

    return {
      id: me.id,
      name: me.nama,
      initials: getInitials(me.nama),
      subject,
      nip: me.nip,
      school: 'SMA Negeri 8 Bandung',
      homeroomClass,
      currentDateLabel: dateFmt.full,
      currentDateUpper: dateFmt.upper,
      currentDateShort: dateFmt.short,
    }
  },

  getActiveClasses: async (): Promise<ClassRoom[]> => {
    const rows = await apiFetch<
      Array<{
        id: number
        nama: string
        ruang: string | null
        _count: { students: number }
      }>
    >('/api/classes/active')

    return rows.map((r) => ({
      id: r.id,
      name: r.nama,
      studentCount: r._count.students,
      room: r.ruang || `Ruang ${r.nama}`,
      entryDeadline: '07.30 WIB',
    }))
  },

  getLatestSessionForClass: async (classId: number) => {
    const summary = await apiFetch<SessionSummaryResponse>(
      `/api/classes/${classId}/latest-session`,
    )
    const students: StudentAttendance[] = summary.records.map((rec) =>
      mapApiRecordToStudentAttendance(rec, summary.tanggal),
    )
    return {
      summary,
      students,
    }
  },

  startSession: async (classId: number, tanggal?: string) => {
    const dateIso = tanggal || new Date().toISOString().slice(0, 10)
    return apiFetch<{
      id: number
      classId: number
      tanggal: string
      status: string
    }>('/api/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify({ classId, tanggal: dateIso }),
    })
  },

  scanFace: async (
    sessionId: number,
    payload: { faceVector?: number[]; image?: string },
  ) => {
    return apiFetch<{
      match: boolean
      studentId: number | null
      confidence: number
      student: {
        id: number
        nama: string
        nis: string
        noAbsen: number
        fotoProfil: string
      } | null
    }>('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...payload }),
    })
  },

  recordAttendance: async (params: {
    sessionId: number
    studentId: number
    status: AttendanceStatus
    metode: 'WAJAH' | 'MANUAL'
    catatan?: string
  }) => {
    return apiFetch<{
      id: number
      sessionId: number
      studentId: number
      status: ApiAttendanceStatus
      metode: 'WAJAH' | 'MANUAL'
      waktuPindai: string | null
      catatan: string | null
    }>('/api/attendance/records', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: params.sessionId,
        studentId: params.studentId,
        status: params.status.toUpperCase(),
        metode: params.metode,
        waktuPindai: new Date().toISOString(),
        catatan: params.catatan,
      }),
    })
  },

  completeSession: async (sessionId: number, catatanGuru: string) => {
    return apiFetch<{
      id: number
      classId: number
      tanggal: string
      status: string
      catatanGuru: string
      convertedToAlpa: number
    }>(`/api/attendance/sessions/${sessionId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ catatanGuru }),
    })
  },

  getMonthlyReport: async (classId: number, month: number, year: number) => {
    return apiFetch<{
      summary: {
        classId: number
        namaKelas: string
        month: number
        year: number
        jumlahSiswa: number
        hariSekolah: number
        persentase: number
        persentaseLabel: string
        totalHadir: number
        totalIzin: number
        totalSakit: number
        totalAlpa: number
        totalKehadiran: number
        totalKapasitas: number
      }
      dailyRincian: DailyRecapRow[]
    }>(
      `/api/attendance/reports/monthly?classId=${classId}&month=${month}&year=${year}`,
    )
  },

  getStudentDetail: async (studentId: number) => {
    return apiFetch<{
      student: {
        id: number
        nama: string
        nis: string
        noAbsen: number
        classId: number
        fotoProfil: string
        hasFaceData: boolean
      }
      stats: {
        persentase: number
        totalHadir: number
        totalIzin: number
        totalSakit: number
        totalAlpa: number
        totalTercatat: number
      }
      history: Array<{
        id: number
        tanggal: string
        status: ApiAttendanceStatus
        metode: 'WAJAH' | 'MANUAL'
        waktuPindai: string | null
        catatan: string | null
      }>
    }>(`/api/students/${studentId}`)
  },

  registerStudentFace: async (
    studentId: number,
    payload: { faceVector?: number[]; image?: string; fotoProfil?: string },
  ) => {
    return apiFetch<{
      success: boolean
      message: string
      student: {
        id: number
        nama: string
        nis: string
        noAbsen: number
        fotoProfil: string
      }
    }>(`/api/students/${studentId}/face`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  logout: () => {
    clearStoredJwtToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },
}
