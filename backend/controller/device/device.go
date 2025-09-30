package device

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"
	"github.com/gin-gonic/gin"
)

// GetCameraDevices ดึงข้อมูล CameraDevice ทั้งหมด
func GetCameraDevices(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var cameras []entity.CameraDevice

	// preload MeterLocation ให้ดึงข้อมูล location มาด้วย
	if err := db.Preload("MeterLocation").Find(&cameras).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cameras)
}

// GetCameraDeviceByID ดึงข้อมูล CameraDevice ตาม ID
func GetCameraDeviceByID(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var camera entity.CameraDevice

	// preload MeterLocation และ WaterMeterValue ด้วย
	if err := db.Preload("MeterLocation").
		Preload("WaterMeterValue").
		Preload("DailyWaterUsage").
		Preload("Notification").
		First(&camera, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CameraDevice not found"})
		return
	}

	c.JSON(http.StatusOK, camera)
}

func GetMeterLocationsWithoutCamera(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	var locations []entity.MeterLocation

	// วิธีใช้ LEFT JOIN
	if err := db.
		Model(&entity.MeterLocation{}).
		Joins("LEFT JOIN camera_devices ON camera_devices.meter_location_id = meter_locations.id").
		Where("camera_devices.id IS NULL").
		Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, locations)
}

func CreateCameraDevice(c *gin.Context) {
	db := config.DB()

	// อ่านค่าโดยตรงจาก FormData
	macAddress := c.PostForm("MacAddress")
	password := c.PostForm("PassWord")
	meterLocationIDStr := c.PostForm("CameraDeviceID")

	if macAddress == "" || password == "" || meterLocationIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ครบถ้วน"})
		return
	}

	// แปลง ID เป็น uint
	meterLocationID64, err := strconv.ParseUint(meterLocationIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CameraDeviceID ต้องเป็นตัวเลข"})
		return
	}
	meterLocationID := uint(meterLocationID64)

	// หา MeterLocation
	var meterLocation entity.MeterLocation
	if err := db.First(&meterLocation, meterLocationID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ MeterLocation"})
		return
	}

	// สร้าง Camera Device
	camera := entity.CameraDevice{
		MacAddress:      macAddress,
		MeterLocationID: meterLocationID,
	}

	if err := db.Create(&camera).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "UNIQUE constraint") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "MacAddress นี้มีอยู่แล้ว"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลกล้องได้: " + err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := config.HashPassword(password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัส Password ได้: " + err.Error()})
		return
	}

	// สร้าง DeviceCredential
	credential := entity.DeviceCredential{
		CameraDeviceID: camera.ID,
		Username:       macAddress,
		Password:       hashedPassword,
	}

	if err := db.Create(&credential).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "UNIQUE constraint") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "MacAddress (Username) นี้มีอยู่แล้ว"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก Credential ได้: " + err.Error()})
		return
	}

	// สร้าง Notification
	notification := entity.Notification{
		Message:        fmt.Sprintf("ลงทะเบียนอุปกรณ์ %s สำเร็จ ที่ %s", macAddress, meterLocation.Name),
		CameraDeviceID: camera.ID,
		IsRead:         false,
	}

	if err := db.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Notification ไม่สำเร็จ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "สร้างอุปกรณ์กล้องและ Credential สำเร็จ",
		"data": gin.H{
			"camera":       camera,
			"credential":   credential,
			"notification": notification,
		},
	})
}

func UpdateCameraDeviceMacAddress(c *gin.Context) {
	db := config.DB()

	// ดึง ID จาก param
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องระบุ ID"})
		return
	}

	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ต้องเป็นตัวเลข"})
		return
	}

	// ดึงค่า MacAddress จาก body
	var input struct {
		MacAddress string `json:"MacAddress"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// อัปเดต MAC Address
	result := db.Model(&entity.CameraDevice{}).
		Where("id = ?", id).
		Update("mac_address", input.MacAddress)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต MAC Address ล้มเหลว: " + result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "ไม่พบอุปกรณ์ที่ตรงกับ ID นี้"})
		return
	}

	// โหลด CameraDevice พร้อม MeterLocation
	var camera entity.CameraDevice
	if err := db.Preload("MeterLocation").First(&camera, id).Error; err != nil {
		log.Println("ไม่สามารถโหลด CameraDevice สำหรับ Notification:", err)
	}

	locationName := "ไม่ทราบตำแหน่ง"
	if camera.MeterLocation != nil {
		locationName = camera.MeterLocation.Name
	}

	// สร้าง Notification หลังจากอัปเดตสำเร็จ
	notif := entity.Notification{
		Message:        fmt.Sprintf("อุปกรณ์ที่ %s ถูกอัปเดต MAC Address เป็น %s เรียบร้อยแล้ว", locationName, input.MacAddress),
		CameraDeviceID: uint(id),
		IsRead:         false,
	}

	if err := db.Create(&notif).Error; err != nil {
		log.Println("ไม่สามารถสร้าง Notification ได้:", err)
	}

	// ตอบกลับ client
	c.JSON(http.StatusOK, gin.H{
		"message":       "อัปเดต MAC Address สำเร็จ",
		"rows_affected": result.RowsAffected,
	})
}

func DeleteCameraDevicesByMeterLocationID(c *gin.Context) {
	db := config.DB()

	// อ่านค่า MeterLocationID จาก param
	meterLocationIDStr := c.Param("id") // ใช้ param ตาม route
	if meterLocationIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องระบุ MeterLocationID"})
		return
	}

	meterLocationID, err := strconv.ParseUint(meterLocationIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MeterLocationID ต้องเป็นตัวเลข"})
		return
	}

	result := db.Unscoped().Where("meter_location_id = ?", meterLocationID).Delete(&entity.CameraDevice{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลอุปกรณ์ล้มเหลว: " + result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "ไม่พบอุปกรณ์ที่ตรงกับ MeterLocationID นี้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "ลบอุปกรณ์สำเร็จ",
		"rows_affected": result.RowsAffected,
	})
}