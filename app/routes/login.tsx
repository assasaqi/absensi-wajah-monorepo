import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  BookOpenCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { attendanceApi } from '~/lib/apiClient'
import { Button } from '~/components/Button'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!nip || !password) {
      setErrorMessage('NIP dan kata sandi wajib diisi')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      await attendanceApi.login(nip, password)
      navigate({ to: '/beranda' })
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Login gagal. Periksa kembali NIP dan kata sandi.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-white px-6 py-8">
      <div className="space-y-6 max-w-sm mx-auto w-full pt-8">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#146350] text-white flex items-center justify-center mx-auto shadow-md">
            <BookOpenCheck className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#171D1B]">
              Hadir Guru
            </h1>
            <p className="text-xs text-[#6E6D68] mt-0.5">
              Aplikasi Absensi Pengenalan Wajah Siswa
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-4 bg-white p-6 rounded-3xl border border-[#E6E4DD] shadow-2xs"
        >
          <div>
            <h2 className="text-sm font-extrabold text-[#171D1B] mb-1">
              Masuk ke Akun
            </h2>
            <p className="text-[11px] text-[#6E6D68]">
              Masukkan Nomor Induk Pegawai (NIP) dan kata sandi Anda
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FBE6E5] border border-[#F97066]/30 flex items-start gap-2 text-[#B42318] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label
                htmlFor="nip"
                className="block text-xs font-bold text-[#4A4945] mb-1.5"
              >
                Nomor Induk Pegawai (NIP)
              </label>
              <div className="relative">
                <input
                  id="nip"
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Masukkan NIP Anda..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E6E4DD] text-xs font-medium text-[#171D1B] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-[#146350] transition-colors"
                />
                <User className="w-4 h-4 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#4A4945] mb-1.5"
              >
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E6E4DD] text-xs font-medium text-[#171D1B] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-[#146350] transition-colors"
                />
                <Lock className="w-4 h-4 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
          </Button>
        </form>
      </div>

      <div className="text-center text-[11px] text-[#6E6D68] pt-6">
        <span>SMA Negeri 8 Bandung • Sistem Informasi Absensi Wajah</span>
      </div>
    </div>
  )
}
