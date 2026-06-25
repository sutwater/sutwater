package repositories

import (
	"errors"

	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type MaintainLogRepository interface {
	Create(log *entity.MaintainLog) error
	FetchAll() ([]entity.MaintainLog, error)
	FindByID(id uint) (*entity.MaintainLog, error)
	Update(log *entity.MaintainLog) error
	Delete(log *entity.MaintainLog) error
	FetchAllStatuses() ([]entity.StatusLog, error)
}

type maintainLogRepository struct {
	db *gorm.DB
}

func NewMaintainLogRepository(db *gorm.DB) MaintainLogRepository {
	return &maintainLogRepository{db: db}
}

func (r *maintainLogRepository) Create(log *entity.MaintainLog) error {
	return r.db.Create(log).Error
}

func (r *maintainLogRepository) FetchAll() ([]entity.MaintainLog, error) {
	var logs []entity.MaintainLog
	if err := r.db.Preload("Location").Preload("Status").
		Order("created_at DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *maintainLogRepository) FindByID(id uint) (*entity.MaintainLog, error) {
	var log entity.MaintainLog
	if err := r.db.Preload("Location").Preload("Status").
		First(&log, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &log, nil
}

func (r *maintainLogRepository) Update(log *entity.MaintainLog) error {
	return r.db.Save(log).Error
}

func (r *maintainLogRepository) Delete(log *entity.MaintainLog) error {
	return r.db.Delete(log).Error
}

func (r *maintainLogRepository) FetchAllStatuses() ([]entity.StatusLog, error) {
	var statuses []entity.StatusLog
	if err := r.db.Find(&statuses).Error; err != nil {
		return nil, err
	}
	return statuses, nil
}
