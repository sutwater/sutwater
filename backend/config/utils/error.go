package utils

import (
	"errors"
	"log"

	"github.com/gin-gonic/gin"
)

var (
	// auth
	ErrMissingID        = errors.New("user id missing from token")
	ErrInvalidToken     = errors.New("invalid token")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrPermissionDenied = errors.New("permission denied")
	ErrWrongPassword    = errors.New("incorrect password")

	// request
	ErrInvalidID      = errors.New("invalid id parameter")
	ErrInvalidPayload = errors.New("invalid request payload")
	ErrValidation     = errors.New("validation failed")
	ErrBadRequest     = errors.New("bad request")

	// resource
	ErrNotFound       = errors.New("item not found")
	ErrConflict       = errors.New("item already exists")
	ErrCannotBeDeleted = errors.New("item cannot be deleted")

	// operations
	ErrCreateFailed = errors.New("create failed")
	ErrUpdateFailed = errors.New("update failed")
	ErrDeleteFailed = errors.New("delete failed")
	ErrInternalServer = errors.New("internal server error")

	// file
	ErrNotImageFile = errors.New("file is not an image")
)

func NewError(c *gin.Context, status int, err error) {
	c.JSON(status, gin.H{
		"success": false,
		"error": gin.H{
			"message": err.Error(),
			"detail":  "",
		},
	})
}

func FailOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}
