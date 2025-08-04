package entity

import "gorm.io/gorm"

type Building struct {
	gorm.Model

	Name string
}
