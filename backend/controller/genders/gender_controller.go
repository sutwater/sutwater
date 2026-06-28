package genders

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/repositories"
)

type GenderHandler struct {
	genderRepo repositories.GenderRepository
}

func NewGenderHandler(router *gin.RouterGroup, genderRepo repositories.GenderRepository) *GenderHandler {
	handler := &GenderHandler{genderRepo: genderRepo}

	router.GET("/genders", handler.GetAll)

	return handler
}

type genderResponse struct {
	ID     uint   `json:"id"`
	Gender string `json:"gender"`
}

func (h *GenderHandler) GetAll(c *gin.Context) {
	genders, err := h.genderRepo.FindAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	res := make([]genderResponse, len(genders))
	for i, g := range genders {
		res[i] = genderResponse{ID: g.ID, Gender: g.Gender}
	}
	utils.JSONSuccess(c, http.StatusOK, res)
}
