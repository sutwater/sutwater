package main

import (
	"fmt"
	"net/http"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/controller/device"
	"example.com/sa-67-example/controller/genders"
	"example.com/sa-67-example/controller/line"
	"example.com/sa-67-example/controller/meter"
	"example.com/sa-67-example/controller/notification"
	"example.com/sa-67-example/controller/upload_image"
	"example.com/sa-67-example/controller/users"
	"example.com/sa-67-example/controller/waterlog"
	"example.com/sa-67-example/controller/waterusage"
	"example.com/sa-67-example/controller/watervalue"
	"example.com/sa-67-example/middlewares"
	"example.com/sa-67-example/services"
	"github.com/gin-gonic/gin"
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
		router.DELETE("/watervalue/:id", watervalue.DeleteCameraDeviceDataByID)

		//Notification
		router.GET("/notifications/:id", notification.GetNotificationsByMeterLocation)
		router.GET("/notifications", notification.GetAllNotifications)
		router.PATCH("/notifications", notification.ReadAllNotifications)
		router.PATCH("/notifications/:id", notification.ReadNotificationByID)
		router.DELETE("/notifications/:id", notification.DeleteNotificationByID)

		//Meter
		router.GET("/meters", meter.GetAllMeters)
		router.POST("/meters", meter.CreateMeter)
		router.PATCH("/meters", meter.CreateMeter)
		router.DELETE("/meters", meter.CreateMeter)

		//CameraDevice
		router.GET("/cameradevices", device.GetCameraDevices)
		router.GET("/cameradevices/without-mac", device.GetMeterLocationsWithoutCamera)
		router.GET("/cameradevice/:id", device.GetCameraDeviceByID)
		router.POST("/cameradevice", device.CreateCameraDevice)
		router.PATCH("/cameradevice/:id", device.UpdateCameraDevice)
		router.DELETE("/cameradevice/:id", device.DeleteCameraDevice)

	}

	r.POST("/upload_image", upload_image.UploadMeterImage)
	r.POST("/api/water-usage", waterusage.PostWaterUsage)
	r.GET("/api/water-usage/latest", waterusage.GetLatestUsage)
	r.GET("/api/water-usage", waterusage.GetAllWaterUsage)
	r.GET("/api/water-usage/daily/:locationId", waterusage.GetDailyUsage)

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
