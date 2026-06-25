package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

type LocationService interface {
	GetAll() ([]models.LocationResponse, error)
	GetByID(id uint) (*models.LocationResponse, error)
	Create(input models.LocationRequest) (*models.LocationResponse, error)
	Update(id uint, input models.LocationRequest) (*models.LocationResponse, error)
	Delete(id uint) error
}

type locationService struct {
	repo repositories.LocationRepository
}

func NewLocationService(repo repositories.LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func (s *locationService) GetAll() ([]models.LocationResponse, error) {
	locations, err := s.repo.FetchAll()
	if err != nil {
		return nil, err
	}
	result := make([]models.LocationResponse, 0, len(locations))
	for _, loc := range locations {
		result = append(result, mapLocationToResponse(&loc))
	}
	return result, nil
}

func (s *locationService) GetByID(id uint) (*models.LocationResponse, error) {
	loc, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if loc == nil {
		return nil, errors.New("location not found")
	}
	resp := mapLocationToResponse(loc)
	return &resp, nil
}

func (s *locationService) Create(input models.LocationRequest) (*models.LocationResponse, error) {
	loc := &entity.Location{
		BuildingName: input.BuildingName,
		Latitude:     input.Latitude,
		Longitude:    input.Longitude,
	}
	if err := s.repo.Create(loc); err != nil {
		return nil, err
	}
	resp := mapLocationToResponse(loc)
	return &resp, nil
}

func (s *locationService) Update(id uint, input models.LocationRequest) (*models.LocationResponse, error) {
	loc, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if loc == nil {
		return nil, errors.New("location not found")
	}

	loc.BuildingName = input.BuildingName
	loc.Latitude = input.Latitude
	loc.Longitude = input.Longitude
	loc.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(loc); err != nil {
		return nil, err
	}
	resp := mapLocationToResponse(loc)
	return &resp, nil
}

func (s *locationService) Delete(id uint) error {
	loc, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if loc == nil {
		return errors.New("location not found")
	}
	return s.repo.DeleteCascade(id)
}

func mapLocationToResponse(loc *entity.Location) models.LocationResponse {
	return models.LocationResponse{
		ID:           loc.ID,
		BuildingName: loc.BuildingName,
		Latitude:     loc.Latitude,
		Longitude:    loc.Longitude,
		CreatedAt:    loc.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    loc.UpdatedAt.Format(time.RFC3339),
	}
}
