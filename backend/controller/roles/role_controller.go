package roles

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/repositories"
)

type RoleHandler struct {
	roleRepo repositories.RoleRepository
}

func NewRoleHandler(router *gin.RouterGroup, roleRepo repositories.RoleRepository) *RoleHandler {
	handler := &RoleHandler{roleRepo: roleRepo}
	router.GET("/roles", handler.GetAll)
	return handler
}

type roleResponse struct {
	ID   uint   `json:"id"`
	Role string `json:"role"`
}

func (h *RoleHandler) GetAll(c *gin.Context) {
	data, err := h.roleRepo.FindAll()
	if err != nil {
		utils.NewError(c, http.StatusInternalServerError, utils.ErrInternalServer)
		return
	}
	res := make([]roleResponse, len(data))
	for i, r := range data {
		res[i] = roleResponse{ID: r.ID, Role: r.Role}
	}
	utils.JSONSuccess(c, http.StatusOK, res)
}
