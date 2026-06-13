package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config"
	"github.com/watermeter/suth/controller/device"
	"github.com/watermeter/suth/controller/genders"
	"github.com/watermeter/suth/controller/meter"
	"github.com/watermeter/suth/controller/notification"
	"github.com/watermeter/suth/controller/upload_image"
	"github.com/watermeter/suth/controller/users"
	"github.com/watermeter/suth/controller/waterlog"
	"github.com/watermeter/suth/controller/watervalue"
	"github.com/watermeter/suth/middlewares"
)

func main() {
	config.ConnectDB()
	config.SetupDatabase()

	PORT := os.Getenv("PORT")

	if PORT == "" {
		PORT = "8080"
	}

	r := gin.Default()
	r.Use(CORSMiddleware())

	r.POST("/signup", users.SignUp)
	r.POST("/signin", users.SignIn)
	r.GET("/genders", genders.GetAll)

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	r.Static("/uploads", "./uploads")

	router := r.Group("/")
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
	router.GET("/meter/name/:id", meter.GetMeterLocationByID)

	//CameraDevice
	router.GET("/cameradevices", device.GetCameraDevices)
	router.GET("/cameradevices/without-mac", device.GetMeterLocationsWithoutCamera)
	router.GET("/cameradevice/:id", device.GetCameraDeviceByID)
	router.POST("/cameradevice", device.CreateCameraDevice)
	router.DELETE("/cameradevice/:id", device.DeleteCameraDevicesByMeterLocationID)
	router.PUT("/cameradevice/macaddress/:id", device.UpdateCameraDeviceMacAddress)
	router.POST("/upload_image", upload_image.UploadMeterImage)

	// r.GET("/api/water-usage/latest", waterusage.GetLatestUsage)
	// r.GET("/api/water-usage", waterusage.GetAllWaterUsage)
	// r.GET("/api/water-usage/daily/:locationId", waterusage.GetDailyUsage)
	// r.GET("/api/water-usage/stats", waterusage.GetWaterUsageStats)

	//r.Run("0.0.0.0:" + PORT)
	r.Run("localhost:" + PORT)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigins := map[string]bool{
			"http://localhost:5173":                    true,
			"http://127.0.0.1:5173":                    true,
			"http://192.168.1.193:5173":                true,
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
