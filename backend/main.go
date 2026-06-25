package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/postgres"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/controller/device"
	"github.com/watermeter/suth/controller/maintainlog"
	"github.com/watermeter/suth/controller/meter"
	"github.com/watermeter/suth/controller/notification"
	"github.com/watermeter/suth/controller/users"
	"github.com/watermeter/suth/controller/waterlog"
	"github.com/watermeter/suth/middlewares"
	"github.com/watermeter/suth/repositories"
	"github.com/watermeter/suth/services"
)

func main() {

	db, err := postgres.Setup()
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
	}

	postgresql, err := db.DB()
	if err == nil {
		defer postgresql.Close()
	}

	c, err := postgres.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	r := gin.Default()
	r.SetTrustedProxies(nil)
	r.Use(middlewares.CORSMiddleware())

	router := r.Group("/api/v1")
	router.Static("/uploads", "./uploads")

	jwtProvider := utils.NewJWTProvider(c.JWTSecret, c.JWTExpiresIn)
	userRepository := repositories.NewUserRepository(db)

	authService := services.NewAuthService(userRepository, jwtProvider)
	userService := services.NewUserService(userRepository)

	locationRepository := repositories.NewLocationRepository(db)
	locationService := services.NewLocationService(locationRepository)

	deviceRepository := repositories.NewDeviceRepository(db)
	deviceService := services.NewDeviceService(deviceRepository, locationRepository)

	maintainLogRepository := repositories.NewMaintainLogRepository(db)
	maintainLogService := services.NewMaintainLogService(maintainLogRepository)

	waterMeterValueRepository := repositories.NewWaterMeterValueRepository(db)
	waterMeterValueService := services.NewWaterMeterValueService(waterMeterValueRepository)

	notificationRepository := repositories.NewNotificationRepository(db)
	notificationService := services.NewNotificationService(notificationRepository)

	// public API
	publicRouter := router.Group("")
	users.NewAuthHandler(publicRouter, authService, notificationService)

	// protected API
	privateRouter := router.Group("")
	privateRouter.Use(middlewares.JWTAuthMiddleware())
	users.NewUserHandler(privateRouter, userService)
	meter.NewMeterHandler(privateRouter, locationService)
	device.NewDeviceHandler(privateRouter, deviceService)
	maintainlog.NewMaintainLogHandler(privateRouter, maintainLogService, notificationService)
	waterlog.NewWaterLogHandler(privateRouter, waterMeterValueService)
	notification.NewNotificationHandler(privateRouter, notificationService)

	r.Run("localhost" + c.APIPort)
}
