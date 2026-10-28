import React, { useEffect, useState } from 'react'
import {
  X,
  User,
  Camera,
  CalendarCheck,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Minus,
} from 'lucide-react'
import { attendanceApi } from '~/lib/apiClient'
import type { StudentAttendance } from '~/types/attendance'
import { Button } from './Button'

export interface StudentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  student?: StudentAttendance
  onOpenManualStatus: (studentId: number) => void
  onOpenFaceEnrollment: (student: StudentAttendance) => void
}

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onOpenManualStatus,
  onOpenFaceEnrollment,
}: StudentDetailModalProps) {
  const [detailData, setDetailData] = useState<{
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
      status: string
      metode: string
      waktuPindai: string | null
      catatan: string | null
    }>
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !student) return

    setLoading(true)
    attendanceApi
      .getStudentDetail(student.id)
      .then((data) => {
        setDetailData(data)
      })
      .catch(() => {
        setDetailData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, student])

  if (!isOpen || !student) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-white text-[#171D1B] rounded-t-3xl sm:rounded-3xl border border-[#E6E4DD] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[88vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DD]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E2F2EC] text-[#146350] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Profil & Riwayat Siswa
              </h3>
              <p className="text-[11px] text-[#6E6D68]">
                Informasi kehadiran individual siswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#6E6D68] hover:text-[#171D1B] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Student Profile Card */}
          <div className="bg-white p-4 rounded-3xl border border-[#E6E4DD] flex items-center gap-4 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-[#E2F2EC] text-[#146350] font-extrabold text-lg flex items-center justify-center border border-[#CBE7DC] shrink-0">
              {student.initials}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-base font-extrabold text-[#171D1B] truncate">
                {student.name}
              </h4>
              <p className="text-xs text-[#146350] font-bold">
                Nomor Absen #{student.absenNo}
              </p>
              <p className="text-[11px] text-[#6E6D68]">NIS: {student.nis}</p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-2xl border border-[#E6E4DD] text-center">
              <p className="text-lg font-extrabold text-[#146350]">
                {detailData?.stats.totalHadir ?? (student.status === 'hadir' ? 1 : 0)}
              </p>
              <p className="text-[10px] text-[#6E6D68] font-bold">Hadir</p>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-[#E6E4DD] text-center">
              <p className="text-lg font-extrabold text-[#283593]">
                {detailData?.stats.totalIzin ?? (student.status === 'izin' ? 1 : 0)}
              </p>
              <p className="text-[10px] text-[#6E6D68] font-bold">Izin</p>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-[#E6E4DD] text-center">
              <p className="text-lg font-extrabold text-[#8C5411]">
                {detailData?.stats.totalSakit ?? (student.status === 'sakit' ? 1 : 0)}
              </p>
              <p className="text-[10px] text-[#6E6D68] font-bold">Sakit</p>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-[#E6E4DD] text-center">
              <p className="text-lg font-extrabold text-[#B42318]">
                {detailData?.stats.totalAlpa ?? (student.status === 'alpa' ? 1 : 0)}
              </p>
              <p className="text-[10px] text-[#6E6D68] font-bold">Alpa</p>
            </div>
          </div>

          {/* Attendance History Section */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-[#4A4945]">
              Riwayat Kehadiran Terakhir
            </h5>
            <div className="bg-white rounded-2xl border border-[#E6E4DD] divide-y divide-[#EFECE6] overflow-hidden">
              {loading ? (
                <div className="p-4 text-center text-xs text-[#6E6D68]">
                  Memuat riwayat dari database...
                </div>
              ) : !detailData?.history?.length ? (
                <div className="p-4 text-center text-xs text-[#6E6D68]">
                  Belum ada catatan riwayat kehadiran
                </div>
              ) : (
                detailData.history.map((h) => {
                  const statusColors: Record<string, string> = {
                    HADIR: 'text-[#146350] bg-[#E2F2EC]',
                    IZIN: 'text-[#283593] bg-[#E9ECF8]',
                    SAKIT: 'text-[#8C5411] bg-[#FBF0D9]',
                    ALPA: 'text-[#B42318] bg-[#FBE6E5]',
                  }
                  return (
                    <div
                      key={h.id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-[#171D1B]">
                          {h.tanggal}
                        </p>
                        <p className="text-[10px] text-[#6E6D68]">
                          Metode: {h.metode} {h.catatan ? `• ${h.catatan}` : ''}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          statusColors[h.status] || 'text-[#4A4945] bg-[#FAF9F6]'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#E6E4DD] flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<CalendarCheck className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose()
                onOpenManualStatus(student.id)
              }}
            >
              Ubah Status
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose()
                onOpenFaceEnrollment(student)
              }}
            >
              Daftar Wajah
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
