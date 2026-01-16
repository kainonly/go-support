package values

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
)

// Controller handles dynamic configuration API requests.
type Controller struct {
	Service *Service
}

// SetDto defines the data structure for updating configuration values.
type SetDto struct {
	Update map[string]interface{} `json:"update" vd:"gt=0,dive,keys,alphanum,endkeys,required"`
}

// Set updates one or more configuration values.
func (x *Controller) Set(_ context.Context, c *app.RequestContext) {
	var dto SetDto
	if err := c.BindAndValidate(&dto); err != nil {
		c.Error(err)
		return
	}

	if err := x.Service.Set(dto.Update); err != nil {
		c.Error(err)
		return
	}

	c.Status(204)
}

// GetDto defines the data structure for retrieving configuration values.
type GetDto struct {
	Keys []string `query:"keys" vd:"omitempty,dive,alphanum"`
}

// Get retrieves one or more configuration values.
func (x *Controller) Get(_ context.Context, c *app.RequestContext) {
	var dto GetDto
	if err := c.BindAndValidate(&dto); err != nil {
		c.Error(err)
		return
	}

	data, err := x.Service.Get(dto.Keys...)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(200, data)
}

// RemoveDto defines the data structure for removing configuration values.
type RemoveDto struct {
	Key string `path:"key,required" vd:"alphanum"`
}

// Remove deletes a specific configuration value by key.
func (x *Controller) Remove(_ context.Context, c *app.RequestContext) {
	var dto RemoveDto
	if err := c.BindAndValidate(&dto); err != nil {
		c.Error(err)
		return
	}

	if err := x.Service.Remove(dto.Key); err != nil {
		c.Error(err)
		return
	}

	c.Status(204)
}
