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
	dsn := "host=localhost user=postgres password=danuam123 dbname=waterdb port=5432 sslmode=disable TimeZone=Asia/Bangkok"

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
		&entity.DeviceCredential{},
	)
	seedRoles()
	seedPositions()
	seedGenders()
	seedStatuses()
	seedMeterLocations()
	seedUsers()
	cameraDevices := seedCameraDevices()
	seedNotifications(cameraDevices)
	seedWaterMeterValues()
	seedDeviceCredentials()
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
		{Name: "อาคารโรงอาหาร", Latitude: 14.86447, Longitude: 102.03611},
		{Name: "อาคารศูนย์สุขภาพช่องปาก", Latitude: 14.865616, Longitude: 102.035624},
		{Name: "อาคารศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.867498, Longitude: 102.036364},
		{Name: "อาคารศูนย์รังสีวินิจฉัย", Latitude: 14.864439, Longitude: 102.034975},
		{Name: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.865564, Longitude: 102.034149},
		{Name: "อาคารสร้างเสริมสุขภาพ", Latitude: 14.864143, Longitude: 102.034492},
		{Name: "อาคารพยาธิวิทยาโภชนาการ", Latitude: 14.867472, Longitude: 102.034165},
	}
	for _, ml := range meterLocations {
		db.FirstOrCreate(&ml, &entity.MeterLocation{Name: ml.Name})
	}
}

func seedUsers() {
	// Gender & Role
	maleID := uint(1)
	femaleID := uint(2)
	roleUserID := uint(1)
	roleAdminID := uint(2)

	// Positions
	managerPositionID := uint(1)
	engineerPositionID := uint(2)

	users := []entity.Users{
		{
			FirstName: "แอดมิน", LastName: "พี่เจน", Email: "suthadmin@gmail.com", Age: 25,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1988-11-12"),
			GenderID: femaleID, RoleID: roleAdminID, PositionID: managerPositionID,
		},
		{
			FirstName: "ดนุพร", LastName: "สีสินธุ์", Email: "danuporn@gmail.com", Age: 22,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1979-05-20"),
			GenderID: maleID, RoleID: roleUserID, PositionID: engineerPositionID,
		},
		{
			FirstName: "อภิรัตน์", LastName: "แสงอรุณ", Email: "apirat@gmail.com", Age: 22,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1992-07-15"),
			GenderID: maleID, RoleID: roleUserID, PositionID: engineerPositionID,
		},
		{
			FirstName: "นนทกานต์", LastName: "ใสโสก", Email: "nontakarn@gmail.com", Age: 22,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1992-07-15"),
			GenderID: maleID, RoleID: roleUserID, PositionID: engineerPositionID,
		},
		{
			FirstName: "ณัฐวุฒิ", LastName: "ถินราช", Email: "nattawut@gmail.com", Age: 22,
			Password: hashOrPanic("123456"), BirthDay: parseDate("1992-07-15"),
			GenderID: maleID, RoleID: roleUserID, PositionID: engineerPositionID,
		},
	}

	for _, u := range users {
		db.FirstOrCreate(&u, entity.Users{Email: u.Email})
	}
}

func seedCameraDevices() []entity.CameraDevice {
	cameraDevices := []entity.CameraDevice{
		{MacAddress: "11:1B:44:11:3A:B7", Status: true, MeterLocationID: uintPtr(1)},
		{MacAddress: "22:2B:45:12:3A:B9", Status: true, MeterLocationID: uintPtr(2)},
		{MacAddress: "33:3B:46:13:3B:B8", Status: false, MeterLocationID: uintPtr(3)},
		{MacAddress: "44:4B:47:14:4B:B6", Status: false, MeterLocationID: uintPtr(4)},
		{MacAddress: "55:5B:48:15:1B:B5", Status: false, MeterLocationID: uintPtr(5)},
		{MacAddress: "66:6B:49:16:2B:B4", Status: false, MeterLocationID: uintPtr(6)},
		{MacAddress: "77:7B:50:17:3C:B3", Status: true, MeterLocationID: uintPtr(7)},
		{MacAddress: "88:8B:51:18:4C:B2", Status: true, MeterLocationID: uintPtr(8)},
	}

	for i := range cameraDevices {
		db.FirstOrCreate(&cameraDevices[i], entity.CameraDevice{MacAddress: cameraDevices[i].MacAddress})
	}
	return cameraDevices
}

func seedDeviceCredentials() {
	// ตัวอย่าง devices
	devices := []struct {
		ID         uint
		MacAddress string
	}{
		{ID: 1, MacAddress: "11:1B:44:11:3A:B7"},
		{ID: 2, MacAddress: "22:2B:45:12:3A:B9"},
		{ID: 3, MacAddress: "33:3B:46:13:3B:B8"},
		{ID: 4, MacAddress: "44:4B:47:14:4B:B6"},
		{ID: 5, MacAddress: "55:5B:48:15:1B:B5"},
		{ID: 6, MacAddress: "66:6B:49:16:2B:B4"},
		{ID: 7, MacAddress: "77:7B:50:17:3C:B3"},
		{ID: 8, MacAddress: "88:8B:51:18:4C:B2"},
	}

	for _, d := range devices {
		credential := entity.DeviceCredential{
			CameraDeviceID: d.ID,
			Username:       d.MacAddress, // ใช้ MacAddress เป็น Username
			Password:       hashOrPanic("esp32_secret"),
		}
		db.FirstOrCreate(&credential, &entity.DeviceCredential{Username: credential.Username})
	}
}

func uintPtr(u uint) *uint {
	return &u
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
			UserID:          nil,
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
