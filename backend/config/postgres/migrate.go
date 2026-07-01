package postgres

import (
	"fmt"
	"time"

	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

func SetupDatabase(database *gorm.DB, resetDB bool) error {

	if resetDB {
		fmt.Println("Resetting database: Dropping and recreating public schema...")
		database.Exec("DROP SCHEMA public CASCADE;")
		database.Exec("CREATE SCHEMA public;")
		database.Exec("GRANT ALL ON SCHEMA public TO postgres;")
		database.Exec("GRANT ALL ON SCHEMA public TO public;")
		fmt.Println("Database reset completed. Starting AutoMigrate...")
	}

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
	seedRoles(database)
	seedUsers(database)
	seedLocations(database)
	seedDevices(database)
	seedMessage(database)
	seedStatusWaterValue(database)
	seedStatusLog(database)
	seedWaterMeterValues(database)
	seedMaintainLog(database)
	seedDeviceCredentials(database)
	return err
}

func seedGenders(database *gorm.DB) {
	genders := []entity.Genders{
		{Gender: "ผู้ชาย"},
		{Gender: "ผู้หญิง"},
		{Gender: "อื่น ๆ"},
	}
	for _, g := range genders {
		database.FirstOrCreate(&g, entity.Genders{Gender: g.Gender})
	}
}

func seedPositions(database *gorm.DB) map[string]entity.Position {
	positions := []string{"ผู้จัดการ", "วิศวกร", "ช่างเทคนิค", "สตาฟ"}
	posMap := make(map[string]entity.Position)

	for _, name := range positions {
		var p entity.Position
		database.FirstOrCreate(&p, entity.Position{Position: name})
		posMap[name] = p
	}
	return posMap
}

func seedRoles(database *gorm.DB) {
	roles := []entity.Role{
		{Role: "ผู้ดูแล"},
		{Role: "วิศวกร"},
		{Role: "ช่างเทคนิค"},
		{Role: "ผู้ใช้"},
	}
	for _, r := range roles {
		database.FirstOrCreate(&r, entity.Role{Role: r.Role})
	}
}

func seedStatusWaterValue(database *gorm.DB) {
	statuses := []entity.StatusWaterValue{
		{StatusValue: "pending", Description: "รอการอนุมัติ"},
		{StatusValue: "approved", Description: "อนุมัติแล้ว"},
		{StatusValue: "rejected", Description: "ไม่อนุมัติ"},
	}
	for _, s := range statuses {
		database.FirstOrCreate(&s, entity.StatusWaterValue{StatusValue: s.StatusValue})
	}
}

func seedStatusLog(database *gorm.DB) {
	statuses := []entity.StatusLog{
		{StatusLog: "pending", Description: "รอดำเนินการแก้ไข"},
		{StatusLog: "solving", Description: "กำลังแก้ไข"},
		{StatusLog: "solved", Description: "แก้ไขแล้ว"},
		{StatusLog: "rejected", Description: "ไม่มีการแก้ไข"},
	}
	for _, s := range statuses {
		database.FirstOrCreate(&s, entity.StatusLog{StatusLog: s.StatusLog})
	}
}
func seedLocations(database *gorm.DB) {
	meterLocations := []entity.Location{
		{BuildingName: "อาคารรัตนเวชพัฒน์", Latitude: 14.86412, Longitude: 102.03557},
		{BuildingName: "อาคารโรงอาหาร", Latitude: 14.86447, Longitude: 102.03611},
		{BuildingName: "อาคารศูนย์สุขภาพช่องปาก", Latitude: 14.865616, Longitude: 102.035624},
		{BuildingName: "อาคารศูนย์ความเป็นเลิศทางการแพทย์", Latitude: 14.867498, Longitude: 102.036364},
		{BuildingName: "อาคารศูนย์รังสีวินิจฉัย", Latitude: 14.864439, Longitude: 102.034975},
		{BuildingName: "อาคารวิเคราะห์และบำบัดโรค", Latitude: 14.865564, Longitude: 102.034149},
		{BuildingName: "อาคารสร้างเสริมสุขภาพ", Latitude: 14.864143, Longitude: 102.034492},
		{BuildingName: "อาคารพยาธิวิทยาโภชนาการ", Latitude: 14.867472, Longitude: 102.034165},
	}
	for _, ml := range meterLocations {
		database.FirstOrCreate(&ml, &entity.Location{BuildingName: ml.BuildingName})
	}
}

func seedUsers(database *gorm.DB) {
	// Gender & Role
	maleID := uint(1)
	femaleID := uint(2)

	roleAdminID := uint(1)
	roleEngineerID := uint(2)
	roleTechnicalID := uint(3)
	roleUserID := uint(4)
	// Positions
	managerPositionID := uint(1)
	engineerPositionID := uint(2)
	technicalID := uint(3)
	userID := uint(4)

	users := []entity.User{
		{
			FirstName: "แอดมิน", LastName: "โรงบาล", Email: "suth@gmail.com",
			Password: hashOrPanic("123"), BirthDay: parseDate("1998-11-12"),
			GenderID: &femaleID, RoleID: roleAdminID, PositionID: &managerPositionID,
		},
		{
			FirstName: "ดนุพร", LastName: "สีสินธุ์", Email: "danuporn@gmail.com",
			Password: hashOrPanic("123"), BirthDay: parseDate("2003-05-20"),
			GenderID: &maleID, RoleID: roleEngineerID, PositionID: &engineerPositionID,
		},
		{
			FirstName: "อภิรัตน์", LastName: "แสงอรุณ", Email: "apirat@gmail.com",
			Password: hashOrPanic("123"), BirthDay: parseDate("2003-06-08"),
			GenderID: &maleID, RoleID: roleTechnicalID, PositionID: &technicalID,
		},
		{
			FirstName: "บัก", LastName: "บุ๊ค", Email: "thanawat@gmail.com",
			Password: hashOrPanic("123"), BirthDay: parseDate("2002-12-15"),
			GenderID: &maleID, RoleID: roleUserID, PositionID: &userID,
		},
	}

	for _, u := range users {
		database.FirstOrCreate(&u, entity.User{Email: u.Email})
	}
}

func seedDevices(database *gorm.DB) []entity.Device {
	cameraDevices := []entity.Device{
		{MacAddress: "11:1B:44:11:3A:B7", LocationID: uintPtr(1)},
		{MacAddress: "22:2B:45:12:3A:B9", LocationID: uintPtr(2)},
		{MacAddress: "33:3B:46:13:3B:B8", LocationID: uintPtr(3)},
		{MacAddress: "44:4B:47:14:4B:B6", LocationID: uintPtr(4)},
		{MacAddress: "55:5B:48:15:1B:B5", LocationID: uintPtr(5)},
		{MacAddress: "66:6B:49:16:2B:B4", LocationID: uintPtr(6)},
		{MacAddress: "77:7B:50:17:3C:B3", LocationID: uintPtr(7)},
		{MacAddress: "88:8B:51:18:4C:B2", LocationID: uintPtr(8)},
	}

	for i := range cameraDevices {
		database.FirstOrCreate(&cameraDevices[i], entity.Device{MacAddress: cameraDevices[i].MacAddress})
	}
	return cameraDevices
}

func seedDeviceCredentials(database *gorm.DB) {
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
			DeviceID: d.ID,
			Username: d.MacAddress, // ใช้ MacAddress เป็น Username
			Password: hashOrPanic("esp32_secret"),
		}
		database.FirstOrCreate(&credential, &entity.DeviceCredential{Username: credential.Username})
	}
}

