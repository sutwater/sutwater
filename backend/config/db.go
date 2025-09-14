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
		&entity.StatusWaterValue{},
		&entity.WaterMeterValue{},
		&entity.DailyWaterUsage{},
		&entity.WaterUsage{},
	)

	// Gender
	GenderMale := entity.Genders{Gender: "Male"}
	GenderFemale := entity.Genders{Gender: "Female"}
	db.FirstOrCreate(&GenderMale, &entity.Genders{Gender: "Male"})
	db.FirstOrCreate(&GenderFemale, &entity.Genders{Gender: "Female"})

	// Statuses
	statuses := []entity.StatusWaterValue{
		{Name: "pending", Description: "รอการอนุมัติ"},
		{Name: "approved", Description: "อนุมัติแล้ว"},
	}
	for _, s := range statuses {
		db.FirstOrCreate(&s, entity.StatusWaterValue{Name: s.Name})
	}

	// Meter Locations
	meterLocations := []entity.MeterLocation{
		{Name: "อาคารรัตนเวชพัฒน์", Latitude: 14.86412, Longitude: 102.03557},
		{Name: "โรงอาหาร", Latitude: 14.86447, Longitude: 102.03611},
		{Name: "ศูนย์สุขภาพช่องปาก", Latitude: 14.865616, Longitude: 102.035624},
		{Name: "ศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.867498, Longitude: 102.036364},
		{Name: "ศูนย์รังสีวินิจฉัย", Latitude: 14.864439, Longitude: 102.034975},
		{Name: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.865564, Longitude: 102.034149},
	}
	for _, ml := range meterLocations {
		db.FirstOrCreate(&ml, &entity.MeterLocation{Name: ml.Name})
	}

	// Users
	users := []entity.Users{
		{FirstName: "แอดมิน", LastName: "พี่เจน", Email: "suthadmin@gmail.com", Age: 25, Password: hashOrPanic("123456"), BirthDay: parseDate("1988-11-12"), GenderID: GenderFemale.ID},
		{FirstName: "ดนุพร", LastName: "สีสินธุ์", Email: "danuporn@gmail.com", Age: 22, Password: hashOrPanic("123456"), BirthDay: parseDate("1979-05-20"), GenderID: GenderMale.ID},
		{FirstName: "อภิรัตน์", LastName: "แสงอรุณ", Email: "apirat@gmail.com", Age: 22, Password: hashOrPanic("123456"), BirthDay: parseDate("1992-07-15"), GenderID: GenderMale.ID},
		{FirstName: "นนทกานต์", LastName: "ใสโสก", Email: "nontakarn@gmail.com", Age: 21, Password: hashOrPanic("123456"), BirthDay: parseDate("1995-02-10"), GenderID: GenderMale.ID},
		{FirstName: "ณัฐวุฒิ", LastName: "ถินราช", Email: "nattawut@gmail.com", Age: 21, Password: hashOrPanic("123456"), BirthDay: parseDate("1983-09-05"), GenderID: GenderMale.ID},
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
	messages := []string{"พบน้ำรั่ว", "ท่อแตก", "มิเตอร์ไม่ตอบสนอง", "ต้องตรวจสอบด้วยมือ", "สัญญาณ Wi-Fi ต่ำ", "ต้องปรับเทียบมิเตอร์", "ค่า OCR ผิดปกติ", "อุปกรณ์ออฟไลน์", "แบตเตอรี่ต่ำ"}
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

	// Seed WaterMeterValue โดยตรง (ไม่ต้อง WaterMeterImage)
	cameraDeviceID := uint(1)
	prevValue := uint(33504)
	dailyUsages := []int{5, 7, 6, 8, 6, 5, 7, 6, 8, 10, 6, 7, 8, 5, 9, 7, 8, 9, 7, 9, 8, 6, 7, 9, 7, 6, 9, 7, 9, 7}
	year := time.Now().Year()
	month := time.September

	for day := 1; day <= len(dailyUsages); day++ {
		ts := time.Date(year, month, day, 10, 0, 0, 0, time.Local)
		dailyUsage := dailyUsages[day-1]
		meterValue := int(prevValue) + dailyUsage

		// กำหนด path รูปตรง ๆ
		imagePath := fmt.Sprintf("uploads/meter%d.jpg", day)

		wm := entity.WaterMeterValue{
			MeterValue:      meterValue,
			Timestamp:       ts,
			ModelConfidence: 95,
			CameraDeviceID:  cameraDeviceID,
			StatusID:        2,
			ImagePath:       imagePath,
		}
		db.Create(&wm)

		// Daily usage
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
