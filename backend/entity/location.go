package entity

type Location struct {
	ID       string  `json:"id" bson:"_id,omitempty"`
	Name     string  `json:"name" bson:"name"`
	XPercent float64 `json:"xPercent" bson:"xPercent"`
	YPercent float64 `json:"yPercent" bson:"yPercent"`
	Note     string  `json:"note,omitempty" bson:"note,omitempty"`
}
