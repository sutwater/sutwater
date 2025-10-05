# Smart Water Meter Usage System For SUTH


![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.11-blue)
![ESP32-CAM](https://img.shields.io/badge/ESP32--CAM-1.0-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.0-blue)
![Golang](https://img.shields.io/badge/Golang-1.24-lightgrey)
---

## 🚀 ภาพรวมระบบ
ระบบตรวจสอบการใช้น้ำประปาของโรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี (SUTH)  
พัฒนาขึ้นเพื่อเพิ่มประสิทธิภาพในการเก็บข้อมูลและบริหารจัดการน้ำสำหรับ 11 อาคาร  
ระบบประกอบด้วย **ฮาร์ดแวร์อ่านค่ามิเตอร์น้ำ (ESP32-CAM)** และ **ซอฟต์แวร์ประมวลผลและแสดงผล**  
พร้อมระบบแจ้งเตือนเมื่อพบความผิดปกติ ช่วยลดภาระงานของเจ้าหน้าที่ และสนับสนุนการตัดสินใจบริหารน้ำอย่างมีประสิทธิภาพ

---

## 🛠 ฟีเจอร์
- ดูข้อมูลการใช้น้ำของโรงพยาบาลแต่ละตึก  
- ผู้ดูแลเข้าถึงข้อมูลได้ทั้งหมด  
- มีระบบรายงานเมื่อพบน้ำปะปาแตกหรือรั่ว
- สามารถใช้ผ่านโทรศัพท์ได้ง่าย  
- จัดเก็บข้อมูลใน PostgreSQL   

---

## ⚡ เครื่องมือ
- **Frontend:** React, TypeScript, TailwindCSS, Ant Design, Leaflet  
- **Backend:** Golang, Gin  
- **Database:** PostgreSQL  
- **Device:** ESP32-CAM 

---

## 📦 การติดตั้งและรันระบบ 
## 1️⃣ Frontend
```bash
# Clone repo นี้
git clone https://github.com/sutwater/sutwater.git
cd sutwater

# ติดตั้ง dependencies
npm install

# เริ่มรัน
npm run dev

# เว็บจะแสดงผลที่
http://localhost:5173
```

## 2️⃣ ติดตั้ง PostgreSQL
1. ติดตั้ง PostgreSQL เวอร์ชันล่าสุด  
2. สร้างฐานข้อมูล เช่น `suth_water`  
3. สร้าง user และกำหนดสิทธิ์ให้สามารถเข้าถึงฐานข้อมูล 
---

## 3️⃣ ติดตั้ง Backend
```bash
# เข้าไปที่โฟลเดอร์ backend
cd backend    

# ติดตั้ง dependencies
go mod tidy          

# server จะรันบน port เช่น http://localhost:8000
go run main.go      
```
