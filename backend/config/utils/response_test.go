package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func newTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c, w
}

// --- JSONSuccess ---

func TestJSONSuccess_WithData(t *testing.T) {
	c, w := newTestContext()
	JSONSuccess(c, http.StatusOK, gin.H{"key": "value"})

	if w.Code != http.StatusOK {
		t.Errorf("status: want 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["success"] != true {
		t.Error("expected success=true")
	}
	if resp["data"] == nil {
		t.Error("expected data to be set")
	}
}

func TestJSONSuccess_NoContent(t *testing.T) {
	// gin.CreateTestContext ไม่ flush status โดยไม่มี body write — ใช้ router จริงแทน
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		JSONSuccess(c, http.StatusNoContent, nil)
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/test", nil))

	if w.Code != http.StatusNoContent {
		t.Errorf("status: want 204, got %d", w.Code)
	}
	if w.Body.Len() != 0 {
		t.Errorf("expected empty body for 204, got %q", w.Body.String())
	}
}

// --- JSONError ---

func TestJSONError_Structure(t *testing.T) {
	c, w := newTestContext()
	JSONError(c, http.StatusBadRequest, "validation failed", "field X is required")

	if w.Code != http.StatusBadRequest {
		t.Errorf("status: want 400, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["success"] != false {
		t.Error("expected success=false")
	}
	errObj, _ := resp["error"].(map[string]interface{})
	if errObj["message"] != "validation failed" {
		t.Errorf("message: got %v", errObj["message"])
	}
	if errObj["detail"] != "field X is required" {
		t.Errorf("detail: got %v", errObj["detail"])
	}
}

// --- NewError ---

func TestNewError_Structure(t *testing.T) {
	c, w := newTestContext()
	NewError(c, http.StatusNotFound, ErrNotFound)

	if w.Code != http.StatusNotFound {
		t.Errorf("status: want 404, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["success"] != false {
		t.Error("expected success=false")
	}
	errObj, _ := resp["error"].(map[string]interface{})
	if errObj["message"] != ErrNotFound.Error() {
		t.Errorf("message: want %q, got %v", ErrNotFound.Error(), errObj["message"])
	}
}
