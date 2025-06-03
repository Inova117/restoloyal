# 🔒 **LIMPIEZA DE CONSOLE.LOG SENSIBLES**

## **PROBLEMA IDENTIFICADO**
La aplicación tiene **múltiples console.log statements** que exponen información sensible en el navegador del cliente.

## **🚨 CONSOLE.LOG SENSIBLES ENCONTRADOS**

### **1. Información de Autenticación**
```typescript
// ❌ EXPONE DATOS SENSIBLES
console.log('Role detection debug:', {
  userEmail: user.email,
  isZerionAdmin,
  userMetadata: user.user_metadata
})

console.log('User roles query result:', userRolesResponse)
console.log('User metadata:', user.user_metadata)
```

### **2. Datos de Usuario**
```typescript
// ❌ EXPONE INFORMACIÓN PERSONAL
console.log('Fetching data for user:', user.id, 'Role:', role)
console.log('User already exists, proceeding with existing user:', userId)
```

### **3. Información de Sesión**
```typescript
// ❌ EXPONE TOKENS Y SESIONES
console.log('📱 Session token available:', !!session.access_token)
console.log('Session storage after setting:', { ... })
```

---

## **🔧 PLAN DE LIMPIEZA**

### **FASE 1: Eliminar Console.log Críticos**

#### **Archivos a Limpiar:**
1. `src/hooks/useUserRole.ts` - ✅ **YA LIMPIADO**
2. `src/pages/Index.tsx` - Eliminar logs de user.id y role
3. `src/components/AppleWalletButton.tsx` - Eliminar logs de session tokens
4. `src/components/GallettiHQDashboard.tsx` - Eliminar logs de navegación
5. `src/lib/security.ts` - Mantener solo logs de seguridad no sensibles

### **FASE 2: Implementar Logging Seguro**

#### **Patrón de Logging Seguro:**
```typescript
// ✅ SEGURO - No expone datos sensibles
if (import.meta.env.DEV) {
  console.log('Role detection completed for user')
}

// ✅ SEGURO - Solo información de debug no sensible
console.log('Navigation to location dashboard initiated')

// ❌ INSEGURO - Nunca hacer esto
console.log('User data:', user)
console.log('Session token:', token)
```

---

## **🛡️ REGLAS DE LOGGING SEGURO**

### **✅ PERMITIDO**
- Estados de la aplicación (loading, success, error)
- Navegación entre páginas
- Eventos de UI (clicks, form submissions)
- Información de debug no sensible

### **❌ PROHIBIDO**
- Emails de usuarios
- IDs de usuario
- Tokens de sesión
- Metadatos de usuario
- Información de roles específicos
- Datos de autenticación

---

## **🚀 IMPLEMENTACIÓN INMEDIATA**

### **1. Crear Función de Logging Seguro**
```typescript
// src/lib/secureLogger.ts
export const secureLog = {
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      // Solo log en desarrollo y sin datos sensibles
      console.log(`[DEBUG] ${message}`, data ? '[DATA_HIDDEN]' : '')
    }
  },
  
  info: (message: string) => {
    console.log(`[INFO] ${message}`)
  },
  
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error?.message || '')
  }
}
```

### **2. Reemplazar Console.log Existentes**
```typescript
// ❌ ANTES
console.log('User roles query result:', userRolesResponse)

// ✅ DESPUÉS
secureLog.debug('User roles query completed')
```

---

## **📋 CHECKLIST DE LIMPIEZA**

### **Archivos Frontend**
- [ ] `src/hooks/useUserRole.ts` - ✅ **COMPLETADO**
- [ ] `src/pages/Index.tsx` - Pendiente
- [ ] `src/components/AppleWalletButton.tsx` - Pendiente
- [ ] `src/components/GallettiHQDashboard.tsx` - Pendiente
- [ ] `src/lib/security.ts` - Pendiente

### **Edge Functions**
- [ ] `supabase/functions/create-client-with-user-v2/index.ts` - Pendiente
- [ ] `supabase/functions/notification-campaigns/index.ts` - Pendiente
- [ ] `supabase/functions/geo-push/index.ts` - Pendiente

### **Hooks Personalizados**
- [ ] `src/hooks/useStaffManager.ts` - Pendiente
- [ ] `src/hooks/useLoyaltyManager.ts` - Pendiente
- [ ] `src/hooks/useCustomerManager.ts` - Pendiente
- [ ] `src/hooks/useAnalyticsManager.ts` - Pendiente

---

## **🎯 PRIORIDAD DE LIMPIEZA**

### **🔴 CRÍTICO (Inmediato)**
1. **useUserRole.ts** - ✅ **COMPLETADO**
2. **Index.tsx** - Expone user.id y role
3. **AppleWalletButton.tsx** - Expone session tokens

### **🟠 ALTO (24h)**
4. **GallettiHQDashboard.tsx** - Expone navegación sensible
5. **Edge Functions** - Exponen user IDs

### **🟡 MEDIO (48h)**
6. **Hooks personalizados** - Exponen client IDs
7. **Security.ts** - Revisar logs de seguridad

---

**🔒 ESTADO ACTUAL: useUserRole.ts limpiado ✅**
**🚀 PRÓXIMO PASO: Limpiar Index.tsx y AppleWalletButton.tsx** 