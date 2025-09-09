package entity

import "gorm.io/gorm"

type WaterMeterImage struct {
	gorm.Model
	ImagePath 		string
	CameraDeviceID 	uint
	CameraDevice  	*CameraDevice `gorm:"foreignKey:CameraDeviceID"`

	WaterMeterValue []WaterMeterValue `gorm:"foreignKey:WaterMeterImageID"`
}
