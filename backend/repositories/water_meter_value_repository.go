package repositories

import (
	"errors"

	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type WaterMeterValueRepository interface {
	Create(value *entity.WaterMeterValue) error
	FetchAll(deviceID *uint, statusID *uint) ([]entity.WaterMeterValue, error)
	FindByID(id uint) (*entity.WaterMeterValue, error)
	FetchLatestPerDevice() ([]entity.WaterMeterValue, error)
	Update(value *entity.WaterMeterValue) error
	Delete(value *entity.WaterMeterValue) error
	FetchAllStatuses() ([]entity.StatusWaterValue, error)
}

type waterMeterValueRepository struct {
	db *gorm.DB
}

func NewWaterMeterValueRepository(db *gorm.DB) WaterMeterValueRepository {
	return &waterMeterValueRepository{db: db}
}

func (r *waterMeterValueRepository) Create(value *entity.WaterMeterValue) error {
	return r.db.Create(value).Error
}

func (r *waterMeterValueRepository) FetchAll(deviceID *uint, statusID *uint) ([]entity.WaterMeterValue, error) {
	query := r.db.
		Preload("Device").
		Preload("Device.Location").
		Preload("Status").
		Preload("User").
		Order("timestamp DESC")

	if deviceID != nil {
		query = query.Where("device_id = ?", *deviceID)
	}
	if statusID != nil {
		query = query.Where("status_id = ?", *statusID)
	}

	var values []entity.WaterMeterValue
	return values, query.Find(&values).Error
}

func (r *waterMeterValueRepository) FindByID(id uint) (*entity.WaterMeterValue, error) {
	var value entity.WaterMeterValue
	if err := r.db.
		Preload("Device").
		Preload("Device.Location").
		Preload("Status").
		Preload("User").
		First(&value, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &value, nil
}

// FetchLatestPerDevice คืนค่ามิเตอร์ล่าสุดของแต่ละอุปกรณ์
func (r *waterMeterValueRepository) FetchLatestPerDevice() ([]entity.WaterMeterValue, error) {
	subQuery := r.db.Model(&entity.WaterMeterValue{}).
		Select("device_id, MAX(timestamp) AS max_ts").
		Group("device_id")

	var values []entity.WaterMeterValue
	err := r.db.
		Joins("JOIN (?) AS latest ON water_meter_values.device_id = latest.device_id AND water_meter_values.timestamp = latest.max_ts", subQuery).
		Preload("Device").
		Preload("Device.Location").
		Preload("Status").
		Where("water_meter_values.deleted_at IS NULL").
		Find(&values).Error
	return values, err
}

func (r *waterMeterValueRepository) Update(value *entity.WaterMeterValue) error {
	return r.db.Save(value).Error
}

func (r *waterMeterValueRepository) Delete(value *entity.WaterMeterValue) error {
	return r.db.Delete(value).Error
}

func (r *waterMeterValueRepository) FetchAllStatuses() ([]entity.StatusWaterValue, error) {
	var statuses []entity.StatusWaterValue
	return statuses, r.db.Find(&statuses).Error
}
