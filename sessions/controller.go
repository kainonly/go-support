package sessions

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
)

// Controller handles session management API requests.
type Controller struct {
	Service *Service
}

// Lists retrieves all active sessions.
func (x *Controller) Lists(ctx context.Context, c *app.RequestContext) {
	c.JSON(200, x.Service.Lists(ctx))
}

// RemoveDto defines the data structure for removing a session.
type RemoveDto struct {
	Uid string `path:"uid,required" vd:"mongodb"`
}

// Remove deletes a specific session by user ID.
func (x *Controller) Remove(ctx context.Context, c *app.RequestContext) {
	var dto RemoveDto
	if err := c.BindAndValidate(&dto); err != nil {
		c.Error(err)
		return
	}
	c.JSON(200, utils.H{
		"DeletedCount": x.Service.Remove(ctx, dto.Uid),
	})
}

// Clear deletes all active sessions.
func (x *Controller) Clear(ctx context.Context, c *app.RequestContext) {
	c.JSON(200, utils.H{
		"DeletedCount": x.Service.Clear(ctx),
	})
}
