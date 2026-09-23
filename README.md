# PetCare+ 宠物医疗与保险管理平台

```bash
cp .env.example .env
docker compose up -d
```

本地开发：

```bash
cd backend && npm install && npm run prisma:generate && npm run start:dev
cd frontend && npm install && npm run dev
```

访问地址：
- 前端：http://localhost:38408
- 后端 API：http://localhost:38506/api/v1
- 健康检查：http://localhost:38506/api/v1/health

PetCare+ 是面向宠物主人、兽医和管理员的一站式宠物健康管理平台，覆盖宠物档案、就诊记录、疫苗接种计划、保险保单和提醒通知。

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 18、TypeScript、Vite、Ant Design 5 |
| 状态 | React Query、Zustand |
| 图表 | ECharts、echarts-for-react |
| 后端 | NestJS、TypeScript、Prisma |
| 数据库 | PostgreSQL |
| 认证 | JWT、角色守卫 |
| 部署 | Docker Compose、Nginx |

## 功能页面

| 页面 | 功能 |
|---|---|
| `/login` | 演示账号登录 |
| `/pets` | 宠物卡片、搜索、物种筛选 |
| `/pets/:id` | 基本信息、就诊时间线、疫苗日历、保单列表 |
| `/medical` | 就诊记录表格、处方侧栏、费用柱状图 |
| `/vaccines` | 疫苗日历、待接种提醒、状态标记 |
| `/insurance` | 保单卡片、勾选保障期内未理赔的就诊记录生成理赔单、理赔进度流程图、保费/保障分析 |

## 理赔流程

保险中心点击保单卡片的「提交理赔」，勾选该宠物在保障期内且尚未理赔的就诊记录，按费用合计生成一笔理赔单（`InsuranceClaim` + `ClaimItem`）。`ClaimItem.medicalRecordId` 有数据库唯一约束：同一份就诊记录重复进入其他理赔（包括两人同时提交）会被拒绝并提示「已存在理赔」，只有一笔能成立，理赔费用与保单保障额度均按原数保留。保单未生效/已过期、就诊记录与保单宠物不匹配、就诊日期超出保障期时，接口返回具体原因并停止提交。提交成功后保单卡片按钮变为「处理中」，理赔进度区展示金额与「提交 → 审核 → 赔付」进度。

```bash
# 可理赔就诊记录（保障期内未理赔的可勾选，其余返回 claimItem 标记）
curl -H "Authorization: Bearer $TOKEN" http://localhost:38506/api/v1/insurance/<policyId>/claimable-records

# 提交理赔（按所选记录费用合计生成一笔理赔单）
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"recordIds":["<medicalRecordId>"]}' \
  http://localhost:38506/api/v1/insurance/<policyId>/claims

# 理赔列表（金额与进度）
curl -H "Authorization: Bearer $TOKEN" http://localhost:38506/api/v1/insurance/claims
```

## 核心实体贯穿链路
| 实体 | 后端链路 | 前端链路 |
|---|---|---|
| Pet | `prisma/schema.prisma` → `prisma.service.ts` → `pet.repository.ts` → `pet.service.ts` → `pet.controller.ts` → `pet.routes.ts` | `petApi.ts` → `usePets.ts` → `PetList.tsx` / `PetDetail.tsx` / `PetAvatar.tsx` |
| MedicalRecord | Prisma → `medical.repository.ts` → `medical.service.ts` → `medical.controller.ts` → `medical.routes.ts` | `medicalApi.ts` → `usePets.ts` → `MedicalManagement.tsx` / `CostBarChart.tsx` |
| VaccineRecord | Prisma → `vaccine.repository.ts` → `vaccine.service.ts` → `vaccine.controller.ts` → `vaccine.routes.ts` | `vaccineApi.ts` → `usePets.ts` → `VaccineManagement.tsx` / `VaccineCalendar.tsx` |
| InsurancePolicy | Prisma → `insurance.repository.ts` → `insurance.service.ts` → `insurance.controller.ts` → `insurance.routes.ts` | `insuranceApi.ts` → `useInsurance.ts` → `InsuranceCenter.tsx` / `PolicyCard.tsx` / `InsurancePieChart.tsx` |
| InsuranceClaim | Prisma → `insurance.repository.ts` → `insurance.service.ts` → `insurance.controller.ts` → `insurance.routes.ts` | `insuranceApi.ts` → `useInsurance.ts` → `InsuranceCenter.tsx` / `ClaimModal.tsx` / `ClaimList.tsx` |

