package repositories

import (
	"github.com/watermeter/suth/entity"
	"gorm.io/gorm"
)

type RoleRepository interface {
	FindAll() ([]entity.Role, error)
}

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) FindAll() ([]entity.Role, error) {
	var roles []entity.Role
	if err := r.db.Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}
