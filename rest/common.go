package rest

import (
	"github.com/cloudwego/hertz/pkg/common/errors"
	"github.com/kainonly/go/cipher"
	"github.com/kainonly/support/values"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
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

// SetMongoClient sets the MongoDB client for the Service.
func SetMongoClient(v *mongo.Client) Option {
	return func(x *Service) {
		x.Mgo = v
	}
}

// SetDatabase sets the MongoDB database for the Service.
func SetDatabase(v *mongo.Database) Option {
	return func(x *Service) {
		x.Db = v
	}
}

// SetRedis sets the Redis client for the Service.
func SetRedis(v *redis.Client) Option {
	return func(x *Service) {
		x.RDb = v
	}
}

// SetJetStream sets the NATS JetStream context for the Service.
func SetJetStream(v nats.JetStreamContext) Option {
	return func(x *Service) {
		x.JetStream = v
	}
}

// SetKeyValue sets the NATS KeyValue store for the Service.
func SetKeyValue(v nats.KeyValue) Option {
	return func(x *Service) {
		x.KeyValue = v
	}
}

// SetDynamicValues sets the dynamic values configuration for the Service.
func SetDynamicValues(v *values.DynamicValues) Option {
	return func(x *Service) {
		x.Values = v
	}
}

// SetCipher sets the cipher for encryption/decryption operations.
func SetCipher(v *cipher.Cipher) Option {
	return func(x *Service) {
		x.Cipher = v
	}
}

// M is a type alias for a map with string keys and interface{} values, commonly used for JSON/BSON data.
type M = map[string]interface{}

// ErrCollectionForbidden indicates that access to the requested collection is forbidden.
var ErrCollectionForbidden = errors.NewPublic("the collection is forbidden")

// ErrTxnNotExist indicates that the requested transaction does not exist.
var ErrTxnNotExist = errors.NewPublic("the txn does not exist")

// ErrTxnTimeOut indicates that the transaction has timed out.
var ErrTxnTimeOut = errors.NewPublic("the transaction has timed out")
