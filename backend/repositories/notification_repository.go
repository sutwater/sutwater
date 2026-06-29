package repositories

import (
	"errors"

	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type NotificationStats struct {
	Total  int64
	Read   int64
	Unread int64
	LastAt string
}

type NotificationRepository interface {
	Create(msg *entity.Message) error
	FetchAll(roleID, userID uint) ([]entity.Message, error)
	FindByID(id uint) (*entity.Message, error)
	Update(msg *entity.Message) error
	Delete(msg *entity.Message) error
	MarkAllAsRead(roleID, userID uint) error
	GetStats() (NotificationStats, error)
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(msg *entity.Message) error {
	return r.db.Create(msg).Error
}

func (r *notificationRepository) FetchAll(_ uint, userID uint) ([]entity.Message, error) {
	var msgs []entity.Message
	if err := r.db.
		Where("target_user_id = ?", userID).
		Order("created_at DESC").
		Find(&msgs).Error; err != nil {
		return nil, err
	}
	return msgs, nil
}

func (r *notificationRepository) FindByID(id uint) (*entity.Message, error) {
	var msg entity.Message
	if err := r.db.First(&msg, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &msg, nil
}

func (r *notificationRepository) Update(msg *entity.Message) error {
	return r.db.Save(msg).Error
}

func (r *notificationRepository) Delete(msg *entity.Message) error {
	return r.db.Delete(msg).Error
}

func (r *notificationRepository) MarkAllAsRead(_ uint, userID uint) error {
	return r.db.Model(&entity.Message{}).
		Where("target_user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

func (r *notificationRepository) GetStats() (NotificationStats, error) {
	var stats NotificationStats

	r.db.Model(&entity.Message{}).Count(&stats.Total)
	r.db.Model(&entity.Message{}).Where("is_read = ?", true).Count(&stats.Read)
	r.db.Model(&entity.Message{}).Where("is_read = ?", false).Count(&stats.Unread)

	var last entity.Message
	if err := r.db.Order("created_at DESC").First(&last).Error; err == nil {
		stats.LastAt = last.CreatedAt.Format("2006-01-02 15:04:05")
	}

	return stats, nil
}
