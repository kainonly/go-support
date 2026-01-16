# Go Support

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/kainonly/go-support/testing.yml?style=flat-square)](https://github.com/kainonly/go-support/actions/workflows/testing.yml)
[![Coveralls github](https://img.shields.io/coveralls/github/kainonly/go-support.svg?style=flat-square)](https://coveralls.io/github/kainonly/go-support)
[![GitHub go.mod Go version](https://img.shields.io/github/go-mod/go-version/kainonly/go-support?style=flat-square)](https://github.com/kainonly/go-support)
[![Go Report Card](https://goreportcard.com/badge/github.com/kainonly/go-support?style=flat-square)](https://goreportcard.com/report/github.com/kainonly/go-support)
[![Release](https://img.shields.io/github/v/release/kainonly/go-support.svg?style=flat-square)](https://github.com/kainonly/go-support)
[![GitHub license](https://img.shields.io/github/license/kainonly/go-support?style=flat-square)](https://raw.githubusercontent.com/kainonly/go-support/main/LICENSE)

[English](README.md) | 简体中文

分布式能力扩展支持库（MongoDB / Redis / NATS），提供通用的 REST 能力、会话管理与动态配置管理。

## 安装

```bash
go get github.com/kainonly/support
```

## 包说明

### rest（Mongo Rest）

提供一个通用的 MongoDB Collection REST 层，典型用于 Hertz 路由：
- 常用操作：create、bulk_create、size、find、find_one、update、update_by_id、replace、delete、bulk_delete、sort
- 字段格式转换：通过 `xdata` / `xfilter` 将请求中的字符串转换为 `ObjectID`、`time.Time` 等
- 字段投影与脱敏：基于 `values.DynamicValues.RestControls` 控制返回字段与敏感字段掩码
- 事件发布：可选地向 NATS JetStream 发布 `events.<collection>` 事件
- 事务工作流：通过 Redis 暂存动作 + MongoDB session transaction 提交

代码参考：
- 路由与 DTO 约定：[rest/controller.go](rest/controller.go)
- 业务逻辑与转换能力：[rest/service.go](rest/service.go)
- 包级说明：[rest/common.go](rest/common.go)

### sessions（Redis Session）

基于 Redis 的会话管理：
- `Set/Verify/Renew/Remove/Clear/Lists`
- 会话 TTL 由 `values.DynamicValues.SessionTTL` 控制

代码参考：[sessions/service.go](sessions/service.go)

### values（Dynamic Values）

动态配置管理（NATS KeyValue + 加密存储）：
- 存储：将整份配置序列化后加密，写入 KV 的 `values` key
- 读取：支持按 key 过滤；对带 `secret:"*"` tag 的字段做 `*` 掩码输出
- 同步：支持 watch KV 更新并回调

代码参考：[values/service.go](values/service.go)

## 参考文档

- Mongo Rest：https://weplanx.gitbook.io/latest/core-api/mongo-rest

## Mongo Rest API 约定

下面约定与实现保持一致（可作为对接文档的“最小闭环”）。

### Create

`POST /db/:collection/create`
- collection：小写字母与下划线（snake）
- Body：`data`（必填），`xdata`（可选），`txn`（可选）
- 201：返回 MongoDB InsertOne 结果（包含 `InsertedID`）
- 204：当传入 `txn` 时，不直接写库，而是把动作暂存等待 `commit`

示例（timestamp 转换）：

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
- collection：小写字母与下划线（snake）
- Body：`data`（必填数组），`xdata`（可选），`txn`（可选）
- 201：返回 MongoDB InsertMany 结果（包含 `InsertedIDs`）
- 204：当传入 `txn` 时，动作暂存等待 `commit`

### Size

`POST /db/:collection/size`
- collection：小写字母与下划线（snake）
- Body：`filter`（必填），`xfilter`（可选）
- 204：无 body，返回 Header `x-total`

示例（oids 转换）：

```json
{
  "filter": { "_id": { "$in": ["64bdd1c042a8e3504975f04e"] } },
  "xfilter": { "_id->$in": "oids" }
}
```

### Find

`POST /db/:collection/find`
- collection：小写字母与下划线（snake）
- Headers：`x-pagesize`（默认 100，最大 1000）、`x-page`（默认 1）
- Query：`sort=<field>:<1|-1>`、`keys=<field>&keys=<field>`
- Body：`filter`（必填），`xfilter`（可选）
- 200：返回 Header `x-total` 与 body 数组

### xdata / xfilter 转换规则

转换由 `rest.Service.Transform/Pipe` 实现（见 [rest/service.go](rest/service.go)），规则如下：
- key：用 `->` 表示路径，例如 `_id->$in`
- value：转换类型，支持：`oid`、`oids`、`date`、`dates`、`timestamp`、`timestamps`、`password`、`cipher`
- 路径中出现 `$` 表示对数组逐项处理

### Transaction / Commit

写入接口支持可选事务工作流：
1. `POST /transaction` 获取 `txn`
2. 写接口传入 `txn`，返回 204（动作进入暂存队列）
3. `POST /commit` 提交事务，返回 200（执行所有暂存动作）

## 使用示例（Hertz）

下面示例展示“如何挂载路由”，细节可参考测试文件中完整用法。

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

## 测试

```bash
go test ./...
```

测试会依赖外部服务（MongoDB/Redis/NATS）。当缺少必要环境变量时，相关测试会自动跳过：
- `rest`：`DATABASE_URL`、`DATABASE_NAME`、`DATABASE_REDIS`、`NATS_HOSTS`、`NATS_NKEY`
- `sessions`：`DATABASE_REDIS`
- `values`：`NAMESPACE`、`NATS_HOSTS`、`NATS_NKEY`、`KEY`

## License

[BSD-3-Clause License](https://github.com/kainonly/go-support/blob/main/LICENSE)

