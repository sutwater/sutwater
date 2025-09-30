package config

import (
	"fmt"
	"time"

	"github.com/watermeter/suth/entity"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	dsn := "host=localhost user=watermeter password=watermeter dbname=waterdb port=5432 sslmode=disable TimeZone=Asia/Bangkok"

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("connected database successfully")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Genders{},
		&entity.Position{},
		&entity.Role{},
		&entity.Users{},
		&entity.MeterLocation{},
		&entity.CameraDevice{},
		&entity.Notification{},
		&entity.StatusWaterValue{},
		&entity.WaterMeterValue{},
		&entity.DailyWaterUsage{},
		&entity.WaterUsage{},
		&entity.DeviceCredential{},
	)
	seedRoles()
	seedPositions()
	seedGenders()
	seedStatuses()
	seedMeterLocations()
	seedUsers()
	seedDeviceCredentials()
	cameraDevices := seedCameraDevices()
	seedNotifications(cameraDevices)
	seedWaterMeterValues()
}

func seedGenders() {
	genders := []entity.Genders{
		{Gender: "Male"},
		{Gender: "Female"},
	}
	for _, g := range genders {
		db.FirstOrCreate(&g, entity.Genders{Gender: g.Gender})
	}
}

func seedPositions() map[string]entity.Position {
	positions := []string{"Manager", "Engineer", "Staff", "Technician"}
	posMap := make(map[string]entity.Position)

	for _, name := range positions {
		var p entity.Position
		db.FirstOrCreate(&p, entity.Position{Position: name})
		posMap[name] = p
	}
	return posMap
}

func seedRoles() {
	roles := []entity.Role{
		{Role: "User"},  // id = 1
		{Role: "Admin"}, // id = 2
	}
	for _, r := range roles {
		db.FirstOrCreate(&r, entity.Role{Role: r.Role})
	}
}

func seedStatuses() {
	statuses := []entity.StatusWaterValue{
		{Name: "pending", Description: "รอการอนุมัติ"},
		{Name: "approved", Description: "อนุมัติแล้ว"},
		{Name: "rejected", Description: "ไม่อนุมัติ"},
	}
	for _, s := range statuses {
		db.FirstOrCreate(&s, entity.StatusWaterValue{Name: s.Name})
	}
}

func seedMeterLocations() {
	meterLocations := []entity.MeterLocation{
		{Name: "อาคารรัตนเวชพัฒน์", Latitude: 14.86412, Longitude: 102.03557},
		{Name: "โรงอาหาร", Latitude: 14.86447, Longitude: 102.03611},
		{Name: "ศูนย์สุขภาพช่องปาก", Latitude: 14.865616, Longitude: 102.035624},
		{Name: "ศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.867498, Longitude: 102.036364},
		{Name: "ศูนย์รังสีวินิจฉัย", Latitude: 14.864439, Longitude: 102.034975},
		{Name: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.865564, Longitude: 102.034149},
		{Name: "B3102", Latitude: 14.865564, Longitude: 102.034149},
		{Name: "B3106", Latitude: 14.865564, Longitude: 102.034149},
	}
	for _, ml := range meterLocations {
		db.FirstOrCreate(&ml, &entity.MeterLocation{Name: ml.Name})
	}
}

func seedUsers() {
	// Gender & Role
	var male, female entity.Genders
	var roleUser, roleAdmin entity.Role
	db.FirstOrCreate(&male, entity.Genders{Gender: "Male"})
	db.FirstOrCreate(&female, entity.Genders{Gender: "Female"})
	db.FirstOrCreate(&roleUser, entity.Role{Role: "User"})
	db.FirstOrCreate(&roleAdmin, entity.Role{Role: "Admin"})

	// Positions
	positions := seedPositions()

	users := []entity.Users{
		{
			FirstName: "แอดมิน", LastName: "พี่เจน", Email: "suthadmin@gmail.com", Age: 25,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1988-11-12"),
			GenderID: female.ID, RoleID: roleAdmin.ID, PositionID: positions["Manager"].ID,
		},
		{
			FirstName: "ดนุพร", LastName: "สีสินธุ์", Email: "danuporn@gmail.com", Age: 22,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1979-05-20"),
			GenderID: male.ID, RoleID: roleUser.ID, PositionID: positions["Engineer"].ID,
		},
		{
			FirstName: "อภิรัตน์", LastName: "แสงอรุณ", Email: "apirat@gmail.com", Age: 22,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1992-07-15"),
			GenderID: male.ID, RoleID: roleUser.ID, PositionID: positions["Engineer"].ID,
		},
	}

	for _, u := range users {
		db.FirstOrCreate(&u, entity.Users{Email: u.Email})
	}
}

func seedDeviceCredentials() {
	devices := []entity.DeviceCredential{
		{CameraDeviceID: 1, Username: "esp32_cam_01", Password: hashOrPanic("esp32_secret")},
	}
	for _, d := range devices {
		db.FirstOrCreate(&d, &entity.DeviceCredential{Username: d.Username})
	}
}

func seedCameraDevices() []entity.CameraDevice {
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
	return cameraDevices
}

func seedNotifications(cameraDevices []entity.CameraDevice) {
	notifications := []entity.Notification{}
	messages := []string{"พบน้ำรั่ว", "ท่อแตก", "มิเตอร์ไม่ตอบสนอง", "ต้องตรวจสอบด้วยมือ", "ค่ามิเตอร์น้ำสูงผิดปกติ", "ค่ามิเตอร์น้ำต่ำผิดปกติ"}

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
}

func seedWaterMeterValues() {
	cameraDeviceID := uint(1)
	prevValue := uint(33504)
	dailyUsages := []int{5, 7, 6, 8, 6, 5, 7, 6, 8, 10, 6, 7, 8, 5, 9, 7, 8, 9, 7, 9, 8, 6, 7, 9, 7, 6, 9, 7, 9, 7}
	year := time.Now().Year()
	month := time.September

	for day := 1; day <= len(dailyUsages); day++ {
		ts := time.Date(year, month, day, 10, 0, 0, 0, time.Local)
		dailyUsage := dailyUsages[day-1]
		meterValue := int(prevValue) + dailyUsage

		imagePath := fmt.Sprintf("uploads/meter%d.jpg", day)

		var adminUser entity.Users
		db.First(&adminUser, "email = ?", "suthadmin@gmail.com") // หรือ user อื่นที่มีอยู่จริง

		wm := entity.WaterMeterValue{
			MeterValue:      meterValue,
			Timestamp:       ts,
			ModelConfidence: 95,
			CameraDeviceID:  cameraDeviceID,
			StatusID:        1,
			ImagePath:       imagePath,
			UserID:          adminUser.ID, // <-- เพิ่มตรงนี้
		}

		db.Create(&wm)

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
