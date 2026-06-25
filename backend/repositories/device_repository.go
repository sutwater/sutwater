package repositories

import (
	"errors"

	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type DeviceRepository interface {
	Create(device *entity.Device, credential *entity.DeviceCredential) error
	FetchAll() ([]entity.Device, error)
	FindByID(id uint) (*entity.Device, error)
	FindByMacAddress(mac string) (*entity.Device, error)
	Update(device *entity.Device) error
	DeleteCascade(id uint) error
	FindAvailableLocations() ([]entity.Location, error)
}

type deviceRepository struct {
	db *gorm.DB
}

func NewDeviceRepository(db *gorm.DB) DeviceRepository {
	return &deviceRepository{db: db}
}

// Create สร้าง Device และ DeviceCredential ใน transaction เดียว
func (r *deviceRepository) Create(device *entity.Device, credential *entity.DeviceCredential) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(device).Error; err != nil {
			return err
		}
		credential.DeviceID = device.ID
		return tx.Create(credential).Error
	})
}

func (r *deviceRepository) FetchAll() ([]entity.Device, error) {
	var devices []entity.Device
	if err := r.db.Preload("Location").Find(&devices).Error; err != nil {
		return nil, err
	}
	return devices, nil
}

func (r *deviceRepository) FindByID(id uint) (*entity.Device, error) {
	var device entity.Device
	if err := r.db.Preload("Location").First(&device, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &device, nil
}

func (r *deviceRepository) FindByMacAddress(mac string) (*entity.Device, error) {
	var device entity.Device
	if err := r.db.Where("mac_address = ?", mac).First(&device).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &device, nil
}

// Update บันทึก Device และ sync username ใน DeviceCredential ให้ตรงกับ MacAddress ใน transaction เดียว
func (r *deviceRepository) Update(device *entity.Device) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(device).Error; err != nil {
			return err
		}
		return tx.Model(&entity.DeviceCredential{}).
			Where("device_id = ?", device.ID).
			Update("username", device.MacAddress).Error
	})
}

// DeleteCascade ลบ WaterMeterValues → Messages → DeviceCredential → Device ใน transaction
func (r *deviceRepository) DeleteCascade(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("device_id = ?", id).Delete(&entity.WaterMeterValue{}).Error; err != nil {
			return err
		}
		if err := tx.Where("device_id = ?", id).Delete(&entity.Message{}).Error; err != nil {
			return err
		}
		if err := tx.Where("device_id = ?", id).Delete(&entity.DeviceCredential{}).Error; err != nil {
			return err
		}
		return tx.Delete(&entity.Device{}, id).Error
	})
}

// FindAvailableLocations คืน Location ที่ยังไม่มี Device ผูกอยู่
func (r *deviceRepository) FindAvailableLocations() ([]entity.Location, error) {
	var locations []entity.Location
	subQuery := r.db.Model(&entity.Device{}).
		Select("location_id").
		Where("location_id IS NOT NULL")
	if err := r.db.Where("id NOT IN (?)", subQuery).Find(&locations).Error; err != nil {
		return nil, err
	}
	return locations, nil
}
