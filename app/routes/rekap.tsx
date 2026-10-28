import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ChevronDown,
  Calendar,
  BarChart2,
  Download,
  ArrowRight,
  Check,
  Printer,
  FileCheck,
  X,
} from 'lucide-react'
import {
  attendanceApi,
  getActiveClassId,
  setActiveClassId,
  getValidActiveClassId,
} from '~/lib/apiClient'
import { StatCard } from '~/components/StatCard'
import { Button } from '~/components/Button'
import { BottomNavigation } from '~/components/BottomNavigation'
import { CustomDropdown } from '~/components/CustomDropdown'

export const Route = createFileRoute('/rekap')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const [teacher, classes, monthlyReport] = await Promise.all([
      attendanceApi.getTeacherProfile(),
      attendanceApi.getActiveClasses(),
      attendanceApi.getMonthlyReport(classId, 10, 2026),
    ])

    return {
      teacher,
      classes,
      initialClassId: classId,
      initialReport: monthlyReport,
    }
  },
  component: RekapAbsensiPage,
})

const MONTH_OPTIONS = [
  { value: '2026-10', month: 10, year: 2026, label: 'Oktober 2026' },
  { value: '2026-09', month: 9, year: 2026, label: 'September 2026' },
  { value: '2026-08', month: 8, year: 2026, label: 'Agustus 2026' },
]

