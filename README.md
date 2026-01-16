# Go Support

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/kainonly/go-support/testing.yml?style=flat-square)](https://github.com/kainonly/go-support/actions/workflows/testing.yml)
[![Coveralls github](https://img.shields.io/coveralls/github/kainonly/go-support.svg?style=flat-square)](https://coveralls.io/github/kainonly/go-support)
[![GitHub go.mod Go version](https://img.shields.io/github/go-mod/go-version/kainonly/go-support?style=flat-square)](https://github.com/kainonly/go-support)
[![Go Report Card](https://goreportcard.com/badge/github.com/kainonly/go-support?style=flat-square)](https://goreportcard.com/report/github.com/kainonly/go-support)
[![Release](https://img.shields.io/github/v/release/kainonly/go-support.svg?style=flat-square)](https://github.com/kainonly/go-support)
[![GitHub license](https://img.shields.io/github/license/kainonly/go-support?style=flat-square)](https://raw.githubusercontent.com/kainonly/go-support/main/LICENSE)

English | [简体中文](README.zh-CN.md)

Distributed capability support library (MongoDB / Redis / NATS) that provides generic REST endpoints, session management, and dynamic configuration management.

## Installation

```bash
go get github.com/kainonly/support
```

## Packages

### rest (Mongo Rest)

Provides a generic REST layer for MongoDB collections, typically mounted on Hertz routes:
- Operations: create, bulk_create, size, find, find_one, update, update_by_id, replace, delete, bulk_delete, sort
- Data format conversion: `xdata` / `xfilter` to convert request strings into `ObjectID`, `time.Time`, etc.
- Projection & masking: driven by `values.DynamicValues.RestControls` (projection keys & sensitive fields)
- Event publishing: optionally publish `events.<collection>` to NATS JetStream
- Transaction workflow: stage actions in Redis + commit via MongoDB session transaction

Code references:
- Routes & DTOs: [rest/controller.go](rest/controller.go)
- Service logic & conversions: [rest/service.go](rest/service.go)
- Package overview: [rest/common.go](rest/common.go)

### sessions (Redis Session)

Redis-based session management:
- `Set/Verify/Renew/Remove/Clear/Lists`
- TTL is controlled by `values.DynamicValues.SessionTTL`

Code reference: [sessions/service.go](sessions/service.go)

### values (Dynamic Values)

Dynamic configuration management (NATS KeyValue + encrypted storage):
- Storage: serialize and encrypt the whole config, store it at KV key `values`
- Read: support filtering by keys; mask fields with `secret:"*"` as `*`
- Sync: watch KV updates and notify callers

Code reference: [values/service.go](values/service.go)

## Reference

- Mongo Rest: https://weplanx.gitbook.io/latest/core-api/mongo-rest

## Mongo Rest API Conventions

The following conventions match the current implementation and can be used as an integration contract.

### Create

`POST /db/:collection/create`
- collection: snake (lowercase letters and underscores)
- Body: `data` (required), `xdata` (optional), `txn` (optional)
- 201: MongoDB InsertOne result (includes `InsertedID`)
- 204: when `txn` is provided, the action is staged and executed on `commit`

Example (timestamp conversion):

```json
{
  "data": {
    "name": "体验卡",
    "pd": "2023-04-12T22:00:00.906Z",
    "valid": [
      "2023-04-12T22:00:00.906Z",
      "2023-04-13T06:30:05.586Z"
    ]
  },
  "xdata": {
    "pd": "timestamp",
    "valid": "timestamps"
  }
}
```

### BulkCreate

`POST /db/:collection/bulk_create`
- collection: snake (lowercase letters and underscores)
- Body: `data` (required array), `xdata` (optional), `txn` (optional)
- 201: MongoDB InsertMany result (includes `InsertedIDs`)
- 204: when `txn` is provided, the action is staged and executed on `commit`

### Size

`POST /db/:collection/size`
- collection: snake (lowercase letters and underscores)
- Body: `filter` (required), `xfilter` (optional)
- 204: no body, return header `x-total`

Example (oids conversion):

```json
{
  "filter": { "_id": { "$in": ["64bdd1c042a8e3504975f04e"] } },
  "xfilter": { "_id->$in": "oids" }
}
```

### Find

`POST /db/:collection/find`
- collection: snake (lowercase letters and underscores)
- Headers: `x-pagesize` (default 100, max 1000), `x-page` (default 1)
- Query: `sort=<field>:<1|-1>`, `keys=<field>&keys=<field>`
- Body: `filter` (required), `xfilter` (optional)
- 200: return header `x-total` and a JSON array in the body

### xdata / xfilter Conversion Rules

Conversions are implemented by `rest.Service.Transform/Pipe` (see [rest/service.go](rest/service.go)):
- key: path joined by `->`, e.g. `_id->$in`
- value: conversion kind: `oid`, `oids`, `date`, `dates`, `timestamp`, `timestamps`, `password`, `cipher`
- `$` in a path means iterating items in an array

### Transaction / Commit

Write endpoints support an optional transaction workflow:
1. `POST /transaction` to get `txn`
2. call write APIs with `txn`, they return 204 (staged in Redis)
3. `POST /commit` to execute all staged actions, returns 200

## Usage (Hertz)

These snippets show how to mount routes. See tests for a full working example.

### rest

```go
service := rest.New(
	rest.SetMongoClient(mgo),
	rest.SetDatabase(db),
	rest.SetRedis(rdb),
	rest.SetJetStream(js),
	rest.SetKeyValue(kv),
	rest.SetDynamicValues(dynamicValues),
	rest.SetCipher(c),
)
controller := &rest.Controller{Service: service}

r := engine.Group(":collection")
r.POST("create", controller.Create)
r.POST("bulk_create", controller.BulkCreate)
r.POST("size", controller.Size)
r.POST("find", controller.Find)
r.POST("find_one", controller.FindOne)
r.POST("update", controller.Update)
r.POST("bulk_delete", controller.BulkDelete)
r.POST("sort", controller.Sort)
r.PATCH(":id", controller.UpdateById)
r.PUT(":id", controller.Replace)
r.DELETE(":id", controller.Delete)

engine.POST("transaction", controller.Transaction)
engine.POST("commit", controller.Commit)
```

### sessions

```go
service := sessions.New(
	sessions.SetRedis(rdb),
	sessions.SetDynamicValues(dynamicValues),
)
controller := &sessions.Controller{Service: service}

r := engine.Group("sessions")
r.GET("", controller.Lists)
r.DELETE(":uid", controller.Remove)
r.POST("clear", controller.Clear)
```

### values

```go
service := values.New(
	values.SetKeyValue(kv),
	values.SetCipher(c),
	values.SetType(reflect.TypeOf(values.DynamicValues{})),
)
controller := &values.Controller{Service: service}

r := engine.Group("values")
r.GET("", controller.Get)
r.PATCH("", controller.Set)
r.DELETE(":key", controller.Remove)
```

## Testing

```bash
go test ./...
```

Tests depend on external services (MongoDB / Redis / NATS). Related tests will be skipped when required environment variables are missing:
- `rest`: `DATABASE_URL`, `DATABASE_NAME`, `DATABASE_REDIS`, `NATS_HOSTS`, `NATS_NKEY`
- `sessions`: `DATABASE_REDIS`
- `values`: `NAMESPACE`, `NATS_HOSTS`, `NATS_NKEY`, `KEY`

## License

[BSD-3-Clause License](https://github.com/kainonly/go-support/blob/main/LICENSE)
