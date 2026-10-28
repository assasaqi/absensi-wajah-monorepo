import React, { useState } from 'react'
import { X, Check, UserCheck } from 'lucide-react'
import type { AttendanceStatus, StudentAttendance } from '~/types/attendance'
import { StatusBadge } from './StatusBadge'
import { Button } from './Button'

export interface ManualAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  students: StudentAttendance[]
  initialStudentId?: number
  onSelectAndSave: (
    studentId: number,
    status: AttendanceStatus,
  ) => void | Promise<void>
  title?: string
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpa', label: 'Alpa' },
]

export function ManualAttendanceModal({
  isOpen,
  onClose,
  students,
  initialStudentId,
  onSelectAndSave,
  title = 'Absensi Manual Siswa',
}: ManualAttendanceModalProps) {
  const [selectedId, setSelectedId] = useState<number>(
    initialStudentId || students[0]?.id || 0,
  )
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatus>('hadir')
  const [isSaving, setIsSaving] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      const targetId = initialStudentId || students[0]?.id || 0
      setSelectedId(targetId)
      const st = students.find((s) => s.id === targetId)
      if (st && st.status !== 'belum_tercatat') {
        setSelectedStatus(st.status)
      } else {
        setSelectedStatus('hadir')
      }
    }
  }, [isOpen, initialStudentId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-white text-[#171D1B] rounded-t-3xl sm:rounded-3xl border border-[#E6E4DD] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DD]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E2F2EC] text-[#146350] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-[11px] text-[#6E6D68]">
                Pilih siswa dan simpan status kehadiran
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

        <div className="my-3.5 overflow-y-auto flex-1 pr-1 space-y-2">
          <label className="block text-xs font-bold text-[#4A4945] mb-1.5">
            Daftar Siswa ({students.length} siswa)
          </label>
          <div className="bg-white rounded-2xl border border-[#E6E4DD] divide-y divide-[#EFECE6]">
            {students.map((st) => {
              const isSelected = st.id === selectedId
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(st.id)
                    if (st.status !== 'belum_tercatat') {
                      setSelectedStatus(st.status)
                    } else {
                      setSelectedStatus('hadir')
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#E8F4EF]/75' : 'hover:bg-[#F9F8F5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-[#146350] text-white'
                          : 'bg-[#EFECE6] text-[#4A4945]'
                      }`}
                    >
                      {st.initials}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#171D1B] truncate">
                        {st.name}{' '}
                        <span className="text-[#6E6D68] font-medium">
                          #{st.absenNo}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#6E6D68] truncate">
                        NIS {st.nis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={isSelected ? selectedStatus : st.status} />
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#146350] stroke-[2.5]" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-[#E6E4DD]">
          <label className="block text-xs font-bold text-[#4A4945] mb-2">
            Pilih Status Kehadiran
          </label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {STATUS_OPTIONS.map((opt) => {
              const active = selectedStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#146350] text-white border-[#146350] shadow-xs'
                      : 'bg-white text-[#4A4945] border-[#E6E4DD] hover:border-[#146350]/40'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2.5">
            <Button
              variant="outline"
              fullWidth={false}
              className="w-1/3"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              fullWidth={false}
              className="w-2/3"
              disabled={isSaving || !selectedId}
              onClick={async () => {
                if (selectedId) {
                  setIsSaving(true)
                  try {
                    await onSelectAndSave(selectedId, selectedStatus)
                  } finally {
                    setIsSaving(false)
                  }
                }
              }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Status'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
