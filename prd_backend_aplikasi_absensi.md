# Product Requirements Document (PRD)

**Nama Produk:** Aplikasi Web Absensi Pengenalan Wajah (Backend)  
**Status:** Aktif & Diperbarui  
**Tumpukan Teknologi:** Node.js, Express.js, MySQL, Prisma ORM, JSON Web Token (JWT), Zod  

---

## 1. Skema Database (Prisma ORM)

Skema database dimodelkan menggunakan Prisma ORM (`prisma/schema.prisma`) terhubung ke database MySQL:

### 1.1 Model `Teacher` (Tabel: `teachers`)
* `id`: Int (Primary Key, Auto Increment)
* `nama`: String
* `nip`: String (Unique, format nomor induk guru)
* `password`: String (Bcrypt hashed)
* `role`: Enum `Role` (`GURU`, `ADMIN`) — Default: `GURU`
* Relasi: `classes` (One-to-Many ke model `Class`)
* Timestamps: `createdAt`, `updatedAt`

### 1.2 Model `Class` (Tabel: `classes`)
* `id`: Int (Primary Key, Auto Increment)
* `nama`: String (contoh: "XI IPA 1", "XII IPS 1")
* `ruang`: String? (contoh: "Ruang 204")
* `teacherId`: Int (Foreign Key ke `teachers.id`, Cascade Delete)
* Relasi: `students` (One-to-Many ke `Student`), `sessions` (One-to-Many ke `AttendanceSession`)
* Timestamps: `createdAt`, `updatedAt`

### 1.3 Model `Student` (Tabel: `students`)
* `id`: Int (Primary Key, Auto Increment)
* `nama`: String
* `nis`: String (Unique, Nomor Induk Siswa)
* `noAbsen`: Int (Nomor urut presensi siswa di kelas)
* `classId`: Int (Foreign Key ke `classes.id`, Cascade Delete)
* `faceData`: Json? (Vektor embedding biometrik wajah)
* `fotoProfil`: String (Data URL atau path citra wajah siswa)
* Relasi: `records` (One-to-Many ke `AttendanceRecord`)
* Timestamps: `createdAt`, `updatedAt`

### 1.4 Model `AttendanceSession` (Tabel: `attendance_sessions`)
* `id`: Int (Primary Key, Auto Increment)
* `classId`: Int (Foreign Key ke `classes.id`, Cascade Delete)
* `tanggal`: DateTime (Format `@db.Date`)
* `status`: Enum `SessionStatus` (`AKTIF`, `SELESAI`) — Default: `AKTIF`
* `catatanGuru`: String? (`@db.Text`)
* Relasi: `records` (One-to-Many ke `AttendanceRecord`)
* Timestamps: `createdAt`, `updatedAt`
* Indeks: `@@index([classId, tanggal])`

### 1.5 Model `AttendanceRecord` (Tabel: `attendance_records`)
* `id`: Int (Primary Key, Auto Increment)
* `sessionId`: Int (Foreign Key ke `attendance_sessions.id`, Cascade Delete)
* `studentId`: Int (Foreign Key ke `students.id`, Cascade Delete)
* `status`: Enum `AttendanceStatus` (`HADIR`, `IZIN`, `SAKIT`, `ALPA`, `BELUM_TERCATAT`) — Default: `BELUM_TERCATAT`
* `waktuPindai`: DateTime? (Waktu pencatatan kehadiran presensi)
* `metode`: Enum `AttendanceMethod` (`WAJAH`, `MANUAL`) — Default: `WAJAH`
* `catatan`: String? (Keterangan presensi, misal: "Wajah cocok", "Surat sakit", "Surat izin")
* Timestamps: `createdAt`, `updatedAt`
* Constraint Unik: `@@unique([sessionId, studentId])` (satu siswa memiliki maksimal satu catatan per sesi)

---

## 2. Spesifikasi API Endpoints

Semua endpoint dilayani di bawah prefix `/api/`. Rute selain `/api/auth/login` dan `/api/health` mewajibkan header `Authorization: Bearer <token>`.

### 2.1 Autentikasi (`/api/auth`)
* **POST /api/auth/login**
  * *Request Body:* `{ nip: string, password: string }`
  * *Validasi:* Zod `loginSchema` (NIP minimal 3 karakter, password minimal 4 karakter).
  * *Response 200 OK:* `{ token: string, user: { id: number, nama: string, nip: string, role: string } }`
* **GET /api/auth/me**
  * *Headers:* `Authorization: Bearer <token>`
  * *Response 200 OK:* `{ id: number, nama: string, nip: string, role: string }`

