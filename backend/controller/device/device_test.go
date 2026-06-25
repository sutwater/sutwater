package device

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/watermeter/suth/config/models"
)

type mockDeviceService struct {
	getAllFn                func() ([]models.DeviceResponse, error)
	getByIDFn              func(id uint) (*models.DeviceResponse, error)
	createFn               func(input models.DeviceRequest) (*models.DeviceResponse, error)
	updateFn               func(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error)
	deleteFn               func(id uint) error
	getAvailableLocationsFn func() ([]models.LocationResponse, error)
}

func (m *mockDeviceService) GetAll() ([]models.DeviceResponse, error) {
	return m.getAllFn()
}
func (m *mockDeviceService) GetByID(id uint) (*models.DeviceResponse, error) {
	return m.getByIDFn(id)
}
func (m *mockDeviceService) Create(input models.DeviceRequest) (*models.DeviceResponse, error) {
	return m.createFn(input)
}
func (m *mockDeviceService) Update(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error) {
	return m.updateFn(id, input)
}
func (m *mockDeviceService) Delete(id uint) error {
	return m.deleteFn(id)
}
func (m *mockDeviceService) GetAvailableLocations() ([]models.LocationResponse, error) {
	return m.getAvailableLocationsFn()
}

func setupRouter(svc *mockDeviceService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	NewDeviceHandler(r.Group("/api/v1"), svc)
	return r
}

func assertStatus(t *testing.T, want, got int) {
	t.Helper()
	if want != got {
		t.Errorf("status: want %d, got %d", want, got)
	}
}

func jsonBody(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return bytes.NewBuffer(b)
}

func jsonReq(t *testing.T, method, url string, body *bytes.Buffer) *http.Request {
	t.Helper()
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, url, body)
	} else {
		req = httptest.NewRequest(method, url, nil)
	}
	req.Header.Set("Content-Type", "application/json")
	return req
}

var locID = uint(1)
var sampleDevice = models.DeviceResponse{
	ID:         1,
	MacAddress: "AA:BB:CC:DD:EE:FF",
	LocationID: &locID,
}

// --- GetAll ---

