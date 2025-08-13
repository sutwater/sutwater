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

	fmt.Println("connected database")
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
		&entity.WaterUsageLog{},
	)

	GenderMale := entity.Genders{Gender: "Male"}
	GenderFemale := entity.Genders{Gender: "Female"}

	db.FirstOrCreate(&GenderMale, &entity.Genders{Gender: "Male"})
	db.FirstOrCreate(&GenderFemale, &entity.Genders{Gender: "Female"})

	meterLocations := []entity.MeterLocation{
		{Name: "อาคารรัตนเวชพัฒน์", Latitude: 14.86412, Longtitude: 102.03557},
		{Name: "โรงอาหาร", Latitude: 14.86447, Longtitude: 102.03611},
		{Name: "ศูนย์สุขภาพช่องปาก", Latitude: 14.8656160553751, Longtitude: 102.03562438488},
		{Name: "ศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.8674981557441, Longtitude: 102.036364674568},
		{Name: "ศูนย์รังสีวินิจฉัย", Latitude: 14.8644390861983, Longtitude: 102.034975290298},
		{Name: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.8655642066478, Longtitude: 102.034149169922},
	}

	for _, ml := range meterLocations {
		db.FirstOrCreate(&ml, &entity.MeterLocation{Name: ml.Name})
	}

	// Users
	users := []entity.Users{
		{FirstName: "ดนุพร", LastName: "สีสิน", Email: "suthadmin@gmail.com", Age: 80, Password: hashOrPanic("123456"), BirthDay: parseDate("1988-11-12"), GenderID: GenderMale.ID},
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
	}

	// บันทึกลง DB ก่อน เพื่อให้ได้ ID
	for i := range cameraDevices {
		db.FirstOrCreate(&cameraDevices[i], entity.CameraDevice{MacAddress: cameraDevices[i].MacAddress})
	}

	// Notifications
	// Notifications
	notifications := []entity.Notification{}
	messages := []string{
		"พบน้ำรั่ว", "ท่อแตก", "แรงดันน้ำสูงเกิน", "มิเตอร์ไม่ตอบสนอง",
		"ต้องตรวจสอบด้วยมือ", "สัญญาณ Wi-Fi ต่ำ", "ต้องปรับเทียบมิเตอร์",
		"ค่า OCR ผิดปกติ", "อุปกรณ์ออฟไลน์", "แบตเตอรี่ต่ำ",
	}

	for _, cam := range cameraDevices {
		for i, msg := range messages {
			notifications = append(notifications, entity.Notification{
				Message:        msg,
				IsRead:         i%2 == 0,
				CameraDeviceID: cam.ID, // ใช้ ID ของ CameraDevice
			})
		}
	}

	// บันทึกลง DB
	db.Create(&notifications)

	// สุดท้ายบันทึก Notification
	db.Create(&notifications)

	// บันทึกลง DB

	// Water Meter Values
	waterMeterValues := []entity.WaterMeterValue{}

	// เปลี่ยนให้ macAddresses เป็น string
	macAddresses := []string{"11:1B:44:11:3A:B7", "22:2B:45:12:3A:B9", "33:3B:46:13:3B:B8"}

	// กำหนดค่ามิเตอร์เริ่มต้นสำหรับแต่ละเครื่อง
	startValues := []int{1500, 1200, 1800}

	for d := 10; d >= 0; d-- { // 11 วันย้อนหลัง
		for i, mac := range macAddresses {
			meterValue := startValues[i] + d*50 + i*100
			waterMeterValues = append(waterMeterValues, entity.WaterMeterValue{
				MeterValue:    uint(meterValue),
				Timestamp:     time.Now().Add(-time.Duration(d) * 24 * time.Hour),
				OCRConfidence: uint(90 + i),
				MacAddress:    mac, // ตรงนี้เป็น string แล้ว
			})
		}
	}
	db.Create(&waterMeterValues)

	// Water Usage Logs
	waterUsageLogs := []entity.WaterUsageLog{
		{AverageValue: 1450, MinValue: 1400, MaxValue: 1500, BrokenAmount: 0, UserID: 1, WaterMeterValueID: 1},
		{AverageValue: 1950, MinValue: 1900, MaxValue: 2000, BrokenAmount: 0, UserID: 2, WaterMeterValueID: 2},
		{AverageValue: 2950, MinValue: 2900, MaxValue: 3000, BrokenAmount: 1, UserID: 3, WaterMeterValueID: 3},
	}

	db.Create(&waterUsageLogs)

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
