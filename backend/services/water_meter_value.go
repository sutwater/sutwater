package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

const (
	statusPending  = uint(1)
	statusApproved = uint(2)
)

type WaterMeterValueService interface {
	GetAll(deviceID *uint, statusID *uint, startDate *time.Time, endDate *time.Time) ([]models.WaterMeterValueResponse, error)
	GetByID(id uint) (*models.WaterMeterValueResponse, error)
	GetLatestPerDevice() ([]models.WaterMeterValueResponse, error)
	GetPending() ([]models.WaterMeterValueResponse, error)
	Create(input models.WaterMeterValueRequest, userID uint) (*models.WaterMeterValueResponse, error)
	Update(id uint, input models.UpdateWaterMeterValueRequest) (*models.WaterMeterValueResponse, error)
	Delete(id uint) error
	GetStatuses() ([]models.StatusValueResponse, error)
}

type waterMeterValueService struct {
	repo repositories.WaterMeterValueRepository
}

func NewWaterMeterValueService(repo repositories.WaterMeterValueRepository) WaterMeterValueService {
	return &waterMeterValueService{repo: repo}
}

func (s *waterMeterValueService) GetAll(deviceID *uint, statusID *uint, startDate *time.Time, endDate *time.Time) ([]models.WaterMeterValueResponse, error) {
	values, err := s.repo.FetchAll(deviceID, statusID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	result := make([]models.WaterMeterValueResponse, 0, len(values))
	for _, v := range values {
		result = append(result, mapWaterMeterValueToResponse(&v))
	}
	return result, nil
}

func (s *waterMeterValueService) GetByID(id uint) (*models.WaterMeterValueResponse, error) {
	value, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if value == nil {
		return nil, errors.New("water meter value not found")
	}
	resp := mapWaterMeterValueToResponse(value)
	return &resp, nil
}

func (s *waterMeterValueService) GetLatestPerDevice() ([]models.WaterMeterValueResponse, error) {
	values, err := s.repo.FetchLatestPerDevice()
	if err != nil {
		return nil, err
	}
	result := make([]models.WaterMeterValueResponse, 0, len(values))
	for _, v := range values {
		result = append(result, mapWaterMeterValueToResponse(&v))
	}
	return result, nil
}

func (s *waterMeterValueService) GetPending() ([]models.WaterMeterValueResponse, error) {
	return s.GetAll(nil, &[]uint{statusPending}[0], nil, nil)
}

func (s *waterMeterValueService) Create(input models.WaterMeterValueRequest, userID uint) (*models.WaterMeterValueResponse, error) {
	ts := time.Now()
	if input.Timestamp != nil {
		ts = *input.Timestamp
	}

	sid := statusPending
	if input.StatusID != 0 {
		sid = input.StatusID
	}

	value := &entity.WaterMeterValue{
		MeterValue:      input.MeterValue,
		Timestamp:       ts,
		ModelConfidence: input.ModelConfidence,
		Note:            input.Note,
		ImagePath:       input.ImagePath,
		DeviceID:        input.DeviceID,
		UserID:          userID,
		StatusID:        sid,
	}

	if err := s.repo.Create(value); err != nil {
		return nil, err
	}

	created, err := s.repo.FindByID(value.ID)
	if err != nil {
		return nil, err
	}
	resp := mapWaterMeterValueToResponse(created)
	return &resp, nil
}

func (s *waterMeterValueService) Update(id uint, input models.UpdateWaterMeterValueRequest) (*models.WaterMeterValueResponse, error) {
	value, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if value == nil {
		return nil, errors.New("water meter value not found")
	}

	if input.StatusID != 0 {
		value.StatusID = input.StatusID
	}
	if input.Note != "" {
		value.Note = input.Note
	}

	value.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(value); err != nil {
		return nil, err
	}

	updated, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	resp := mapWaterMeterValueToResponse(updated)
	return &resp, nil
}

func (s *waterMeterValueService) Delete(id uint) error {
	value, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if value == nil {
		return errors.New("water meter value not found")
	}
	return s.repo.Delete(value)
}

func (s *waterMeterValueService) GetStatuses() ([]models.StatusValueResponse, error) {
	statuses, err := s.repo.FetchAllStatuses()
	if err != nil {
		return nil, err
	}
	result := make([]models.StatusValueResponse, 0, len(statuses))
	for _, st := range statuses {
		result = append(result, models.StatusValueResponse{
			ID:          st.ID,
			StatusValue: st.StatusValue,
			Description: st.Description,
		})
	}
	return result, nil
}

func mapWaterMeterValueToResponse(v *entity.WaterMeterValue) models.WaterMeterValueResponse {
	resp := models.WaterMeterValueResponse{
		ID:              v.ID,
		MeterValue:      v.MeterValue,
		Timestamp:       v.Timestamp.Format(time.RFC3339),
		ModelConfidence: v.ModelConfidence,
		Note:            v.Note,
		ImagePath:       v.ImagePath,
		DeviceID:        v.DeviceID,
		UserID:          v.UserID,
		StatusID:        v.StatusID,
		CreatedAt:       v.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       v.UpdatedAt.Format(time.RFC3339),
	}
	if v.Device != nil {
		d := mapDeviceToResponse(v.Device)
		resp.Device = &d
	}
	if v.User != nil {
		resp.User = &models.WaterMeterValueUserInfo{
			ID:        v.User.ID,
			FirstName: v.User.FirstName,
			LastName:  v.User.LastName,
		}
	}
	if v.Status.ID != 0 {
		resp.Status = &models.StatusValueResponse{
			ID:          v.Status.ID,
			StatusValue: v.Status.StatusValue,
			Description: v.Status.Description,
		}
	}
	return resp
}
