package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/config/utils"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

type DeviceService interface {
	GetAll() ([]models.DeviceResponse, error)
	GetByID(id uint) (*models.DeviceResponse, error)
	Create(input models.DeviceRequest) (*models.DeviceResponse, error)
	Update(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error)
	Delete(id uint) error
	GetAvailableLocations() ([]models.LocationResponse, error)
}

type deviceService struct {
	repo         repositories.DeviceRepository
	locationRepo repositories.LocationRepository
}

func NewDeviceService(repo repositories.DeviceRepository, locationRepo repositories.LocationRepository) DeviceService {
	return &deviceService{repo: repo, locationRepo: locationRepo}
}

func (s *deviceService) GetAll() ([]models.DeviceResponse, error) {
	devices, err := s.repo.FetchAll()
	if err != nil {
		return nil, err
	}
	result := make([]models.DeviceResponse, 0, len(devices))
	for _, d := range devices {
		result = append(result, mapDeviceToResponse(&d))
	}
	return result, nil
}

func (s *deviceService) GetByID(id uint) (*models.DeviceResponse, error) {
	device, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if device == nil {
		return nil, errors.New("device not found")
	}
	resp := mapDeviceToResponse(device)
	return &resp, nil
}

func (s *deviceService) Create(input models.DeviceRequest) (*models.DeviceResponse, error) {
	existing, err := s.repo.FindByMacAddress(input.MacAddress)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("mac address already exists")
	}

	loc, err := s.locationRepo.FindByID(input.LocationID)
	if err != nil {
		return nil, err
	}
	if loc == nil {
		return nil, errors.New("location not found")
	}

	hashed, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	device := &entity.Device{
		MacAddress: input.MacAddress,
		LocationID: &input.LocationID,
	}
	credential := &entity.DeviceCredential{
		Username: input.MacAddress,
		Password: hashed,
	}

	if err := s.repo.Create(device, credential); err != nil {
		return nil, err
	}

	device.Location = loc
	resp := mapDeviceToResponse(device)
	return &resp, nil
}

func (s *deviceService) Update(id uint, input models.UpdateDeviceRequest) (*models.DeviceResponse, error) {
	device, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if device == nil {
		return nil, errors.New("device not found")
	}

	if input.MacAddress != "" && input.MacAddress != device.MacAddress {
		existing, err := s.repo.FindByMacAddress(input.MacAddress)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			return nil, errors.New("mac address already exists")
		}
		device.MacAddress = input.MacAddress
	}

	if input.LocationID != nil {
		loc, err := s.locationRepo.FindByID(*input.LocationID)
		if err != nil {
			return nil, err
		}
		if loc == nil {
			return nil, errors.New("location not found")
		}
		device.LocationID = input.LocationID
		device.Location = loc
	}

	device.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(device); err != nil {
		return nil, err
	}

	resp := mapDeviceToResponse(device)
	return &resp, nil
}

func (s *deviceService) Delete(id uint) error {
	device, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if device == nil {
		return errors.New("device not found")
	}
	return s.repo.DeleteCascade(id)
}

func (s *deviceService) GetAvailableLocations() ([]models.LocationResponse, error) {
	locations, err := s.repo.FindAvailableLocations()
	if err != nil {
		return nil, err
	}
	result := make([]models.LocationResponse, 0, len(locations))
	for _, loc := range locations {
		result = append(result, mapLocationToResponse(&loc))
	}
	return result, nil
}

func mapDeviceToResponse(device *entity.Device) models.DeviceResponse {
	resp := models.DeviceResponse{
		ID:         device.ID,
		MacAddress: device.MacAddress,
		LocationID: device.LocationID,
		CreatedAt:  device.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  device.UpdatedAt.Format(time.RFC3339),
	}
	if device.Location != nil {
		loc := mapLocationToResponse(device.Location)
		resp.Location = &loc
	}
	return resp
}
