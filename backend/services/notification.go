package services

import (
	"errors"
	"time"

	"github.com/watermeter/suth/config/models"
	"github.com/watermeter/suth/entity"
	"github.com/watermeter/suth/repositories"
)

type NotificationService interface {
	GetAll(roleID, userID uint) ([]models.NotificationResponse, error)
	GetByID(id uint) (*models.NotificationResponse, error)
	MarkAsRead(id uint) (*models.NotificationResponse, error)
	MarkAllAsRead(roleID, userID uint) error
	Delete(id uint) error
	GetStats() (*models.NotificationStatsResponse, error)
	CreateSystemNotification(message string, targetUserID uint) error
}

type notificationService struct {
	repo repositories.NotificationRepository
}

func NewNotificationService(repo repositories.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) GetAll(roleID, userID uint) ([]models.NotificationResponse, error) {
	msgs, err := s.repo.FetchAll(roleID, userID)
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

func (s *notificationService) MarkAllAsRead(roleID, userID uint) error {
	return s.repo.MarkAllAsRead(roleID, userID)
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

func (s *notificationService) CreateSystemNotification(message string, targetUserID uint) error {
	msg := &entity.Message{
		Message:      message,
		IsRead:       false,
		TargetUserID: &targetUserID,
	}
	return s.repo.Create(msg)
}

func mapNotificationToResponse(msg *entity.Message) models.NotificationResponse {
	resp := models.NotificationResponse{
		ID:           msg.ID,
		Message:      msg.Message,
		IsRead:       msg.IsRead,
		TargetUserID: msg.TargetUserID,
		CreatedAt:    msg.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    msg.UpdatedAt.Format(time.RFC3339),
	}
	return resp
}
