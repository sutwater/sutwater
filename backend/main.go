package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
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
	"github.com/watermeter/suth/pkg/postgres"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: No .env file found, using system environment variables")
		return
	}

	db := postgres.Setup()
	postgresql, err := db.DB()
	if err == nil {
		defer postgresql.Close()
	}

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	r.POST("/signup", users.SignUp)
	r.POST("/signin", users.SignIn)
	r.GET("/genders", genders.GetAll)

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

	c := config.LoadConfig()
	r.Run("localhost" + c.APIPort)
}
