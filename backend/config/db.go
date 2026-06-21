package config

import (
	"time"

	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func SetupDatabase(database *gorm.DB) error {
	err := database.AutoMigrate(
		&entity.Genders{},
		&entity.Position{},
		&entity.Role{},
		&entity.User{},
		&entity.Location{},
		&entity.Device{},
		&entity.Message{},
		&entity.StatusWaterValue{},
		&entity.StatusLog{},
		&entity.WaterMeterValue{},
		&entity.MaintainLog{},
		&entity.DeviceCredential{},
	)
	seedGenders(database)
	seedPositions(database)
	// seedRoles()
	// seedUsers()
	// seedLocations()
	// seedDevices()
	// seedMessage()
	// seedStatusWaterValue()
	// seedStatusLog()
	// seedWaterMeterValues()
	// seedMaintainLog()
	// seedDeviceCredentials()
	return err
}

func seedGenders(database *gorm.DB) {
	genders := []entity.Genders{
		{Gender: "Male"},
		{Gender: "Female"},
		{Gender: "Other"},
	}
	for _, g := range genders {
		database.FirstOrCreate(&g, entity.Genders{Gender: g.Gender})
	}
}

func seedPositions(database *gorm.DB) map[string]entity.Position {
	positions := []string{"Manager", "Engineer", "Technician", "Staff"}
	posMap := make(map[string]entity.Position)

	for _, name := range positions {
		var p entity.Position
		database.FirstOrCreate(&p, entity.Position{Position: name})
		posMap[name] = p
	}
	return posMap
}

// func seedRoles() {
// 	roles := []entity.Role{
// 		{Role: "Admin"},
// 		{Role: "User"},
// 		{Role: "Engineer"},
// 		{Role: "Technician"},
// 	}
// 	for _, r := range roles {
// 		db.FirstOrCreate(&r, entity.Role{Role: r.Role})
// 	}
// }

// func seedStatusWaterValue() {
// 	statuses := []entity.StatusWaterValue{
// 		{StatusValue: "pending", Description: "รอการอนุมัติ"},
// 		{StatusValue: "approved", Description: "อนุมัติแล้ว"},
// 		{StatusValue: "rejected", Description: "ไม่อนุมัติ"},
// 	}
// 	for _, s := range statuses {
// 		db.FirstOrCreate(&s, entity.StatusWaterValue{StatusValue: s.StatusValue})
// 	}
// }

// func seedStatusLog() {
// 	statuses := []entity.StatusLog{
// 		{StatusLog: "pending", Description: "รอดำเนินการแก้ไข"},
// 		{StatusLog: "solving", Description: "กำลังแก้ไข"},
// 		{StatusLog: "solved", Description: "แก้ไขแล้ว"},
// 		{StatusLog: "rejected", Description: "ไม่มีการแก้ไข"},
// 	}
// 	for _, s := range statuses {
// 		db.FirstOrCreate(&s, entity.StatusLog{StatusLog: s.StatusLog})
// 	}
// }
// func seedLocations() {
// 	meterLocations := []entity.Location{
// 		{BuildingName: "อาคารรัตนเวชพัฒน์", Latitude: 14.86412, Longitude: 102.03557},
// 		{BuildingName: "อาคารโรงอาหาร", Latitude: 14.86447, Longitude: 102.03611},
// 		{BuildingName: "อาคารศูนย์สุขภาพช่องปาก", Latitude: 14.865616, Longitude: 102.035624},
// 		{BuildingName: "อาคารศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.867498, Longitude: 102.036364},
// 		{BuildingName: "อาคารศูนย์รังสีวินิจฉัย", Latitude: 14.864439, Longitude: 102.034975},
// 		{BuildingName: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.865564, Longitude: 102.034149},
// 		{BuildingName: "อาคารสร้างเสริมสุขภาพ", Latitude: 14.864143, Longitude: 102.034492},
// 		{BuildingName: "อาคารพยาธิวิทยาโภชนาการ", Latitude: 14.867472, Longitude: 102.034165},
// 	}
// 	for _, ml := range meterLocations {
// 		db.FirstOrCreate(&ml, &entity.Location{BuildingName: ml.BuildingName})
// 	}
// }

// func seedUsers() {
// 	// Gender & Role
// 	maleID := uint(1)
// 	femaleID := uint(2)
// 	roleUserID := uint(2)
// 	roleAdminID := uint(1)
// 	// Positions
// 	managerPositionID := uint(1)
// 	engineerPositionID := uint(2)

// 	users := []entity.User{
// 		{
// 			FirstName: "แอดมิน", LastName: "โรงบาล", Email: "suth@gmail.com", Age: 25,
// 			Password: hashOrPanic("123"), BirthDay: parseDate("1998-11-12"),
// 			GenderID: femaleID, RoleID: roleAdminID, PositionID: managerPositionID,
// 		},
// 		{
// 			FirstName: "ดนุพร", LastName: "สีสินธุ์", Email: "danuporn@gmail.com", Age: 22,
// 			Password: hashOrPanic("123"), BirthDay: parseDate("2003-05-20"),
// 			GenderID: maleID, RoleID: roleUserID, PositionID: engineerPositionID,
// 		},
// 		{
// 			FirstName: "อภิรัตน์", LastName: "แสงอรุณ", Email: "apirat@gmail.com", Age: 22,
// 			Password: hashOrPanic("123"), BirthDay: parseDate("2003-06-08"),
// 			GenderID: maleID, RoleID: roleUserID, PositionID: engineerPositionID,
// 		},
// 	}

// 	for _, u := range users {
// 		db.FirstOrCreate(&u, entity.User{Email: u.Email})
// 	}
// }

// func seedDevices() []entity.Device {
// 	cameraDevices := []entity.Device{
// 		{MacAddress: "11:1B:44:11:3A:B7", LocationID: uintPtr(1)},
// 		{MacAddress: "22:2B:45:12:3A:B9", LocationID: uintPtr(2)},
// 		{MacAddress: "33:3B:46:13:3B:B8", LocationID: uintPtr(3)},
// 		{MacAddress: "44:4B:47:14:4B:B6", LocationID: uintPtr(4)},
// 		{MacAddress: "55:5B:48:15:1B:B5", LocationID: uintPtr(5)},
// 		{MacAddress: "66:6B:49:16:2B:B4", LocationID: uintPtr(6)},
// 		{MacAddress: "77:7B:50:17:3C:B3", LocationID: uintPtr(7)},
// 		{MacAddress: "88:8B:51:18:4C:B2", LocationID: uintPtr(8)},
// 	}

// 	for i := range cameraDevices {
// 		db.FirstOrCreate(&cameraDevices[i], entity.Device{MacAddress: cameraDevices[i].MacAddress})
// 	}
// 	return cameraDevices
// }

// func seedDeviceCredentials() {
// 	// ตัวอย่าง devices
// 	devices := []struct {
// 		ID         uint
// 		MacAddress string
// 	}{
// 		{ID: 1, MacAddress: "11:1B:44:11:3A:B7"},
// 		{ID: 2, MacAddress: "22:2B:45:12:3A:B9"},
// 		{ID: 3, MacAddress: "33:3B:46:13:3B:B8"},
// 		{ID: 4, MacAddress: "44:4B:47:14:4B:B6"},
// 		{ID: 5, MacAddress: "55:5B:48:15:1B:B5"},
// 		{ID: 6, MacAddress: "66:6B:49:16:2B:B4"},
// 		{ID: 7, MacAddress: "77:7B:50:17:3C:B3"},
// 		{ID: 8, MacAddress: "88:8B:51:18:4C:B2"},
// 	}

// 	for _, d := range devices {
// 		credential := entity.DeviceCredential{
// 			DeviceID: d.ID,
// 			Username: d.MacAddress, // ใช้ MacAddress เป็น Username
// 			Password: hashOrPanic("esp32_secret"),
// 		}
// 		db.FirstOrCreate(&credential, &entity.DeviceCredential{Username: credential.Username})
// 	}
// }

// func uintPtr(u uint) *uint {
// 	return &u
// }

// func seedMessage() {
// 	var notifications []entity.Message // ใช้ var ในการประกาศ slice ที่ยังไม่มีข้อมูลจะดู Go-idiomatic กว่า

// 	messages := []string{
// 		"น้ำรั่ว",
// 		"ท่อแตก",
// 		"มิเตอร์ไม่ทำงาน",
// 		"ต้องตรวจสอบด้วยมือ",
// 		"ค่ามิเตอร์น้ำสูงผิดปกติ",
// 		"ค่ามิเตอร์น้ำต่ำผิดปกติ",
// 	}

// 	for _, msgText := range messages {
// 		newMsg := entity.Message{
// 			Message: msgText,
// 			IsRead:  false,
// 		}
// 		notifications = append(notifications, newMsg)
// 	}

// 	if err := db.Create(&notifications).Error; err != nil {
// 		return
// 	}

// }

// func seedWaterMeterValues() {
// 	cameraDeviceID := uint(1)
// 	prevValue := uint(33504)
// 	dailyUsages := []int{5, 7, 6, 8, 6, 5, 7, 6, 8, 10, 6, 7, 8, 5, 9, 7, 8, 9, 7, 9, 8, 6, 7, 9, 7, 6, 9, 7, 9, 7}
// 	year := time.Now().Year()
// 	month := time.September

// 	for day := 1; day <= len(dailyUsages); day++ {
// 		ts := time.Date(year, month, day, 10, 0, 0, 0, time.Local)
// 		dailyUsage := dailyUsages[day-1]
// 		meterValue := int(prevValue) + dailyUsage

// 		imagePath := fmt.Sprintf("uploads/meter%d.jpg", 1)

// 		var adminUser entity.User
// 		db.First(&adminUser, "email = ?", "suth@gmail.com") // หรือ user อื่นที่มีอยู่จริง

// 		wm := entity.WaterMeterValue{
// 			MeterValue:      meterValue,
// 			Timestamp:       ts,
// 			ModelConfidence: 95,
// 			DeviceID:        cameraDeviceID,
// 			StatusID:        1,
// 			ImagePath:       imagePath,
// 			UserID:          1,
// 		}

// 		db.Create(&wm)

// 		prevValue = uint(meterValue)
// 	}
// }

// func seedMaintainLog() {

// 	loc1, loc2 := uint(1), uint(2)
// 	status1, status2 := uint(1), uint(2)

// 	now := time.Now()

// 	logs := []entity.MaintainLog{
// 		{
// 			Title:        "ซ่อมท่อประปาแตก",
// 			LocationText: "ชั้น 1 หน้าอาคาร A",
// 			CloseAt:      now.Add(24 * time.Hour),
// 			LocationID:   &loc1,
// 			StatusID:     &status1,
// 		},
// 		{
// 			Title:        "เปลี่ยนมิเตอร์น้ำใหม่เนื่องจากพัง",
// 			LocationText: "ห้อง 205 ตึก B",
// 			CloseAt:      now.Add(48 * time.Hour),
// 			LocationID:   &loc2,
// 			StatusID:     &status2,
// 		},
// 		{
// 			Title:        "ตรวจสอบวาล์วน้ำซึม",
// 			LocationText: "ดาดฟ้าตึก C",
// 			LocationID:   nil,
// 			StatusID:     &status1,
// 		},
// 	}

// 	if err := db.Create(&logs).Error; err != nil {
// 		return
// 	}

// }

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
