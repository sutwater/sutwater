package repositories

import (
	"errors"

	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type LocationRepository interface {
	Create(loc *entity.Location) error
	FetchAll() ([]entity.Location, error)
	FindByID(id uint) (*entity.Location, error)
	Update(loc *entity.Location) error
	DeleteCascade(id uint) error
}

type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) Create(loc *entity.Location) error {
	return r.db.Create(loc).Error
}

func (r *locationRepository) FetchAll() ([]entity.Location, error) {
	var locations []entity.Location
	if err := r.db.Find(&locations).Error; err != nil {
		return nil, err
	}
	return locations, nil
}

func (r *locationRepository) FindByID(id uint) (*entity.Location, error) {
	var loc entity.Location
	if err := r.db.First(&loc, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &loc, nil
}

func (r *locationRepository) Update(loc *entity.Location) error {
	return r.db.Save(loc).Error
}

func (r *locationRepository) DeleteCascade(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var deviceIDs []uint
		if err := tx.Model(&entity.Device{}).
			Where("location_id = ?", id).
			Pluck("id", &deviceIDs).Error; err != nil {
			return err
		}

		if len(deviceIDs) > 0 {
			if err := tx.Where("device_id IN ?", deviceIDs).Delete(&entity.WaterMeterValue{}).Error; err != nil {
				return err
			}
			if err := tx.Where("device_id IN ?", deviceIDs).Delete(&entity.Message{}).Error; err != nil {
				return err
			}
			if err := tx.Where("device_id IN ?", deviceIDs).Delete(&entity.DeviceCredential{}).Error; err != nil {
				return err
			}
			if err := tx.Where("id IN ?", deviceIDs).Delete(&entity.Device{}).Error; err != nil {
				return err
			}
		}

		return tx.Delete(&entity.Location{}, id).Error
	})
}
