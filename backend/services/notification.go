package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

type NotificationService interface {
	GetAll() ([]models.NotificationResponse, error)
	GetByID(id uint) (*models.NotificationResponse, error)
	MarkAsRead(id uint) (*models.NotificationResponse, error)
	MarkAllAsRead() error
	Delete(id uint) error
	GetStats() (*models.NotificationStatsResponse, error)
}

type notificationService struct {
	repo repositories.NotificationRepository
}

func NewNotificationService(repo repositories.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) GetAll() ([]models.NotificationResponse, error) {
	msgs, err := s.repo.FetchAll()
	if err != nil {
		return nil, err
	}
	result := make([]models.NotificationResponse, 0, len(msgs))
	for _, m := range msgs {
		result = append(result, mapNotificationToResponse(&m))
	}
	return result, nil
}

func (s *notificationService) GetByID(id uint) (*models.NotificationResponse, error) {
	msg, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if msg == nil {
		return nil, errors.New("notification not found")
	}
	resp := mapNotificationToResponse(msg)
	return &resp, nil
}

func (s *notificationService) MarkAsRead(id uint) (*models.NotificationResponse, error) {
	msg, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if msg == nil {
		return nil, errors.New("notification not found")
	}

	if !msg.IsRead {
		msg.IsRead = true
		msg.UpdatedAt = time.Now().UTC()
		if err := s.repo.Update(msg); err != nil {
			return nil, err
		}
	}

	resp := mapNotificationToResponse(msg)
	return &resp, nil
}

func (s *notificationService) MarkAllAsRead() error {
	return s.repo.MarkAllAsRead()
}

func (s *notificationService) Delete(id uint) error {
	msg, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if msg == nil {
		return errors.New("notification not found")
	}
	return s.repo.Delete(msg)
}

func (s *notificationService) GetStats() (*models.NotificationStatsResponse, error) {
	stats, err := s.repo.GetStats()
	if err != nil {
		return nil, err
	}
	return &models.NotificationStatsResponse{
		Total:     stats.Total,
		Read:      stats.Read,
		Unread:    stats.Unread,
		LastAlert: stats.LastAt,
	}, nil
}

func mapNotificationToResponse(msg *entity.Message) models.NotificationResponse {
	resp := models.NotificationResponse{
		ID:        msg.ID,
		Message:   msg.Message,
		IsRead:    msg.IsRead,
		DeviceID:  msg.DeviceID,
		CreatedAt: msg.CreatedAt.Format(time.RFC3339),
		UpdatedAt: msg.UpdatedAt.Format(time.RFC3339),
	}
	if msg.Device != nil {
		d := mapDeviceToResponse(msg.Device)
		resp.Device = &d
	}
	return resp
}
