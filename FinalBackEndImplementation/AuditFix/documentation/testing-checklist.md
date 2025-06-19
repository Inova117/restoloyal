# 🧪 TESTING CHECKLIST - AUDIT FIX
## Restaurant Loyalty Platform - Validación de Correcciones

**Objetivo:** Validar que cada corrección funciona correctamente antes de pasar a la siguiente  
**Metodología:** Test incremental + Regression testing  
**Cobertura Target:** 80%

---

## 🎯 TESTING STRATEGY

### **Niveles de Testing:**
1. **Unit Tests** - Funciones individuales
2. **Integration Tests** - Hooks + Components
3. **E2E Tests** - Flujos completos
4. **Manual Tests** - UI/UX validation

### **Testing por Fase:**
- **Fase 1:** Fundamentos → Unit + Integration
- **Fase 2:** Tier-by-Tier → Integration + E2E
- **Fase 3:** Full System → E2E + Manual

---

## 🔥 FASE 1: FUNDAMENTOS - TESTING

### **DÍA 1: TIPOS Y SCHEMA**

#### **Test 1.1: Database Types Validation**
```bash
# Comandos de validación
npm run type-check
npm run build
```

**Checklist:**
- [ ] **TypeScript Compilation:** 0 errores críticos
- [ ] **Supabase Types:** Interfaces generadas correctamente
- [ ] **User Roles:** Campos existentes en schema
- [ ] **Platform Metrics:** Interface completa
- [ ] **Activity Items:** Tipos correctos

**Validation Script:**
```typescript
// types-fixes/validate-types.test.ts
import { Database } from '../src/integrations/supabase/types'

describe('Database Types Validation', () => {
  test('user_roles table structure', () => {
    // Validar que user_roles tiene campos correctos
  })
  
  test('Platform metrics interface', () => {
    // Validar PlatformMetrics interface
  })
})
```

#### **Test 1.2: Environment Variables**
```bash
# Script de validación
node scripts/validate-env.js
```

**Checklist:**
- [ ] **VITE_PLATFORM_ADMIN_EMAILS:** Configurado y válido
- [ ] **VITE_GALLETTI_ADMIN_EMAILS:** Configurado y válido
- [ ] **SUPABASE_SERVICE_ROLE_KEY:** Presente y funcional
- [ ] **VITE_APP_NAME:** Configurado como "Fydely"
- [ ] **VITE_APP_URL:** URL de producción correcta
- [ ] **Script Validation:** Pasa todas las validaciones

### **DÍA 2: EDGE FUNCTIONS**

#### **Test 2.1: Customer Manager Edge Function**
```bash
# Deploy y test Edge Function
supabase functions deploy customer-manager
curl -X GET https://[project].supabase.co/functions/v1/customer-manager
```

**Checklist:**
- [ ] **Deploy Success:** Edge Function desplegada sin errores
- [ ] **GET /customer-manager:** Lista customers correctamente
- [ ] **POST /customer-manager:** Crea customer nuevo
- [ ] **PATCH /customer-manager:** Actualiza customer existente
- [ ] **DELETE /customer-manager:** Elimina customer
- [ ] **Error Handling:** Respuestas correctas para errores
- [ ] **RLS Enforcement:** Respeta políticas de seguridad

**Integration Test:**
```typescript
// Test useCustomerManager hook integration
describe('useCustomerManager Integration', () => {
  test('fetches customers from Edge Function', async () => {
    // Mock y test real API call
  })
})
```

#### **Test 2.2: Staff Manager Edge Function**
```bash
supabase functions deploy staff-manager
```

**Checklist:**
- [ ] **Deploy Success:** Sin errores
- [ ] **GET /staff-manager:** Lista staff por location
- [ ] **POST /staff-manager:** Invita nuevo staff
- [ ] **PATCH /staff-manager:** Actualiza staff
- [ ] **DELETE /staff-manager:** Remueve staff
- [ ] **Email Integration:** Invitaciones por email funcionan
- [ ] **Permission Check:** Solo location admin puede gestionar

### **DÍA 3: MOCK MODE DISABLE**

#### **Test 3.1: Hooks Real Mode Validation**

**Checklist por Hook:**

**useCustomerManager.ts:**
- [ ] **MOCK_MODE = false:** Variable cambiada
- [ ] **Real API Calls:** Llama Edge Function, no mock data
- [ ] **Error Handling:** Maneja errores reales
- [ ] **Loading States:** Estados correctos

**useAnalyticsManager.ts:**
- [ ] **MOCK_MODE = false:** Variable cambiada
- [ ] **Real Data:** Datos de Supabase, no hardcoded
- [ ] **Filters Work:** Filtros por fecha/location
- [ ] **Performance:** Queries optimizadas

