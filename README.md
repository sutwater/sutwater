# Smart Water Meter Monitoring System — SUTH

![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)

ระบบตรวจสอบการใช้น้ำสำหรับโรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี (SUTH)  
กล้อง IoT (ESP32-CAM) อ่านค่ามิเตอร์น้ำแบบอัตโนมัติ ส่งข้อมูลเข้าระบบ  
เว็บแอปแสดงสถิติการใช้น้ำ แผนที่มิเตอร์ และบันทึกการซ่อมบำรุงรายอาคาร

---

## ฟีเจอร์หลัก

| หน้า | คำอธิบาย |
|---|---|
| แดชบอร์ด | ภาพรวมทุกอาคาร — ค่าใช้น้ำล่าสุด, แนวโน้ม, กราฟแท่งเปรียบเทียบ |
| แผนที่มิเตอร์ | Leaflet map แสดงตำแหน่งมิเตอร์, คลิก popup เพิ่มค่าได้ทันที |
| รายละเอียดมิเตอร์ | ประวัติค่าน้ำรายอาคาร, เพิ่มค่าด้วยมือพร้อมรูปภาพ |
| บันทึกซ่อมบำรุง | CRUD + ติดตามสถานะ (pending → solving → solved/rejected) + แนบรูป |
| แจ้งปัญหา | ผู้ใช้รายงานน้ำรั่ว/ท่อแตก พร้อมอัปโหลดรูปและส่ง notification อัตโนมัติ |
| อุปกรณ์ | จัดการกล้อง ESP32-CAM รายตำแหน่ง |
| ผู้ใช้ | จัดการบัญชีและบทบาท (Admin ล็อคแก้ไข/ลบไม่ได้) |

---

## สิทธิ์การเข้าถึง

| บทบาท | ID | เข้าถึง |
|---|---|---|
| ผู้ดูแล (Admin) | 1 | ทุกหน้า — แก้ไข/ลบผู้ดูแลด้วยกันไม่ได้ |
| วิศวกร (Engineer) | 2 | ทุกหน้า — ลบผู้ใช้ไม่ได้ |
| ช่างเทคนิค (Technician) | 3 | แดชบอร์ด, แผนที่, บันทึกซ่อมบำรุง |
| ผู้ใช้ (User) | 4 | แจ้งปัญหาเท่านั้น |

---

## Tech Stack

**Backend** — `backend/`
- **Go 1.24** + **Gin** (HTTP framework) + **GORM** (ORM)
- Architecture: `entity → repository → service → controller → main.go`
- JWT authentication, Role-based middleware
- Static file serving: `GET /api/v1/uploads/*` → `backend/uploads/`

**Frontend** — `frontend/`
- **React 19** + **TypeScript** + **Vite**
- **Ant Design 5** (UI components) + **Tailwind CSS 4** (utility classes)
- **React-Leaflet** (แผนที่) + **Recharts** (กราฟ)
- **dayjs** + **xlsx** (export Excel)

**Database** — PostgreSQL

---

## การติดตั้ง

### 1. สร้างฐานข้อมูล PostgreSQL

```sql
CREATE USER watermeter WITH PASSWORD 'watermeter';
CREATE DATABASE waterdb OWNER watermeter;
```

### 2. ตั้งค่า Environment Variables

**`backend/.env`**
```env
DB_HOST=localhost
DB_USER=watermeter
DB_PASSWORD=watermeter
DB_NAME=waterdb
DB_PORT=5432
API_PORT=:8000
JWT_SECRET_KEY=your_secret_key
JWT_EXPIRES_IN=10h
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. รัน Backend

```bash
cd backend
go mod tidy
go run main.go          # รันปกติ (seed ข้อมูลอัตโนมัติ)
go run main.go -reset   # ล้าง DB แล้ว seed ใหม่
```

API พร้อมใช้งานที่ `http://localhost:8000`

### 4. รัน Frontend

```bash
cd frontend
npm install
npm run dev
```

เว็บพร้อมใช้งานที่ `http://localhost:5173`

---

## บัญชีทดสอบ

| บทบาท | Email | Password |
|---|---|---|
| ผู้ดูแล | `suth@gmail.com` | `123` |
| วิศวกร | `danuporn@gmail.com` | `123` |
| ช่างเทคนิค | `apirat@gmail.com` | `123` |
| ผู้ใช้ | `thanawat@gmail.com` | `123` |

---

## โครงสร้างโปรเจกต์

```
sutwater/
├── backend/
│   ├── entity/           # GORM models
│   ├── config/
│   │   ├── models/       # Request/Response DTOs
│   │   ├── postgres/     # DB setup & seed
│   │   └── utils/        # JWT, password, response helpers
│   ├── repositories/     # DB queries (interface + implementation)
│   ├── services/         # Business logic
│   ├── controller/       # Gin handlers (self-register routes)
│   ├── middlewares/      # CORS, JWT
│   ├── uploads/          # รูปภาพที่อัปโหลด
│   └── main.go
└── frontend/
    └── src/
        ├── contexts/     # AppContext (global state), ThemeContext
        ├── interfaces/   # TypeScript interfaces
        ├── layout/       # SidebarLayout, Sidebar, OutletLayout
        ├── pages/        # หน้าจอแยกตาม domain
        ├── routes/       # Route tree แยกตาม role
        └── services/https/  # Axios API clients
```

---

## API Endpoints หลัก

| Method | Path | คำอธิบาย |
|---|---|---|
| POST | `/api/v1/auth/login` | เข้าสู่ระบบ |
| GET | `/api/v1/water-values` | ดึงค่ามิเตอร์ทั้งหมด |
| POST | `/api/v1/water-values/manual` | เพิ่มค่าด้วยมือ (multipart) |
| GET | `/api/v1/meter-locations` | ดึงรายการมิเตอร์ |
| GET | `/api/v1/maintain-logs` | ดึงบันทึกซ่อมบำรุง |
| POST | `/api/v1/maintain-logs/report` | แจ้งปัญหา (multipart) |
| GET | `/api/v1/uploads/*` | เสิร์ฟไฟล์รูปภาพ |
