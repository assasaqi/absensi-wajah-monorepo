import React, { useState } from 'react'
import {
  X,
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react'
import type { StudentAttendance } from '~/types/attendance'
import { Button } from './Button'

export interface FaceEnrollmentListModalProps {
  isOpen: boolean
  onClose: () => void
  students: StudentAttendance[]
  onSelectStudent: (student: StudentAttendance) => void
}

export function FaceEnrollmentListModal({
  isOpen,
  onClose,
  students,
  onSelectStudent,
}: FaceEnrollmentListModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'unscanned' | 'all'>('unscanned')

  if (!isOpen) return null

  // A student is considered "unscanned" if their attendance method is not WAJAH, or note/status indicates so
  const unscannedStudents = students.filter(
    (s) => s.method !== 'WAJAH',
  )
  const scannedStudents = students.filter((s) => s.method === 'WAJAH')

  const baseList = filterMode === 'unscanned' ? unscannedStudents : students

  const filteredStudents = baseList.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.absenNo.includes(q)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[440px] bg-white text-[#171D1B] rounded-t-3xl sm:rounded-3xl border border-[#E6E4DD] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DD]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E2F2EC] text-[#146350] flex items-center justify-center">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Pendaftaran Wajah Siswa
              </h3>
              <p className="text-[11px] text-[#6E6D68]">
                Daftar siswa untuk pemindaian dan rekaman wajah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#6E6D68] hover:text-[#171D1B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('unscanned')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filterMode === 'unscanned'
                ? 'bg-[#146350] text-white shadow-xs'
                : 'bg-[#FAF9F6] border border-[#E6E4DD] text-[#4A4945] hover:bg-[#F3F2EE]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Belum Discan ({unscannedStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filterMode === 'all'
                ? 'bg-[#146350] text-white shadow-xs'
                : 'bg-[#FAF9F6] border border-[#E6E4DD] text-[#4A4945] hover:bg-[#F3F2EE]'
            }`}
          >
            <span>Semua Murid ({students.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau nomor absen siswa..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#E6E4DD] text-xs font-medium text-[#171D1B] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#146350] transition-colors"
          />
        </div>

        {/* Students List Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[45vh]">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6D68] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#146350] mx-auto opacity-60" />
              <p className="font-bold text-[#171D1B]">
                {filterMode === 'unscanned'
                  ? 'Semua murid dalam kelas sudah discan!'
                  : 'Tidak ada siswa yang sesuai pencarian'}
              </p>
              {filterMode === 'unscanned' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-xs text-[#146350] font-bold underline"
                >
                  Lihat semua murid
                </button>
              )}
            </div>
          ) : (
            filteredStudents.map((st) => {
              const isEnrolled = st.method === 'WAJAH'
              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStudent(st)}
                  className="p-3 rounded-2xl border border-[#E6E4DD] hover:border-[#146350] hover:bg-[#F9FAF8] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#E2F2EC] text-[#146350] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {st.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#171D1B] truncate group-hover:text-[#146350] transition-colors">
                        {st.name}
                      </p>
                      <p className="text-[11px] text-[#6E6D68] truncate">
                        No. {st.absenNo} • NIS {st.nis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isEnrolled
                          ? 'bg-[#E2F2EC] text-[#146350]'
                          : 'bg-[#FBF0D9] text-[#8C5411]'
                      }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sudah Discan</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3 h-3" />
                          <span>Belum Discan</span>
                        </>
                      )}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#6E6D68] group-hover:text-[#146350] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[#E6E4DD]">
          <Button variant="outline" size="md" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
