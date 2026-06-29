package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	RoleAdmin      = uint(1)
	RoleEngineer   = uint(2)
	RoleTechnician = uint(3)
	RoleUser       = uint(4)
)

// RequireRole aborts with 403 if the caller's role is not in the allowed list.
func RequireRole(roleIDs ...uint) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, ok := GetRoleIDFromContext(c)
		if !ok {
			NewError(c, http.StatusUnauthorized, ErrMissingID)
			c.Abort()
			return
		}
		for _, allowed := range roleIDs {
			if roleID == allowed {
				c.Next()
				return
			}
		}
		NewError(c, http.StatusForbidden, ErrPermissionDenied)
		c.Abort()
	}
}
