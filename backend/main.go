package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"example.com/sa-67-example/config"
	"example.com/sa-67-example/controller/genders"
	"example.com/sa-67-example/controller/meter"
	"example.com/sa-67-example/controller/users"
	"example.com/sa-67-example/controller/waterusage"
	"example.com/sa-67-example/entity"
	"example.com/sa-67-example/middlewares"
	"example.com/sa-67-example/services"
	"example.com/sa-67-example/controller/upload_image"
)

const PORT = "8000"

func main() {
	// ✅ เชื่อมต่อฐานข้อมูล และ Setup data
	config.ConnectionDB()
	config.SetupDatabase()

	// ✅ ดึง db ที่ถูกตั้งค่าแล้ว
	db := config.DB()

	// ✅ ส่ง db ให้ services ใช้
	services.SetDatabase(db)

	// ✅ Auto migrate เผื่อไว้ให้แน่ใจว่า entity ถูก sync
	db.AutoMigrate(
		&entity.Users{},
		&entity.Genders{},
		&entity.WaterUsage{},
		&entity.Location{},
	)

	// ✅ เริ่ม Gin Server
	r := gin.Default()
	r.Use(CORSMiddleware())

	// ✅ Public routes
	r.POST("/signup", users.SignUp)
	r.POST("/signin", users.SignIn)

	r.GET("/genders", genders.GetAll)

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// ✅ Protected routes
	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())

		router.PUT("/user/:id", users.Update)
		router.GET("/users", users.GetAll)
		router.GET("/user/:id", users.Get)
		router.DELETE("/user/:id", users.Delete)

		router.GET("/meters", meter.GetAllMeters)
		router.POST("/meters", meter.CreateMeter)
		
		// ❗ หากต้องการให้ waterusage ใช้ auth ก็ย้ายเข้า router นี้
	}
	
	// ✅ API รับข้อมูลน้ำจาก ESP32 + ส่งให้ Frontend
	
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
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
