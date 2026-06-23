import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('fe-rail', 'routes/fe-rail.tsx'),
  route('dev', 'routes/dev.tsx'),
  route('portfolio', 'routes/portfolio.tsx'),
  route('invitation', 'routes/invitation.tsx'),
  route('letter', 'routes/letter.tsx'),
  route('stock', 'routes/stock.tsx'),
  route('otp', 'routes/otp.tsx'),
  route('api/stock', 'routes/api.stock.ts'),
  route('api/otp', 'routes/api.otp.ts'),
] satisfies RouteConfig
