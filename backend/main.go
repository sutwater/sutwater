package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/postgres"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/controller/users"
	"github.com/watermeter/suth/middlewares"
	"github.com/watermeter/suth/repositories"
	"github.com/watermeter/suth/services"
)

func main() {

	db, err := postgres.Setup()
	if err != nil {
		fmt.Println("Failed to connect to database: %v", err)
	}

	postgresql, err := db.DB()
	if err == nil {
		defer postgresql.Close()
	}

	c, err := postgres.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load configuration: %v", err)
	}

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	router := r.Group("/api/v1")
	router.Static("/uploads", "./uploads")

	jwtProvider := utils.NewJWTProvider(c.JWTSecret, c.JWTExpiresIn)
	userRepository := repositories.NewUserRepository(db)

	authService := services.NewAuthService(userRepository, jwtProvider)
	userService := services.NewUserService(userRepository)

	//puclice API
	publicRouter := router.Group("")
	users.NewAuthHandler(publicRouter, authService)

	//protect API
	privateRouter := router.Group("")
	privateRouter.Use(middlewares.JWTAuthMiddleware())
	users.NewUserHandler(privateRouter, userService)

	// network
	// r.Run("" + c.APIPort)

	//localhost
	r.Run("localhost" + c.APIPort)
}
