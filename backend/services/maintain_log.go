package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

type MaintainLogService interface {
	GetAll() ([]models.MaintainLogResponse, error)
	GetByID(id uint) (*models.MaintainLogResponse, error)
	Create(input models.MaintainLogRequest) (*models.MaintainLogResponse, error)
	Update(id uint, input models.UpdateMaintainLogRequest) (*models.MaintainLogResponse, error)
	Delete(id uint) error
	GetStatuses() ([]models.StatusLogResponse, error)
}

type maintainLogService struct {
	repo repositories.MaintainLogRepository
}

func NewMaintainLogService(repo repositories.MaintainLogRepository) MaintainLogService {
	return &maintainLogService{repo: repo}
}

func (s *maintainLogService) GetAll() ([]models.MaintainLogResponse, error) {
	logs, err := s.repo.FetchAll()
	if err != nil {
		return nil, err
	}
	result := make([]models.MaintainLogResponse, 0, len(logs))
	for _, l := range logs {
		result = append(result, mapMaintainLogToResponse(&l))
	}
	return result, nil
}

func (s *maintainLogService) GetByID(id uint) (*models.MaintainLogResponse, error) {
	log, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if log == nil {
		return nil, errors.New("maintain log not found")
	}
	resp := mapMaintainLogToResponse(log)
	return &resp, nil
}

func (s *maintainLogService) Create(input models.MaintainLogRequest) (*models.MaintainLogResponse, error) {
	log := &entity.MaintainLog{
		Title:        input.Title,
		LocationText: input.LocationText,
		LocationID:   input.LocationID,
		StatusID:     input.StatusID,
		ImagePath:    input.ImagePath,
	}
	if input.CloseAt != nil {
		log.CloseAt = *input.CloseAt
	}

	if err := s.repo.Create(log); err != nil {
		return nil, err
	}

	created, err := s.repo.FindByID(log.ID)
	if err != nil {
		return nil, err
	}
	resp := mapMaintainLogToResponse(created)
	return &resp, nil
}

func (s *maintainLogService) Update(id uint, input models.UpdateMaintainLogRequest) (*models.MaintainLogResponse, error) {
	log, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if log == nil {
		return nil, errors.New("maintain log not found")
	}
	if log.Status != nil && log.Status.StatusLog == "solved" {
		return nil, errors.New("ไม่สามารถแก้ไขบันทึกที่เสร็จสิ้นแล้ว")
	}

	if input.Title != "" {
		log.Title = input.Title
	}
	if input.LocationText != "" {
		log.LocationText = input.LocationText
	}
	if input.CloseAt != nil {
		log.CloseAt = *input.CloseAt
	}
	if input.LocationID != nil {
		log.LocationID = input.LocationID
	}
	if input.StatusID != nil {
		log.StatusID = input.StatusID
	}

	log.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(log); err != nil {
		return nil, err
	}

	updated, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	resp := mapMaintainLogToResponse(updated)
	return &resp, nil
}

func (s *maintainLogService) Delete(id uint) error {
	log, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if log == nil {
		return errors.New("maintain log not found")
	}
	return s.repo.Delete(log)
}

func (s *maintainLogService) GetStatuses() ([]models.StatusLogResponse, error) {
	statuses, err := s.repo.FetchAllStatuses()
	if err != nil {
		return nil, err
	}
	result := make([]models.StatusLogResponse, 0, len(statuses))
	for _, s := range statuses {
		result = append(result, models.StatusLogResponse{
			ID:          s.ID,
			StatusLog:   s.StatusLog,
			Description: s.Description,
		})
	}
	return result, nil
}

func mapMaintainLogToResponse(log *entity.MaintainLog) models.MaintainLogResponse {
	resp := models.MaintainLogResponse{
		ID:           log.ID,
		Title:        log.Title,
		LocationText: log.LocationText,
		ImagePath:    log.ImagePath,
		LocationID:   log.LocationID,
		StatusID:     log.StatusID,
		CreatedAt:    log.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    log.UpdatedAt.Format(time.RFC3339),
	}
	if !log.CloseAt.IsZero() {
		resp.CloseAt = log.CloseAt.Format(time.RFC3339)
	}
	if log.Location != nil {
		loc := mapLocationToResponse(log.Location)
		resp.Location = &loc
	}
	if log.Status != nil {
		resp.Status = &models.StatusLogResponse{
			ID:          log.Status.ID,
			StatusLog:   log.Status.StatusLog,
			Description: log.Status.Description,
		}
	}
	return resp
}