**useLoyaltyManager.ts:**
- [ ] **MOCK_MODE = false:** Variable cambiada
- [ ] **Settings CRUD:** Crear/leer/actualizar settings
- [ ] **Campaigns:** Gestión de campañas real
- [ ] **Validation:** Reglas de negocio aplicadas

**useStaffManager.ts:**
- [ ] **MOCK_MODE = false:** Variable cambiada
- [ ] **Staff Operations:** CRUD completo
- [ ] **Invitations:** Sistema de invitaciones
- [ ] **Permissions:** Control de acceso

**usePOSOperations.ts:**
- [ ] **MOCK_MODE = false:** Variable cambiada
- [ ] **Customer Lookup:** Búsqueda real
- [ ] **Stamp System:** Agregar/validar sellos
- [ ] **Rewards:** Sistema de recompensas

**useDataExport.ts:**
- [ ] **MOCK_MODE = false:** Variable cambiada
- [ ] **Export Functions:** Genera archivos reales
- [ ] **Format Support:** CSV, JSON, PDF, Excel
- [ ] **Data Accuracy:** Datos correctos exportados

---

## 🏢 FASE 2: TIER-BY-TIER TESTING

### **TIER 1: SUPERADMIN TESTING**

#### **Test T1.1: Platform Management**

**Manual Testing:**
1. Login como Superadmin
2. Acceder a Platform Dashboard
3. Verificar cada funcionalidad

**Checklist:**
- [ ] **Dashboard Load:** Carga sin errores
- [ ] **Client List:** Muestra clientes reales
- [ ] **Metrics Display:** Métricas correctas
- [ ] **Client Creation:** Formulario funciona
- [ ] **Client Management:** Editar/eliminar
- [ ] **Activity Feed:** Muestra actividad real
- [ ] **Performance:** <3s load time

**E2E Test:**
```typescript
// e2e/superadmin-dashboard.spec.ts
test('Superadmin can manage clients', async ({ page }) => {
  await page.goto('/platform')
  await page.click('[data-testid="create-client"]')
  // ... complete flow
})
```

#### **Test T1.2: Client Profile Management**

**API Testing:**
```bash
# Test client profile endpoints
curl -X GET https://[project].supabase.co/functions/v1/client-profile?id=123
curl -X PUT https://[project].supabase.co/functions/v1/client-profile -d '{"name":"Updated"}'
```

**Checklist:**
- [ ] **Profile Fetch:** GET profile funciona
- [ ] **Profile Update:** PUT actualiza correctamente
- [ ] **Metrics Calculation:** Métricas precisas
- [ ] **Validation:** Datos validados
- [ ] **Error Handling:** Errores manejados

#### **Test T1.3: Platform Activity Feed**

**Real-time Testing:**
1. Abrir dashboard en 2 tabs
2. Hacer acción en tab 1
3. Verificar actualización en tab 2

**Checklist:**
- [ ] **Activity List:** Muestra actividades
- [ ] **Real-time Updates:** WebSocket funciona
- [ ] **Filters:** Filtros por tipo/fecha
- [ ] **Pagination:** Paginación correcta
- [ ] **Performance:** Updates eficientes

### **TIER 2: CLIENT ADMIN TESTING**

#### **Test T2.1: Analytics Dashboard**

**Data Validation:**
```sql
-- Verificar datos en BD vs dashboard
SELECT COUNT(*) FROM customers WHERE client_id = 'test-client';
SELECT SUM(amount) FROM transactions WHERE client_id = 'test-client';
```

**Checklist:**
- [ ] **Aggregate Metrics:** Números correctos
- [ ] **Location Breakdown:** Datos por location
- [ ] **Trend Analysis:** Gráficos precisos
- [ ] **Date Filters:** Filtros funcionan
- [ ] **Export Data:** Exportación correcta
- [ ] **Performance:** <5s para cálculos

#### **Test T2.2: Client Management Tools**

**TypeScript Validation:**
```bash
# Verificar 0 errores TS en el archivo
npx tsc --noEmit src/hooks/platform/useClientManagement.ts
```

**Checklist:**
- [ ] **Type Safety:** 0 errores TypeScript
- [ ] **Hook Dependencies:** Dependencies correctas
- [ ] **Revenue Calculation:** Cálculo real implementado
- [ ] **Error Handling:** Errores manejados
- [ ] **Performance:** Memoization correcta

#### **Test T2.3: Location Management**

**CRUD Testing:**
1. Crear nueva location
2. Listar locations
3. Actualizar location
4. Eliminar location