function RekapAbsensiPage() {
  const { teacher, classes, initialClassId, initialReport } =
    Route.useLoaderData()
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId)
  const [selectedMonthValue, setSelectedMonthValue] = useState(
    MONTH_OPTIONS[0].value,
  )
  const [report, setReport] = useState(initialReport)
  const [showAllDays, setShowAllDays] = useState(false)
  const [downloadedToast, setDownloadedToast] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  const handleFilterChange = async (classId: number, monthValue: string) => {
    setSelectedClassId(classId)
    setActiveClassId(classId)
    setSelectedMonthValue(monthValue)

    const monthOpt =
      MONTH_OPTIONS.find((m) => m.value === monthValue) ?? MONTH_OPTIONS[0]
    const updated = await attendanceApi.getMonthlyReport(
      classId,
      monthOpt.month,
      monthOpt.year,
    )
    setReport(updated)
  }

  const displayedRows = showAllDays
    ? report.dailyRincian
    : report.dailyRincian.slice(0, 3)

  const handleDownloadRecap = () => {
    const headers = ['Tanggal,Hari,Hadir,Izin,Sakit,Alpa']
    const csvRows = report.dailyRincian.map(
      (r) =>
        `"${r.dateLabel}","${r.daySubtitle}",${r.hadir},${r.izin},${r.sakit},${r.alpa}`,
    )
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(headers.concat(csvRows).join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute(
      'download',
      `rekap-absensi-kelas-${selectedClassId}-${selectedMonthValue}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloadedToast(true)
    setTimeout(() => setDownloadedToast(false), 3000)
  }

  const currentMonthOpt =
    MONTH_OPTIONS.find((m) => m.value === selectedMonthValue) ??
    MONTH_OPTIONS[0]

  const isAdmin =
    teacher.name.toLowerCase().includes('admin') ||
    teacher.nip === '198001012005011003' ||
    (teacher as { role?: string }).role === 'ADMIN'

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      <div className="px-5 pt-5 pb-5 space-y-4">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-[#171D1B] leading-tight">
              Rekap absensi
            </h1>
            <p className="text-xs text-[#6E6D68] font-medium mt-0.5">
              {teacher.school} • {isAdmin ? 'Panel Administrator' : teacher.name}
            </p>
          </div>
        </header>

        {/* Dual Filter: Class & Month/Year */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <CustomDropdown
              value={selectedClassId}
              onChange={(val) =>
                handleFilterChange(Number(val), selectedMonthValue)
              }
              options={classes.map((cls) => ({
                value: cls.id,
                label: cls.name,
              }))}
              ariaLabel="Filter Kelas"
            />

            <CustomDropdown
              value={selectedMonthValue}
              onChange={(val) =>
                handleFilterChange(selectedClassId, String(val))
              }
              options={MONTH_OPTIONS.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
              ariaLabel="Filter Bulan dan Tahun"
            />
          </div>

          <p className="text-[11px] text-[#6E6D68] font-medium">
            {currentMonthOpt.label} • {report.summary.hariSekolah} hari sekolah
            • {report.summary.jumlahSiswa} siswa
          </p>
        </div>

        {/* Monthly Attendance Percentage Hero Card */}
        <section className="bg-[#146350] text-white rounded-3xl p-4.5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-white/85">
            <span className="text-xs font-bold">Kehadiran kelas</span>
            <BarChart2 className="w-4 h-4" />
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight">
              {report.summary.persentaseLabel}
            </span>
            <span className="text-[11px] text-white/80 font-medium">
              {report.summary.totalKehadiran} dari{' '}
              {report.summary.totalKapasitas} kehadiran
            </span>
          </div>

          {/* Multi-segment visual bar */}
          <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden flex gap-0.5">
            <div
              className="h-full bg-[#5EEAD4] rounded-l-full"
              style={{ width: `${Math.max(10, report.summary.persentase)}%` }}
            />
            <div className="h-full bg-[#818CF8]" style={{ width: '4%' }} />
            <div className="h-full bg-[#FBBF24]" style={{ width: '3%' }} />
            <div
              className="h-full bg-[#F87171] rounded-r-full"
              style={{ width: '3%' }}
            />
          </div>
        </section>

        {/* Accumulated Numeric Stats */}
        <section className="grid grid-cols-4 gap-2">
          <StatCard
            value={report.summary.totalHadir}
            label="Hadir"
            variant="hadir"
          />
          <StatCard
            value={report.summary.totalIzin}
            label="Izin"
            variant="izin"
          />
          <StatCard
            value={report.summary.totalSakit}
            label="Sakit"
            variant="sakit"
          />
          <StatCard
            value={report.summary.totalAlpa}
            label="Alpa"
            variant="alpa"
          />
        </section>

        {/* Daily Breakdown Table */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#171D1B]">
              Rincian harian
            </h2>
            <button
              type="button"
              onClick={() => setShowAllDays((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#146350] hover:underline cursor-pointer"
            >
              <span>{showAllDays ? 'Ringkas' : 'Lihat semua'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E4DD] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2EFE9] text-[#5C5852] text-[11px] font-bold border-b border-[#E6E4DD]">
                  <th className="py-2.5 pl-3.5 pr-2 font-bold">Tanggal</th>
                  <th className="py-2.5 px-2 text-center font-bold">Hadir</th>
                  <th className="py-2.5 px-2 text-center font-bold">Izin</th>
                  <th className="py-2.5 px-2 text-center font-bold">Sakit</th>
                  <th className="py-2.5 pl-2 pr-3.5 text-center font-bold">
                    Alpa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6] text-xs">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-[#6E6D68] font-medium"
                    >
                      Belum ada sesi absensi di bulan ini pada database MySQL.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 pl-3.5 pr-2">
                        <p className="font-extrabold text-[#171D1B] leading-tight">
                          {row.dateLabel}
                        </p>
                        <p className="text-[10px] text-[#6E6D68] font-medium mt-0.5">
                          {row.daySubtitle}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-center font-extrabold text-[#146350]">
                        {row.hadir}
                      </td>
                      <td className="py-3 px-2 text-center font-extrabold text-[#283593]">
                        {row.izin}
                      </td>
                      <td className="py-3 px-2 text-center font-extrabold text-[#8C5411]">
                        {row.sakit}
                      </td>
                      <td className="py-3 pl-2 pr-3.5 text-center font-extrabold text-[#B42318]">
                        {row.alpa}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Download & Print Action Buttons */}
        <div className="pt-1 space-y-2">
          <Button
            variant="primary"
            size="lg"
            icon={
              downloadedToast ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Download className="w-4 h-4 stroke-[2.3]" />
              )
            }
            onClick={handleDownloadRecap}
          >
            {downloadedToast
              ? 'Rekap CSV berhasil diunduh'
              : 'Unduh rekap absensi (.CSV)'}
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<Printer className="w-4 h-4 stroke-[2]" />}
            onClick={() => setPrintModalOpen(true)}
          >
            Cetak Laporan Resmi / Simpan PDF
          </Button>
        </div>
      </div>

      <BottomNavigation variant="rekap" />

      {/* Official Printable Report Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white text-[#171D1B] rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DD]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#146350]" />
                <h3 className="font-extrabold text-sm text-[#171D1B]">
                  Laporan Rekapitulasi Kehadiran Resmi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E6E4DD] flex items-center justify-center text-[#6E6D68] hover:text-[#171D1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 p-2 bg-[#FAF9F6] rounded-2xl border border-[#E6E4DD] text-xs">
              {/* Kop Sekolah */}
              <div className="text-center pb-3 border-b-2 border-black space-y-0.5">
                <p className="font-extrabold text-sm tracking-wider uppercase">
                  PEMERINTAH PROVINSI JAWA BARAT
                </p>
                <p className="font-extrabold text-base tracking-wider uppercase">
                  DINAS PENDIDIKAN • {teacher.school.toUpperCase()}
                </p>
                <p className="text-[10px] text-[#6E6D68]">
                  Jl. Solontongan No. 3, Lengkong, Kota Bandung, Jawa Barat 40264
                </p>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <p className="font-extrabold text-center uppercase tracking-wide">
                  REKAPITULASI KEHADIRAN SISWA BULANAN
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <p>
                      <span className="font-bold">Kelas:</span>{' '}
                      {report.summary.namaKelas}
                    </p>
                    <p>
                      <span className="font-bold">Periode:</span>{' '}
                      {currentMonthOpt.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      <span className="font-bold">Wali Kelas:</span>{' '}
                      {teacher.name}
                    </p>
                    <p>
                      <span className="font-bold">Persentase Kehadiran:</span>{' '}
                      {report.summary.persentaseLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left border border-black border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-200 border-b border-black text-center font-bold">
                    <th className="p-1.5 border-r border-black">Tanggal</th>
                    <th className="p-1.5 border-r border-black">Hadir</th>
                    <th className="p-1.5 border-r border-black">Izin</th>
                    <th className="p-1.5 border-r border-black">Sakit</th>
                    <th className="p-1.5">Alpa</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailyRincian.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-300 text-center"
                    >
                      <td className="p-1.5 border-r border-black font-semibold text-left">
                        {r.dateLabel} ({r.daySubtitle})
                      </td>
                      <td className="p-1.5 border-r border-black">{r.hadir}</td>
                      <td className="p-1.5 border-r border-black">{r.izin}</td>
                      <td className="p-1.5 border-r border-black">{r.sakit}</td>
                      <td className="p-1.5">{r.alpa}</td>
                    </tr>
                  ))}
                  <tr className="font-extrabold bg-gray-100 text-center">
                    <td className="p-1.5 border-r border-black text-left">
                      TOTAL AKUMULASI
                    </td>
                    <td className="p-1.5 border-r border-black">
                      {report.summary.totalHadir}
                    </td>
                    <td className="p-1.5 border-r border-black">
                      {report.summary.totalIzin}
                    </td>
                    <td className="p-1.5 border-r border-black">
                      {report.summary.totalSakit}
                    </td>
                    <td className="p-1.5">{report.summary.totalAlpa}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signature Columns */}
              <div className="grid grid-cols-2 pt-6 pb-2 text-[11px] text-center">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala Sekolah</p>
                  <div className="h-14" />
                  <p className="font-bold underline">
                    Dr. H. Endang Kuswara, M.Pd.
                  </p>
                  <p className="text-[10px]">NIP. 19680312 199403 1 004</p>
                </div>
                <div>
                  <p>Bandung, {teacher.currentDateLabel.split(', ')[1]}</p>
                  <p className="font-bold">Wali Kelas {report.summary.namaKelas}</p>
                  <div className="h-14" />
                  <p className="font-bold underline">{teacher.name}</p>
                  <p className="text-[10px]">NIP. {teacher.nip}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                className="w-1/3"
                onClick={() => setPrintModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                className="w-2/3"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Cetak Dokumen Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
