package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/controller/device"
	"github.com/watermeter/suth/controller/genders"
	"github.com/watermeter/suth/controller/line"
	"github.com/watermeter/suth/controller/meter"
	"github.com/watermeter/suth/controller/notification"
	"github.com/watermeter/suth/controller/upload_image"
	"github.com/watermeter/suth/controller/users"
	"github.com/watermeter/suth/controller/waterlog"
	"github.com/watermeter/suth/controller/waterusage"
	"github.com/watermeter/suth/controller/watervalue"
	"github.com/watermeter/suth/middlewares"
	"github.com/watermeter/suth/services"
)

const PORT = "8000"

func main() {
	config.Load()
	// ✅ เชื่อมต่อฐานข้อมูล และ Setup data
	config.ConnectionDB()
	config.SetupDatabase()

	// ✅ ดึง db ที่ถูกตั้งค่าแล้ว
	db := config.DB()

	// ✅ ส่ง db ให้ services ใช้
	services.SetDatabase(db)

	// ✅ เริ่ม Gin Server
	r := gin.Default()
	r.Use(CORSMiddleware())

	// ✅ Public routes
	r.POST("/signup", users.SignUp)
	r.POST("/signin", users.SignIn)

	r.GET("/genders", genders.GetAll)

	r.GET("/liff-link", func(c *gin.Context) {
		q := c.Request.URL.RawQuery
		target := fmt.Sprintf("%s/liff-link", config.Cfg.DashboardURL) // DASHBOARD_URL ต้องเป็น ngrok/frontend
		if q != "" {
			target += "?" + q
		}
		c.Redirect(http.StatusTemporaryRedirect, target) // 307/307-like
	})

	lineGroup := r.Group("/line")
	{
		lineGroup.POST("/webhook", line.WebhookHandler)         // Route สำหรับ Webhook
		lineGroup.POST("/link-account", line.LinkLineAccount)   // Route สำหรับเชื่อมบัญชี
		lineGroup.GET("/check-link", line.CheckLinkHandler)     // Route สำหรับตรวจสอบการเชื่อมบัญชี
		lineGroup.POST("/send-message", line.SendMessageToUser) // Route สำหรับส่งข้อความ
		lineGroup.POST("/send-notifications", line.SendNotifications)
		lineGroup.GET("/get-qrcode", line.GetQRCodeHandler)
		lineGroup.POST("/save-line-userid", line.SaveLineUserID)
		lineGroup.POST("/login", line.LoginWithLine)
	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})
	r.Static("/uploads", "./uploads")

	// ✅ Protected routes
	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())
		//User
		router.PUT("/user/:id", users.Update)
		router.GET("/users", users.GetAll)
		router.GET("/user/:id", users.Get)
		router.DELETE("/user/:id", users.Delete)

		//Waterlog
		router.GET("/waterusages", waterlog.GetAllWaterUsageValues)
		router.GET("/waterdetail", waterlog.GetAllCameraDevicesWithUsage)
		router.GET("/waterdetail/:id", waterlog.GetCameraDeviceWithUsage)
		router.GET("/watervalue/req/:id", waterlog.GetWaterMeterValueByCameraDeviceID)
		//router.GET("/watervalue/req", waterlog.GetAllPendingWaterMeterValues)
		router.GET("/watervalue/:id", watervalue.GetWaterMeterValueByID)
		router.GET("/watervalue/status", watervalue.GetWaterMeterValueStatus)
		router.POST("/watervalue", watervalue.CreateWaterMeterValue)
		router.PATCH("/watervalue/:id", watervalue.UpdateWaterMeterValue)
		router.PATCH("/watervalue/status/:id", watervalue.UpdateWaterMeterStatusByID)
		router.PATCH("/watervalue/status/reject/:id", watervalue.UpdateWaterMeterStatusToReJect)
		router.DELETE("/watervalue/:id", watervalue.DeleteCameraDeviceDataByID)
		router.DELETE("/watervalue/clear/:camera_id", watervalue.ClearWaterMeterDataByCameraID)

		//Notification
		router.GET("/notifications", notification.GetAllNotifications)
		router.GET("/notifications/stats", notification.GetNotificationStats)
		router.PATCH("/notifications", notification.ReadAllNotifications)
		router.PATCH("/notifications/:id", notification.ReadNotificationByID)
		router.DELETE("/notifications/:id", notification.DeleteNotificationByID)

		//Meter
		router.GET("/meters", meter.GetAllMeters)
		router.GET("/meters/manage", meter.GetAllMeterLocations)
		router.POST("/meters", meter.CreateMeter)
		router.PUT("/meters/:id", meter.UpdateMeterLocation)
		router.DELETE("/meters/:id", meter.DeleteMeterLocation)

		//CameraDevice
		router.GET("/cameradevices", device.GetCameraDevices)
		router.GET("/cameradevices/without-mac", device.GetMeterLocationsWithoutCamera)
		router.GET("/cameradevice/:id", device.GetCameraDeviceByID)
		router.POST("/cameradevice", device.CreateCameraDevice)
		router.DELETE("/cameradevice/:id", device.DeleteCameraDevicesByMeterLocationID)
		router.PUT("/cameradevice/macaddress/:id", device.UpdateCameraDeviceMacAddress)
		router.POST("/upload_image", upload_image.UploadMeterImage)

	}

	r.POST("/api/water-usage", waterusage.PostWaterUsage)
	r.GET("/api/water-usage/latest", waterusage.GetLatestUsage)
	r.GET("/api/water-usage", waterusage.GetAllWaterUsage)
	r.GET("/api/water-usage/daily/:locationId", waterusage.GetDailyUsage)
	r.GET("/api/water-usage/stats", waterusage.GetWaterUsageStats)

	// ✅ Run server
	r.Run("0.0.0.0:" + PORT)
	//r.Run("localhost:" + PORT)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigins := map[string]bool{
			"http://localhost:5173":                    true,
			"http://127.0.0.1:5173":                    true,
			"https://hj211v7t-5173.asse.devtunnels.ms": true,
		}

		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PATCH, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