**Checklist:**
- [ ] **Create Location:** Formulario funciona
- [ ] **List Locations:** Muestra todas las locations
- [ ] **Update Location:** Edición funciona
- [ ] **Delete Location:** Eliminación segura
- [ ] **Validation:** Reglas de negocio
- [ ] **Hierarchy:** Respeta jerarquía client→location

### **TIER 3: LOCATION STAFF TESTING**

#### **Test T3.1: POS Operations** ⚠️ CRÍTICO

**End-to-End POS Flow:**
1. Login como Staff
2. Buscar customer
3. Registrar purchase
4. Agregar stamp
5. Verificar loyalty progress

**Checklist:**
- [ ] **Customer Lookup:** Búsqueda por email/phone
- [ ] **Customer Registration:** Registro desde POS
- [ ] **Add Stamp:** Agregar sello funciona
- [ ] **Stamp Validation:** Límites respetados
- [ ] **Reward Redemption:** Canje de recompensas
- [ ] **Transaction Log:** Historial correcto
- [ ] **Performance:** <2s por operación

**Stress Testing:**
```bash
# Test múltiples operaciones simultáneas
for i in {1..10}; do
  curl -X POST https://[project].supabase.co/functions/v1/pos-operations/add-stamp &
done
```

#### **Test T3.2: Loyalty Management**

**Settings Management:**
1. Configurar loyalty program
2. Definir stamps required
3. Configurar rewards
4. Test validaciones

**Checklist:**
- [ ] **Settings CRUD:** Crear/leer/actualizar/eliminar
- [ ] **Stamp Configuration:** Stamps por reward
- [ ] **Reward Management:** Tipos de recompensas
- [ ] **Campaign Creation:** Campañas promocionales
- [ ] **Validation Rules:** Reglas de negocio
- [ ] **Preview Mode:** Vista previa changes

#### **Test T3.3: Staff Dashboard**

**Dashboard Functionality:**
```typescript
// Test staff dashboard components
describe('Staff Dashboard', () => {
  test('displays current shift stats', () => {
    // Test shift statistics
  })
  
  test('shows recent transactions', () => {
    // Test transaction list
  })
})
```

**Checklist:**
- [ ] **Dashboard Load:** Carga correctamente
- [ ] **Shift Stats:** Estadísticas del turno
- [ ] **Recent Transactions:** Transacciones recientes
- [ ] **Quick Actions:** Acciones rápidas POS
- [ ] **Notifications:** Alertas importantes
- [ ] **Performance:** Responsive UI

### **TIER 4: CUSTOMERS TESTING**

#### **Test T4.2: Notification Campaigns**

**Campaign Flow:**
1. Crear campaign
2. Definir target audience
3. Enviar notifications
4. Track results

**Checklist:**
- [ ] **Campaign Creation:** Formulario completo
- [ ] **Audience Targeting:** Filtros por segmento
- [ ] **Message Templates:** Templates funcionan
- [ ] **Send Notifications:** Envío masivo
- [ ] **Delivery Tracking:** Estado de entrega
- [ ] **Analytics:** Métricas de campaña

#### **Test T4.3: Data Export System**

**Export Testing:**
```bash
# Test cada formato de export
curl -X POST https://[project].supabase.co/functions/v1/data-export \
  -d '{"format":"csv","type":"customers"}'
```

**Checklist:**
- [ ] **CSV Export:** Genera CSV válido
- [ ] **JSON Export:** Estructura correcta
- [ ] **PDF Reports:** PDF bien formateado
- [ ] **Excel Export:** Excel funcional
- [ ] **Data Accuracy:** Datos correctos
- [ ] **File Size:** Archivos optimizados
- [ ] **Download Links:** Links funcionan

---

## 🔧 FASE 3: TECHNICAL CORRECTIONS TESTING

### **TypeScript Fixes Validation**

#### **Test TS.1: Type Safety**
```bash
# Compilación estricta
npx tsc --strict --noEmit
```

**Checklist:**
- [ ] **0 `any` Types:** Todos los tipos definidos
- [ ] **Interface Completeness:** Interfaces completas
- [ ] **Type Guards:** Type guards implementados
- [ ] **Strict Mode:** Pasa TypeScript strict
- [ ] **Generated Types:** Supabase types actualizados

#### **Test TS.2: React Hooks**
```bash
# ESLint hooks validation
npx eslint src/ --ext .ts,.tsx --rule "react-hooks/exhaustive-deps: error"
```

**Checklist:**
- [ ] **Dependencies Complete:** Todas las dependencies incluidas
- [ ] **No Render Loops:** No loops infinitos
- [ ] **useCallback Proper:** Memoization correcta
- [ ] **useEffect Cleanup:** Cleanup functions
- [ ] **Performance:** Re-renders optimizados

### **Code Quality Validation**

#### **Test CQ.1: ESLint**
```bash
npm run lint
```

