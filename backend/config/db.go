package config

import (
	"fmt"
	"time"

	"example.com/sa-67-example/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("watermeter.db?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("connected database successfully")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Genders{},
		&entity.Users{},
		&entity.MeterLocation{},
		&entity.CameraDevice{},
		&entity.Notification{},
		&entity.WaterMeterValue{},
		&entity.DailyWaterUsage{},
		&entity.WaterUsage{},
	)

	// Gender
	GenderMale := entity.Genders{Gender: "Male"}
	GenderFemale := entity.Genders{Gender: "Female"}
	db.FirstOrCreate(&GenderMale, &entity.Genders{Gender: "Male"})
	db.FirstOrCreate(&GenderFemale, &entity.Genders{Gender: "Female"})

	var images []entity.WaterMeterImage
	for i := 1; i <= 30; i++ {
		images = append(images, entity.WaterMeterImage{
			ImagePath: fmt.Sprintf("uploads/meter%d.jpg", i),
		})
	}

	// บันทึกเข้า DB ถ้ายังไม่มี
	for i := range images {
		db.FirstOrCreate(&images[i], entity.WaterMeterImage{ImagePath: images[i].ImagePath})
	}

	// Meter Locations
	meterLocations := []entity.MeterLocation{
		{Name: "อาคารรัตนเวชพัฒน์", Latitude: 14.86412, Longitude: 102.03557},
		{Name: "โรงอาหาร", Latitude: 14.86447, Longitude: 102.03611},
		{Name: "ศูนย์สุขภาพช่องปาก", Latitude: 14.8656160553751, Longitude: 102.03562438488},
		{Name: "ศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.8674981557441, Longitude: 102.036364674568},
		{Name: "ศูนย์รังสีวินิจฉัย", Latitude: 14.8644390861983, Longitude: 102.034975290298},
		{Name: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.8655642066478, Longitude: 102.034149169922},
	}
	for _, ml := range meterLocations {
		db.FirstOrCreate(&ml, &entity.MeterLocation{Name: ml.Name})
	}

	// Users
	users := []entity.Users{
		{FirstName: "แอดมิน", LastName: "พี่เจน", Email: "suthadmin@gmail.com", Age: 80, Password: hashOrPanic("123456"), BirthDay: parseDate("1988-11-12"), GenderID: GenderMale.ID},
		{FirstName: "ธนวัฒน์", LastName: "ผ่านบุตร", Email: "thanawat@gmail.com", Age: 45, Password: hashOrPanic("123456"), BirthDay: parseDate("1979-05-20"), GenderID: GenderMale.ID},
		{FirstName: "สุดาชา", LastName: "แก้ว", Email: "sudacha@gmail.com", Age: 33, Password: hashOrPanic("123456"), BirthDay: parseDate("1992-07-15"), GenderID: GenderFemale.ID},
		{FirstName: "ไชยโรจน์", LastName: "สดไธสงค์", Email: "chaiyarod@gmail.com", Age: 29, Password: hashOrPanic("123456"), BirthDay: parseDate("1995-02-10"), GenderID: GenderMale.ID},
		{FirstName: "เกริกฐิติ", LastName: "วราชัย", Email: "kroekthiti@gmail.com", Age: 40, Password: hashOrPanic("123456"), BirthDay: parseDate("1983-09-05"), GenderID: GenderFemale.ID},
	}
	for _, u := range users {
		db.FirstOrCreate(&u, &entity.Users{Email: u.Email})
	}

	// Camera Devices
	cameraDevices := []entity.CameraDevice{
		{MacAddress: "11:1B:44:11:3A:B7", Battery: 85, Wifi: true, Status: true, MeterLocationID: 1},
		{MacAddress: "22:2B:45:12:3A:B9", Battery: 60, Wifi: true, Status: true, MeterLocationID: 2},
		{MacAddress: "33:3B:46:13:3B:B8", Battery: 30, Wifi: false, Status: false, MeterLocationID: 3},
		{MacAddress: "44:4B:47:14:4B:B6", Battery: 56, Wifi: true, Status: false, MeterLocationID: 4},
		{MacAddress: "55:5B:48:15:1B:B5", Battery: 26, Wifi: true, Status: false, MeterLocationID: 5},
		{MacAddress: "66:6B:49:16:2B:B4", Battery: 11, Wifi: true, Status: false, MeterLocationID: 6},
	}
	for i := range cameraDevices {
		db.FirstOrCreate(&cameraDevices[i], entity.CameraDevice{MacAddress: cameraDevices[i].MacAddress})
	}

	// Notifications
	notifications := []entity.Notification{}
	messages := []string{
		"พบน้ำรั่ว", "ท่อแตก", "มิเตอร์ไม่ตอบสนอง",
		"ต้องตรวจสอบด้วยมือ", "สัญญาณ Wi-Fi ต่ำ", "ต้องปรับเทียบมิเตอร์",
		"ค่า OCR ผิดปกติ", "อุปกรณ์ออฟไลน์", "แบตเตอรี่ต่ำ",
	}
	for _, cam := range cameraDevices {
		for i, msg := range messages {
			notifications = append(notifications, entity.Notification{
				Message:        msg,
				IsRead:         i%2 == 0,
				CameraDeviceID: cam.ID,
			})
		}
	}
	db.Create(&notifications)

	var imageSlice []entity.WaterMeterImage
	db.Find(&imageSlice)

	cameraDeviceID := uint(1)
	prevValue := uint(33504) // เริ่ม MeterValue

	// กำหนด array ของ Usage ต่อวัน (บวก/ลบตามต้องการ)
	dailyUsages := []int{0, 2, 0, 3, 0, 1, -3, 2, 0, -1, 2, 0, -2, 1, 0, 3, -1, 0, 2, -2, 0, 1, -1, 0, 2, 0, -1, 1, 0, -2, 0}

	// ปีนี้
	year := time.Now().Year()
	month := time.August
	today := time.Now().Day() // วันที่ปัจจุบัน

	for day := 1; day <= today; day++ {
		ts := time.Date(year, month, day, 10, 0, 0, 0, time.Local) // เวลา 10:00 ทุกวัน

		dailyUsage := dailyUsages[day-1] // ใช้ค่า array ตามวัน

		// ค่ามิเตอร์สะสม
		meterValue := int(prevValue) + dailyUsage

		// เลือกรูปภาพวนตามลิสต์
		img := imageSlice[day%len(imageSlice)]

		// สร้าง WaterMeterValue (ทุกวัน)
		wm := entity.WaterMeterValue{
			MeterValue:        int(meterValue),
			Timestamp:         ts,
			OCRConfidence:     95,
			CameraDeviceID:    cameraDeviceID,
			WaterMeterImageID: img.ID,
		}
		db.Create(&wm)

		// สร้าง DailyWaterUsage **ยกเว้นวันแรกสุด (day == 1)**

		du := entity.DailyWaterUsage{
			Timestamp:      ts,
			Usage:          dailyUsage,
			CameraDeviceID: cameraDeviceID,
		}
		db.Create(&du)

		prevValue = uint(meterValue)
	}

}

func hashOrPanic(password string) string {
	hashed, err := HashPassword(password)
	if err != nil {
		panic(err)
	}
	return hashed
}

func parseDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return t
}