## 枚举定义与使用位置

| 枚举 | 后端定义与使用 | 前端定义与使用 |
|---|---|---|
| UserRole | `backend/src/constants/enums.ts`、`auth.guard.ts`、`roles.guard.ts`、`auth.service.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`authStore.ts`、`Login.tsx`、`AuthGuard.tsx` |
| PetSpecies | `backend/src/constants/enums.ts`、`pet.dto.ts`、`pet.repository.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`pet.d.ts`、`PetList.tsx`、`PetAvatar.tsx`、`mockData.ts` |
| VisitType | `backend/src/constants/enums.ts`、`medical.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`medical.d.ts`、`MedicalManagement.tsx`、`mockData.ts` |
| VaccineStatus | `backend/src/constants/enums.ts`、`vaccine.dto.ts`、`notification.scheduler.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`vaccine.d.ts`、`VaccineManagement.tsx`、`VaccineCalendar.tsx`、`StatusBadge.tsx` |
| InsuranceStatus | `backend/src/constants/enums.ts`、`insurance.dto.ts`、`insurance.validator.ts`、`insurance.repository.ts`、`notification.scheduler.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`InsuranceCenter.tsx`、`PolicyCard.tsx`、`StatusBadge.tsx` |
| ClaimStatus | `backend/src/constants/enums.ts`、`insurance.repository.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`ClaimList.tsx`、`PolicyCard.tsx`、`mockData.ts` |
| PolicyType | `backend/src/constants/enums.ts`、`insurance.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`InsuranceCenter.tsx`、`mockData.ts` |
| Gender | `backend/src/constants/enums.ts`、`pet.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`pet.d.ts`、`PetDetail.tsx`、`mockData.ts` |

## RBAC

| 角色 | 数据范围 | 主要能力 |
|---|---|---|
| PET_OWNER | 仅自己的宠物和关联数据 | 查看宠物、病历、疫苗、保单 |
| VET | 分配给自己的就诊/疫苗数据 | 创建和维护医疗记录 |
| ADMIN | 全部数据 | 平台管理、审计查看 |

## 全局异常处理

后端 `backend/src/middleware/error-handler.ts` 统一捕获业务异常和系统异常，返回 `{ code, message, data }`。前端 `frontend/src/utils/request.ts` 统一处理 HTTP 错误和业务错误，使用 Ant Design `message.error()` 提示，401 自动跳转登录页。

## 操作日志

后端 `backend/src/middleware/audit-log.ts` 提供 `@AuditLog('描述')` 装饰器和拦截器，记录创建就诊记录、疫苗接种、投保、理赔、添加宠物等写操作，字段包括请求路径、方法、操作人、请求体摘要、状态码和时间。

## 提醒通知

`backend/src/modules/notifications/notification.scheduler.ts` 使用 Nest Schedule 扫描疫苗到期、保险续保和复诊提醒。前端 `NotificationBell.tsx` 拉取未读通知。

## 目录结构

```text
frontend/
├── src/api/
├── src/components/common/
├── src/components/charts/
├── src/components/insurance/   # 保单卡片、理赔弹窗、理赔进度
├── src/constants/
├── src/hooks/
├── src/pages/
├── src/stores/
├── src/types/
├── src/utils/
├── src/guards/
├── App.tsx
└── main.tsx

backend/
├── src/modules/pets/
├── src/modules/medical/
├── src/modules/vaccines/
├── src/modules/insurance/
├── src/modules/auth/
├── src/modules/notifications/
├── src/prisma/prisma.service.ts
├── src/constants/enums.ts
├── src/middleware/
├── src/exceptions/
├── src/main.ts
└── src/app.module.ts

database/
└── seed.ts
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `COMPOSE_PROJECT_NAME` | Docker Compose 名称，默认 `ldpetcare` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_ROOT_PASSWORD` | 数据库配置 |
| `DATABASE_URL` | Prisma PostgreSQL 连接字符串 |
| `JWT_SECRET` | JWT 密钥 |
| `FRONTEND_PORT` | 默认 `38408` |
| `BACKEND_PORT` | 默认 `38506` |

## Docker

`docker-compose.yml` 顶层声明 `name: ldpetcare`，无 `version:` 字段。前端 Nginx 将 `/api/` 反向代理到 `backend:38506`，并配置 `try_files $uri $uri/ /index.html` 支持 SPA 路由和 WebSocket Upgrade 头。

## License

MIT
