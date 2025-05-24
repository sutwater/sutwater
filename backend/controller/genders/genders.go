package genders

import (
	"net/http"

	"example.com/sa-67-example/config"
	"example.com/sa-67-example/entity"

	"github.com/gin-gonic/gin"
)

func GetAll(c *gin.Context) {
	db := config.DB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not initialized",
		})
		return
	}

	var genders []entity.Genders
	if err := db.Find(&genders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, genders)
}
