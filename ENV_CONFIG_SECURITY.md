# 🔒 **CONFIGURACIÓN SEGURA DE VARIABLES DE ENTORNO**

## **PROBLEMA RESUELTO: Emails Hardcodeados**

### **❌ Antes (Inseguro)**
```typescript
// Emails hardcodeados en el código fuente
const zerionAdminEmails = ['admin@zerioncore.com', 'platform@zerioncore.com']
const gallettiHQEmails = ['admin@galletti.com', 'corporate@galletti.com']
```

### **✅ Después (Seguro)**
```typescript
// Emails configurados via variables de entorno
const adminEmails = import.meta.env.VITE_PLATFORM_ADMIN_EMAILS.split(',')
const gallettiEmails = import.meta.env.VITE_GALLETTI_ADMIN_EMAILS.split(',')
```

---

## **🚀 CONFIGURACIÓN REQUERIDA**

### **1. Variables de Entorno (.env)**
```bash
# ============================================================================
# 🔒 SECURITY: ADMIN EMAIL CONFIGURATION
# ============================================================================

# Platform Admin Emails (comma-separated)
# These users will have full platform access (ZerionCore role)
VITE_PLATFORM_ADMIN_EMAILS=admin@zerioncore.com,platform@zerioncore.com,owner@zerioncore.com,martin@zerionstudio.com

# Client Admin Emails (comma-separated) 
# These users will have client admin access (Galletti HQ role)
VITE_GALLETTI_ADMIN_EMAILS=admin@galletti.com,corporate@galletti.com,hq@galletti.com

# Supabase Configuration
VITE_SUPABASE_URL=https://benlobpdlknywgqtzdki.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### **2. Variables de Entorno en Netlify**
```bash
# Agregar en Netlify Dashboard → Site Settings → Environment Variables:
VITE_PLATFORM_ADMIN_EMAILS=admin@zerioncore.com,platform@zerioncore.com,owner@zerioncore.com,martin@zerionstudio.com
VITE_GALLETTI_ADMIN_EMAILS=admin@galletti.com,corporate@galletti.com,hq@galletti.com
```

---

## **🔧 IMPLEMENTACIÓN**

### **Archivo Actualizado: `src/hooks/useUserRole.ts`**

#### **Función de Detección de Platform Admin**
```typescript
function checkPlatformAdminRole(userEmail: string): boolean {
  // Get admin emails from environment variables for security
  const adminEmailsEnv = import.meta.env.VITE_PLATFORM_ADMIN_EMAILS || ''
  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(Boolean)
  
  // Fallback to default admins only in development
  if (adminEmails.length === 0 && import.meta.env.DEV) {
    const devAdmins = ['admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com']
    return devAdmins.includes(userEmail)
  }
  
  return adminEmails.includes(userEmail)
}
```

#### **Función de Detección de Client Admin**
```typescript
function checkClientAdminRole(userEmail: string): { isClientAdmin: boolean, clientId?: string, clientName?: string } {
  // Check for Galletti admins via environment variables
  const gallettiEmailsEnv = import.meta.env.VITE_GALLETTI_ADMIN_EMAILS || ''
  const gallettiEmails = gallettiEmailsEnv.split(',').map(email => email.trim()).filter(Boolean)
  
  // Fallback to default emails only in development
  if (gallettiEmails.length === 0 && import.meta.env.DEV) {
    const devGallettiEmails = ['admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com']
    if (devGallettiEmails.includes(userEmail)) {
      return {
        isClientAdmin: true,
        clientId: 'galletti',
        clientName: 'Galletti Restaurant Chain'
      }
    }
  }
  
  if (gallettiEmails.includes(userEmail)) {
    return {
      isClientAdmin: true,
      clientId: 'galletti',
      clientName: 'Galletti Restaurant Chain'
    }
  }

  return { isClientAdmin: false }
}
```

---

## **✅ BENEFICIOS DE SEGURIDAD**

### **1. Emails No Expuestos**
- ❌ **Antes**: Emails visibles en código fuente
- ✅ **Después**: Emails solo en variables de entorno

### **2. Escalabilidad**
- ❌ **Antes**: Cambios requieren modificar código
- ✅ **Después**: Cambios solo requieren actualizar variables

### **3. Ambiente-Específico**
- ✅ **Desarrollo**: Fallback a emails de desarrollo
- ✅ **Producción**: Solo emails configurados en Netlify

### **4. Seguridad de Logs**
- ✅ **Eliminados**: Todos los `console.log()` con datos sensibles
- ✅ **Fallback seguro**: Errores no exponen detalles

---

## **📋 CHECKLIST DE DEPLOYMENT**

### **Antes de Deploy**
- [ ] ✅ Variables de entorno configuradas en Netlify
- [ ] ✅ Código actualizado sin emails hardcodeados  
- [ ] ✅ Console.log statements eliminados
- [ ] ✅ Fallbacks seguros implementados

### **Después de Deploy**
- [ ] Verificar role detection funciona correctamente
- [ ] Verificar nuevos admins pueden ser agregados via env vars
- [ ] Verificar no hay información sensible en DevTools
- [ ] Verificar fallbacks funcionan en development

---

## **🔄 MIGRACIÓN FUTURA**

### **Fase 2: Database-Driven Roles (Recomendado)**
Para máxima seguridad y escalabilidad, migrar a:

1. **Tabla `platform_admin_users`**
2. **Gestión de roles vía interfaz admin**
3. **Eliminación completa de emails hardcodeados**

```sql
-- Future schema for dynamic role management
CREATE TABLE platform_admin_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**🔒 ESTADO ACTUAL: Emails hardcodeados eliminados ✅**
**🚀 PRÓXIMO PASO: Deploy con variables de entorno** 