**Target:** <10 errores totales

**Checklist:**
- [ ] **Syntax Errors:** 0 errores de sintaxis
- [ ] **Best Practices:** Buenas prácticas aplicadas
- [ ] **Unused Variables:** Variables no usadas eliminadas
- [ ] **Import Order:** Imports organizados
- [ ] **Consistent Style:** Estilo consistente

#### **Test CQ.2: Performance**
```bash
npm run build
npm run preview
```

**Métricas Target:**
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

**Checklist:**
- [ ] **Bundle Size:** <500KB gzipped
- [ ] **Lazy Loading:** Componentes lazy loaded
- [ ] **Code Splitting:** Chunks optimizados
- [ ] **Fast Refresh:** Hot reload funciona
- [ ] **Build Time:** <30s build time

---

## 🧪 INTEGRATION TESTING

### **Multi-Tier Flow Testing**

#### **Complete User Journey:**
1. **Superadmin** crea Client
2. **Client** crea Location y configura loyalty
3. **Staff** registra Customer y agrega stamps
4. **Customer** recibe notifications y canjea reward

**E2E Test Script:**
```typescript
// e2e/complete-flow.spec.ts
test('Complete multi-tier flow', async ({ page }) => {
  // 1. Superadmin creates client
  await loginAsSuperadmin(page)
  await createClient(page, 'Test Restaurant')
  
  // 2. Client creates location
  await loginAsClient(page)
  await createLocation(page, 'Downtown Branch')
  
  // 3. Staff registers customer
  await loginAsStaff(page)
  await registerCustomer(page, 'john@example.com')
  
  // 4. Add stamps and redeem
  await addStamps(page, 10)
  await redeemReward(page)
  
  // Verify entire flow worked
  await verifyRewardRedeemed(page)
})
```

### **Security Testing**

#### **Authentication & Authorization:**
```typescript
// Test RLS policies
test('RLS policies enforce access control', async () => {
  // Test client can only see their data
  // Test staff can only access their location
  // Test customers can only see their profile
})
```

**Checklist:**
- [ ] **Multi-tenant Isolation:** Clients isolated
- [ ] **RLS Enforcement:** Policies working
- [ ] **JWT Validation:** Tokens validated
- [ ] **Permission Checks:** Roles respected
- [ ] **SQL Injection:** Protected against injection

### **Performance Testing**

#### **Load Testing:**
```bash
# Artillery load test
artillery run load-test-config.yml
```

**Targets:**
- 100 concurrent users
- <2s response time
- 99% success rate

**Checklist:**
- [ ] **Concurrent Users:** Handles 100+ users
- [ ] **Database Performance:** Queries optimized
- [ ] **Edge Function Scaling:** Functions scale
- [ ] **Memory Usage:** <512MB usage
- [ ] **Error Rate:** <1% error rate

---

## ✅ FINAL VALIDATION CHECKLIST

### **System Health Check:**
- [ ] **All Tiers Functional:** 4 tiers working
- [ ] **All Edge Functions:** 8 functions deployed
- [ ] **0 Critical Errors:** No blocking issues
- [ ] **Performance Targets:** All metrics met
- [ ] **Security Validated:** All tests pass

### **Code Quality Check:**
- [ ] **TypeScript:** 0 errors, strict mode
- [ ] **ESLint:** <10 warnings
- [ ] **Test Coverage:** >80%
- [ ] **Documentation:** Updated and complete
- [ ] **Git History:** Clean commits

### **User Acceptance:**
- [ ] **Superadmin Flow:** Complete functionality
- [ ] **Client Flow:** Analytics and management
- [ ] **Staff Flow:** POS operations smooth
- [ ] **Customer Flow:** Loyalty system works
- [ ] **Mobile Responsive:** Works on mobile

---

## 🚀 DEPLOYMENT VALIDATION

### **Pre-Production:**
- [ ] **Staging Deploy:** All functions deployed
- [ ] **Data Migration:** Test data migrated
- [ ] **Environment Vars:** All configured
- [ ] **SSL Certificates:** HTTPS working
- [ ] **Monitoring:** Alerts configured

### **Production Readiness:**
- [ ] **Backup Strategy:** Backups working
- [ ] **Rollback Plan:** Rollback tested
- [ ] **Performance Monitoring:** Metrics tracked
- [ ] **Error Tracking:** Error reporting
- [ ] **User Training:** Documentation ready

---

**🎯 SUCCESS CRITERIA:**
- ✅ Todos los tests pasan
- ✅ Performance targets met
- ✅ 0 errores críticos
- ✅ User flows completos
- ✅ Sistema production-ready

**📊 FINAL SCORE TARGET: 95%+ functionality** 