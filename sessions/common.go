package sessions

import (
	"github.com/kainonly/support/values"
	"github.com/redis/go-redis/v9"
)

// New creates a new instance of the Service with the provided options.
func New(options ...Option) *Service {
	x := new(Service)
	for _, v := range options {
		v(x)
	}
	return x
}

// Option is a function that configures the Service.
type Option func(x *Service)

// SetRedis sets the Redis client for the Service.
func SetRedis(v *redis.Client) Option {
	return func(x *Service) {
		x.RDb = v
	}
}

// SetDynamicValues sets the dynamic values configuration for the Service.
func SetDynamicValues(v *values.DynamicValues) Option {
	return func(x *Service) {
		x.Values = v
	}
}
