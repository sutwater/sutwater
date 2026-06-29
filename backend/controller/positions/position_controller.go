package positions

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/repositories"
)

type PositionHandler struct {
	positionRepo repositories.PositionRepository
}

func NewPositionHandler(router *gin.RouterGroup, positionRepo repositories.PositionRepository) *PositionHandler {
	handler := &PositionHandler{positionRepo: positionRepo}
	router.GET("/positions", handler.GetAll)
	return handler
}

type positionResponse struct {
	ID       uint   `json:"id"`
	Position string `json:"position"`
}

func (h *PositionHandler) GetAll(c *gin.Context) {
	data, err := h.positionRepo.FindAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	res := make([]positionResponse, len(data))
	for i, p := range data {
		res[i] = positionResponse{ID: p.ID, Position: p.Position}
	}
	utils.JSONSuccess(c, http.StatusOK, res)
}