### 2.2 Manajemen Kelas (`/api/classes`)
* **GET /api/classes/active**
  * *Response 200 OK:* Mengembalikan daftar kelas aktif untuk guru yang login (atau seluruh kelas jika akun `ADMIN`), disertai jumlah murid `_count.students`.
* **GET /api/classes/:classId/students**
  * *Response 200 OK:* Daftar murid dalam kelas yang bersangkutan (`id, nama, nis, noAbsen, fotoProfil, faceData`).
* **GET /api/classes/:classId/latest-session**
  * *Deskripsi:* Mengambil atau menginisialisasi sesi hari ini untuk kelas yang bersangkutan, menghitung metrik agregat ringkasan (persentase kehadiran, jumlah hadir/izin/sakit/alpa), serta mengembalikan array catatan presensi siswa.

### 2.3 Transaksi Absensi (`/api/attendance`)
* **POST /api/attendance/sessions**
  * *Request Body:* `{ classId: number, tanggal: string }`
  * *Response 201 Created:* `{ id, classId, tanggal, status }`
* **POST /api/attendance/scan**
  * *Deskripsi:* Endpoint pencocokan wajah dengan rate limiting khusus.
  * *Request Body:* `{ sessionId: number, faceVector?: number[], image?: string }`
  * *Response 200 OK:* `{ match: boolean, studentId: number | null, confidence: number, student: {...} | null }`
* **POST /api/attendance/records**
  * *Deskripsi:* Menyimpan atau memperbarui (*upsert*) status kehadiran individual siswa.
  * *Request Body:* 
    ```json
    {
      "sessionId": 1,
      "studentId": 5,
      "status": "HADIR | IZIN | SAKIT | ALPA | BELUM_TERCATAT",
      "metode": "WAJAH | MANUAL",
      "waktuPindai": "2026-10-28T07:12:00.000Z",
      "catatan": "Wajah cocok | Surat sakit | Surat izin | Tanpa keterangan"
    }
    ```
  * *Response 201 Created:* Data catatan presensi yang berhasil disimpan.
* **PUT /api/attendance/sessions/:sessionId/complete**
  * *Request Body:* `{ catatanGuru?: string }`
  * *Fungsi:* Menutup sesi absensi (mengubah status sesi menjadi `SELESAI`) dan otomatis mengubah seluruh siswa yang masih `BELUM_TERCATAT` menjadi `ALPA`.
  * *Response 200 OK:* `{ id, status, catatanGuru, convertedToAlpa: number }`

### 2.4 Laporan & Rekapitulasi (`/api/attendance/reports`)
* **GET /api/attendance/reports/monthly**
  * *Query Params:* `?classId=1&month=10&year=2026`
  * *Response 200 OK:*
    * `summary`: Akumulasi statistik bulanan (hari sekolah, persentase kehadiran, total hadir, izin, sakit, alpa).
    * `dailyRincian`: Rincian rekapitulasi kehadiran per tanggal sekolah.

### 2.5 Data Siswa & Pendaftaran Wajah (`/api/students`)
* **GET /api/students/:studentId**
  * *Response 200 OK:* Detail profil siswa, metrik statistik kehadiran total, dan riwayat presensi sesi-sesi sebelumnya.
* **POST /api/students/:studentId/face**
  * *Request Body:* `{ faceVector?: number[], image?: string, fotoProfil?: string }`
  * *Response 200 OK:* `{ success: true, message: string, student: {...} }`

---

## 3. Middleware, Keamanan & Validasi

1. **Autentikasi JWT (`authenticateJWT`):** Memverifikasi header `Bearer <token>` pada setiap request terproteksi dan menyematkan payload user ke `req.user`.
2. **Role-Based Access Control (`checkClassAccess`):** Memastikan guru hanya dapat mengakses dan memodifikasi data kelas miliknya, kecuali akun ber-role `ADMIN` yang memiliki akses menyeluruh ke seluruh kelas.
3. **Validasi Payload (`validateBody` / `validateQuery`):** Memanfaatkan skema Zod pada setiap request body dan query parameters untuk mencegah data korup atau injeksi tipe data.
4. **Rate Limiting:** Menggunakan middleware `scanRateLimiter` pada endpoint `/api/attendance/scan` untuk membatasi frekuensi komputasi pemindaian biometrik dan menjaga stabilitas server.
5. **CORS & Body Parser:** CORS diaktifkan secara aman dan JSON body parser mendukung limit hingga 10MB untuk menangani pengiriman data citra foto wajah.