func TestGetAll_Success(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		getAllFn: func() ([]models.DeviceResponse, error) {
			return []models.DeviceResponse{sampleDevice}, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAll_ServiceError(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		getAllFn: func() ([]models.DeviceResponse, error) {
			return nil, errors.New("db error")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetAvailableLocations ---

func TestGetAvailableLocations_Success(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		getAvailableLocationsFn: func() ([]models.LocationResponse, error) {
			return []models.LocationResponse{{ID: 2, BuildingName: "อาคาร B"}}, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices/available-locations", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetAvailableLocations_ServiceError(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		getAvailableLocationsFn: func() ([]models.LocationResponse, error) {
			return nil, errors.New("db error")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices/available-locations", nil))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- GetByID ---

func TestGetByID_Success(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		getByIDFn: func(id uint) (*models.DeviceResponse, error) {
			return &sampleDevice, nil
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices/1", nil))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestGetByID_InvalidID(t *testing.T) {
	r := setupRouter(&mockDeviceService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestGetByID_NotFound(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		getByIDFn: func(id uint) (*models.DeviceResponse, error) {
			return nil, errors.New("not found")
		},
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/devices/99", nil))
	assertStatus(t, http.StatusNotFound, w.Code)
}

// --- Create ---

func TestCreate_Success(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		createFn: func(input models.DeviceRequest) (*models.DeviceResponse, error) {
			return &sampleDevice, nil
		},
	})
	body := jsonBody(t, models.DeviceRequest{
		MacAddress: "AA:BB:CC:DD:EE:FF",
		Password:   "secret123",
		LocationID: 1,
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/devices", body))
	assertStatus(t, http.StatusCreated, w.Code)
}

func TestCreate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockDeviceService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/devices", bytes.NewBufferString("{bad}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_ValidationError(t *testing.T) {
	r := setupRouter(&mockDeviceService{})
	// password น้อยกว่า 6 ตัว → validation fail
	body := jsonBody(t, map[string]any{
		"mac_address": "AA:BB",
		"password":    "123",
		"location_id": 1,
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/devices", body))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestCreate_MacConflict(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		createFn: func(input models.DeviceRequest) (*models.DeviceResponse, error) {
			return nil, errors.New("mac address already exists")
		},
	})
	body := jsonBody(t, models.DeviceRequest{
		MacAddress: "AA:BB:CC:DD:EE:FF",
		Password:   "secret123",
		LocationID: 1,
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/devices", body))
	assertStatus(t, http.StatusConflict, w.Code)
}

func TestCreate_LocationNotFound(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		createFn: func(input models.DeviceRequest) (*models.DeviceResponse, error) {
			return nil, errors.New("location not found")
		},
	})
	body := jsonBody(t, models.DeviceRequest{
		MacAddress: "AA:BB:CC:DD:EE:FF",
		Password:   "secret123",
		LocationID: 999,
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/devices", body))
	assertStatus(t, http.StatusNotFound, w.Code)
}

func TestCreate_ServiceError(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		createFn: func(input models.DeviceRequest) (*models.DeviceResponse, error) {
			return nil, errors.New("insert failed")
		},
	})
	body := jsonBody(t, models.DeviceRequest{
		MacAddress: "AA:BB:CC:DD:EE:FF",
		Password:   "secret123",
		LocationID: 1,
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPost, "/api/v1/devices", body))
	assertStatus(t, http.StatusInternalServerError, w.Code)
}

// --- Update ---

func TestUpdate_Success(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		updateFn: func(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error) {
			return &sampleDevice, nil
		},
	})
	newID := uint(2)
	body := jsonBody(t, models.UpdateDeviceRequest{LocationID: &newID})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/devices/1", body))
	assertStatus(t, http.StatusOK, w.Code)
}

func TestUpdate_InvalidID(t *testing.T) {
	r := setupRouter(&mockDeviceService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/devices/xyz", bytes.NewBufferString("{}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_InvalidJSON(t *testing.T) {
	r := setupRouter(&mockDeviceService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/devices/1", bytes.NewBufferString("{bad}")))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestUpdate_MacConflict(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		updateFn: func(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error) {
			return nil, errors.New("mac address already exists")
		},
	})
	body := jsonBody(t, models.UpdateDeviceRequest{MacAddress: "FF:EE:DD:CC:BB:AA"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/devices/1", body))
	assertStatus(t, http.StatusConflict, w.Code)
}

func TestUpdate_LocationNotFound(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		updateFn: func(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error) {
			return nil, errors.New("location not found")
		},
	})
	newID := uint(999)
	body := jsonBody(t, models.UpdateDeviceRequest{LocationID: &newID})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/devices/1", body))
	assertStatus(t, http.StatusNotFound, w.Code)
}

func TestUpdate_ServiceError(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		updateFn: func(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error) {
			return nil, errors.New("update failed")
		},
	})
	body := jsonBody(t, models.UpdateDeviceRequest{MacAddress: "AA:BB:CC:DD:EE:FF"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, jsonReq(t, http.MethodPut, "/api/v1/devices/1", body))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

// --- Delete ---

func TestDelete_Success(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		deleteFn: func(id uint) error { return nil },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/devices/1", nil))
	assertStatus(t, http.StatusNoContent, w.Code)
}

func TestDelete_InvalidID(t *testing.T) {
	r := setupRouter(&mockDeviceService{})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/devices/abc", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}

func TestDelete_ServiceError(t *testing.T) {
	r := setupRouter(&mockDeviceService{
		deleteFn: func(id uint) error { return errors.New("delete failed") },
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/v1/devices/1", nil))
	assertStatus(t, http.StatusBadRequest, w.Code)
}
