export const insuranceRoutes = {
  list: 'GET /api/v1/insurance',
  create: 'POST /api/v1/insurance',
  claims: 'GET /api/v1/insurance/claims',
  claimableRecords: 'GET /api/v1/insurance/:id/claimable-records',
  submitClaim: 'POST /api/v1/insurance/:id/claims',
  update: 'PATCH /api/v1/insurance/:id',
} as const;