func uintPtr(u uint) *uint {
	return &u
}

func seedMessage(database *gorm.DB) {
	var notifications []entity.Message // ใช้ var ในการประกาศ slice ที่ยังไม่มีข้อมูลจะดู Go-idiomatic กว่า

	messages := []string{
		"น้ำรั่ว",
		"ท่อแตก",
		"มิเตอร์ไม่ทำงาน",
		"ต้องตรวจสอบด้วยมือ",
		"ค่ามิเตอร์น้ำสูงผิดปกติ",
		"ค่ามิเตอร์น้ำต่ำผิดปกติ",
	}

	for _, msgText := range messages {
		newMsg := entity.Message{
			Message: msgText,
			IsRead:  false,
		}
		notifications = append(notifications, newMsg)
	}

	if err := database.Create(&notifications).Error; err != nil {
		return
	}

}

func seedWaterMeterValues(database *gorm.DB) {
	type buildingConfig struct {
		deviceID    uint
		startValue  int
		dailyUsages []int // m³ consumed each day, oldest → newest
	}

	// 30 days of realistic daily usage per building type
	configs := []buildingConfig{
		{
			deviceID: 1, startValue: 33504,
			dailyUsages: []int{5, 7, 6, 8, 6, 5, 7, 6, 8, 10, 6, 7, 8, 5, 9, 7, 8, 9, 7, 9, 8, 6, 7, 9, 7, 6, 9, 7, 9, 7},
		},
		{
			deviceID: 2, startValue: 18200, // โรงอาหาร — ใช้น้ำสูง
			dailyUsages: []int{14, 12, 15, 13, 16, 14, 11, 15, 13, 17, 14, 12, 16, 13, 15, 14, 12, 16, 15, 13, 14, 16, 12, 15, 14, 13, 16, 14, 15, 13},
		},
		{
			deviceID: 3, startValue: 8500, // ศูนย์สุขภาพช่องปาก
			dailyUsages: []int{4, 5, 4, 6, 5, 4, 6, 5, 4, 7, 5, 4, 6, 5, 7, 5, 4, 6, 5, 6, 4, 5, 7, 5, 6, 4, 5, 6, 5, 4},
		},
		{
			deviceID: 4, startValue: 12000, // ศูนย์ความเป็นเลิศทางการแพทย์
			dailyUsages: []int{8, 9, 7, 10, 8, 9, 11, 8, 7, 10, 9, 8, 11, 9, 8, 10, 9, 7, 11, 9, 8, 10, 9, 8, 11, 8, 9, 10, 8, 9},
		},
		{
			deviceID: 5, startValue: 9800, // ศูนย์รังสีวินิจฉัย
			dailyUsages: []int{6, 7, 5, 8, 6, 7, 9, 6, 5, 8, 7, 6, 9, 7, 6, 8, 7, 5, 9, 7, 6, 8, 7, 6, 9, 6, 7, 8, 6, 7},
		},
		{
			deviceID: 6, startValue: 11500, // วิเคราะห์และบำบัดโรค
			dailyUsages: []int{9, 10, 8, 11, 9, 10, 12, 9, 8, 11, 10, 9, 12, 10, 9, 11, 10, 8, 12, 10, 9, 11, 10, 9, 12, 9, 10, 11, 9, 10},
		},
		{
			deviceID: 7, startValue: 7200, // สร้างเสริมสุขภาพ
			dailyUsages: []int{4, 5, 3, 6, 4, 5, 7, 4, 3, 6, 5, 4, 7, 5, 4, 6, 5, 3, 7, 5, 4, 6, 5, 4, 7, 4, 5, 6, 4, 5},
		},
		{
			deviceID: 8, startValue: 6800, // พยาธิวิทยาโภชนาการ
			dailyUsages: []int{3, 4, 3, 5, 4, 3, 5, 4, 3, 6, 4, 3, 5, 4, 6, 4, 3, 5, 4, 5, 3, 4, 6, 4, 5, 3, 4, 5, 4, 3},
		},
	}

	now := time.Now()
	totalDays := 30

	for _, cfg := range configs {
		// idempotent — skip if device already has data
		var count int64
		database.Model(&entity.WaterMeterValue{}).Where("device_id = ?", cfg.deviceID).Count(&count)
		if count > 0 {
			continue
		}

		prevValue := cfg.startValue
		for i, usage := range cfg.dailyUsages {
			daysAgo := totalDays - 1 - i
			ts := now.AddDate(0, 0, -daysAgo)
			ts = time.Date(ts.Year(), ts.Month(), ts.Day(), 9, 30, 0, 0, time.Local)

			meterValue := prevValue + usage
			statusID := uint(2) // approved สำหรับข้อมูลย้อนหลัง
			if daysAgo < 3 {
				statusID = 1 // pending สำหรับ 3 วันล่าสุด
			}

			confidence := 92.0 + float64((cfg.deviceID+uint(i))%8)

			wm := entity.WaterMeterValue{
				MeterValue:      meterValue,
				Timestamp:       ts,
				ModelConfidence: confidence,
				DeviceID:        cfg.deviceID,
				StatusID:        statusID,
				ImagePath:       fmt.Sprintf("uploads/meter%d.jpg", cfg.deviceID),
				UserID:          1,
			}
			database.Create(&wm)
			prevValue = meterValue
		}
	}
}

func seedMaintainLog(database *gorm.DB) {

	loc1, loc2 := uint(1), uint(2)
	status1, status2 := uint(1), uint(2)

	now := time.Now()

	logs := []entity.MaintainLog{
		{
			Title:        "ซ่อมท่อประปาแตก",
			LocationText: "ชั้น 1 หน้าอาคาร A",
			CloseAt:      now.Add(24 * time.Hour),
			LocationID:   &loc1,
			StatusID:     &status1,
		},
		{
			Title:        "เปลี่ยนมิเตอร์น้ำใหม่เนื่องจากพัง",
			LocationText: "ห้อง 205 ตึก B",
			CloseAt:      now.Add(48 * time.Hour),
			LocationID:   &loc2,
			StatusID:     &status2,
		},
		{
			Title:        "ตรวจสอบวาล์วน้ำซึม",
			LocationText: "ดาดฟ้าตึก C",
			LocationID:   nil,
			StatusID:     &status1,
		},
	}

	if err := database.Create(&logs).Error; err != nil {
		return
	}

}

func hashOrPanic(password string) string {
	hashed, err := utils.HashPassword(password)
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
