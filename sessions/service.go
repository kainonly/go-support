package sessions

import (
	"context"
	"fmt"
	"strings"

	"github.com/kainonly/support/values"
	"github.com/redis/go-redis/v9"
)

// Service provides session management logic using Redis.
type Service struct {
	RDb    *redis.Client
	Values *values.DynamicValues
}

// Key generates the Redis key for a given session name.
func (x *Service) Key(name string) string {
	return fmt.Sprintf(`sessions:%s`, name)
}

// ScanFn is a callback function for iterating over session keys.
type ScanFn func(key string)

// Scan iterates over all session keys and applies the callback function.
func (x *Service) Scan(ctx context.Context, fn ScanFn) {
	iter := x.RDb.Scan(ctx, 0, x.Key("*"), 0).Iterator()
	for iter.Next(ctx) {
		fn(iter.Val())
	}
}

// Lists retrieves a list of all active session names (user IDs).
func (x *Service) Lists(ctx context.Context) (data []string) {
	data = make([]string, 0)
	x.Scan(ctx, func(key string) {
		v := strings.Replace(key, x.Key(""), "", -1)
		data = append(data, v)
	})
	return
}

// Verify checks if the provided JTI matches the session for the given user.
func (x *Service) Verify(ctx context.Context, name string, jti string) bool {
	result := x.RDb.Get(ctx, x.Key(name)).Val()
	return result == jti
}

// Set creates or updates a session for a user with the given JTI.
func (x *Service) Set(ctx context.Context, name string, jti string) string {
	return x.RDb.Set(ctx, x.Key(name), jti, x.Values.SessionTTL).Val()
}

// Renew extends the expiration time of a user's session.
func (x *Service) Renew(ctx context.Context, userId string) bool {
	return x.RDb.Expire(ctx, x.Key(userId), x.Values.SessionTTL).Val()
}

// Remove deletes the session for a specific user.
func (x *Service) Remove(ctx context.Context, name string) int64 {
	return x.RDb.Del(ctx, x.Key(name)).Val()
}

// Clear deletes all active sessions.
func (x *Service) Clear(ctx context.Context) int64 {
	var matchd []string
	x.Scan(ctx, func(key string) {
		matchd = append(matchd, key)
	})
	if len(matchd) != 0 {
		return x.RDb.Del(ctx, matchd...).Val()
	}
	return 0
}
