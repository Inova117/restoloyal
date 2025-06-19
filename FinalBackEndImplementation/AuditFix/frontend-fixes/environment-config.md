# 🔧 ENVIRONMENT CONFIGURATION - AUDIT FIX
## Variables de Entorno Faltantes y Configuración

**Objetivo:** Configurar todas las variables de entorno requeridas para el sistema  
**Status:** Crítico - Múltiples funcionalidades fallan sin estas variables

---

## 🚨 VARIABLES FALTANTES IDENTIFICADAS

### **Variables Críticas No Configuradas:**
```bash
VITE_PLATFORM_ADMIN_EMAILS=admin@domain.com
VITE_GALLETTI_ADMIN_EMAILS=admin@galletti.com
SUPABASE_SERVICE_ROLE_KEY=sk_...
VITE_APP_NAME=Fydely
VITE_APP_URL=https://fydely.com
```

### **Variables Existentes (OK):**
```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📋 CONFIGURACIÓN REQUERIDA

### **1. Variables de Administración**

#### **VITE_PLATFORM_ADMIN_EMAILS**
- **Propósito:** Emails de superadmins de la plataforma
- **Formato:** Emails separados por comas
- **Ejemplo:** `admin@zerion.com,support@zerion.com`
- **Uso:** `src/hooks/useUserRole.ts` para determinar superadmin access

#### **VITE_GALLETTI_ADMIN_EMAILS**
- **Propósito:** Emails específicos de Galletti (cliente especial)
- **Formato:** Emails separados por comas
- **Ejemplo:** `admin@galletti.com,manager@galletti.com`
- **Uso:** Permisos especiales para cliente Galletti

### **2. Variables de Aplicación**

#### **VITE_APP_NAME**
- **Propósito:** Nombre de la aplicación
- **Valor:** `Fydely`
- **Uso:** Branding, títulos, emails

#### **VITE_APP_URL**
- **Propósito:** URL base de la aplicación
- **Valor:** `https://fydely.com` (producción)
- **Desarrollo:** `http://localhost:5173`
- **Uso:** Links en emails, redirects

### **3. Variables de Backend**

#### **SUPABASE_SERVICE_ROLE_KEY**
- **Propósito:** Key para operaciones de backend/Edge Functions
- **Formato:** `sk_...` (service role key)
- **Seguridad:** ⚠️ **NUNCA exponer en frontend**
- **Uso:** Edge Functions, operaciones administrativas

---

## 🔧 IMPLEMENTACIÓN

### **Paso 1: Crear archivo .env.local**

```bash
# Crear archivo de environment local
cp env.example .env.local
```

### **Paso 2: Configurar variables**

```bash
# .env.local
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[your-anon-key]

# Variables faltantes - CONFIGURAR
VITE_PLATFORM_ADMIN_EMAILS=admin@zerion.com,support@zerion.com
VITE_GALLETTI_ADMIN_EMAILS=admin@galletti.com
VITE_APP_NAME=Fydely
VITE_APP_URL=https://fydely.com

# Backend key - NO incluir en .env.local (solo en servidor)
# SUPABASE_SERVICE_ROLE_KEY=sk_[service-role-key]
```

### **Paso 3: Configurar para producción**

#### **Netlify Environment Variables:**
```bash
# En Netlify Dashboard → Site Settings → Environment Variables
VITE_PLATFORM_ADMIN_EMAILS=admin@zerion.com,support@zerion.com
VITE_GALLETTI_ADMIN_EMAILS=admin@galletti.com
VITE_APP_NAME=Fydely
VITE_APP_URL=https://fydely.com
```

#### **Supabase Edge Functions:**
```bash
# En Supabase Dashboard → Settings → API → Service Role Key
SUPABASE_SERVICE_ROLE_KEY=sk_[your-service-role-key]
```

---

## 🧪 VALIDACIÓN

### **Script de Validación**

```typescript
// scripts/validate-env.ts
interface RequiredEnvVars {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  VITE_PLATFORM_ADMIN_EMAILS: string
  VITE_GALLETTI_ADMIN_EMAILS: string
  VITE_APP_NAME: string
  VITE_APP_URL: string
}

const validateEnvironment = (): boolean => {
  const required: (keyof RequiredEnvVars)[] = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PLATFORM_ADMIN_EMAILS',
    'VITE_GALLETTI_ADMIN_EMAILS',
    'VITE_APP_NAME',
    'VITE_APP_URL'
  ]

  const missing: string[] = []
  const invalid: string[] = []

  required.forEach(key => {
    const value = import.meta.env[key]
    
    if (!value) {
      missing.push(key)
    } else {
      // Validate format
      switch (key) {
        case 'VITE_PLATFORM_ADMIN_EMAILS':
        case 'VITE_GALLETTI_ADMIN_EMAILS':
          if (!value.includes('@')) {
            invalid.push(`${key}: Must contain valid email addresses`)
          }
          break
        case 'VITE_SUPABASE_URL':
          if (!value.startsWith('https://') || !value.includes('supabase.co')) {
            invalid.push(`${key}: Must be valid Supabase URL`)
          }
          break
        case 'VITE_APP_URL':
          if (!value.startsWith('http')) {
            invalid.push(`${key}: Must be valid URL`)
          }
          break
      }
    }
  })

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing)
  }

  if (invalid.length > 0) {
    console.error('❌ Invalid environment variables:', invalid)
  }

  if (missing.length === 0 && invalid.length === 0) {
    console.log('✅ All environment variables configured correctly')
    return true
  }

  return false
}

export { validateEnvironment }
```

### **Comando de Validación**

```bash
# Ejecutar validación
npm run validate-env

# O directamente
node -e "
  const vars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_PLATFORM_ADMIN_EMAILS', 'VITE_GALLETTI_ADMIN_EMAILS', 'VITE_APP_NAME', 'VITE_APP_URL'];
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length) {
    console.log('❌ Missing:', missing.join(', '));
    process.exit(1);
  } else {
    console.log('✅ All environment variables configured');
  }
"
```

---

## 🔍 DEBUGGING

### **Verificar Variables en Runtime**

```typescript
// En cualquier componente
const debugEnv = () => {
  console.log('Environment Debug:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    VITE_PLATFORM_ADMIN_EMAILS: import.meta.env.VITE_PLATFORM_ADMIN_EMAILS ? '✅ Set' : '❌ Missing',
    VITE_GALLETTI_ADMIN_EMAILS: import.meta.env.VITE_GALLETTI_ADMIN_EMAILS ? '✅ Set' : '❌ Missing',
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME ? '✅ Set' : '❌ Missing',
    VITE_APP_URL: import.meta.env.VITE_APP_URL ? '✅ Set' : '❌ Missing',
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV
  })
}
```

### **Verificar en Build**

```bash
# Build y verificar que variables están disponibles
npm run build

# Verificar en dist/assets/index-*.js que variables VITE_ están incluidas
grep -r "VITE_PLATFORM_ADMIN_EMAILS" dist/
```

---

## 🚨 PROBLEMAS COMUNES

### **1. Variables no se cargan**
**Síntoma:** `import.meta.env.VITE_* === undefined`
**Solución:**
- Verificar que el archivo `.env.local` existe
- Verificar que variables empiezan con `VITE_`
- Reiniciar dev server

### **2. Variables no disponibles en build**
**Síntoma:** Variables funcionan en dev pero no en producción
**Solución:**
- Configurar variables en Netlify/Vercel dashboard
- Verificar que están en el build environment

### **3. Service Role Key expuesta**
**Síntoma:** `SUPABASE_SERVICE_ROLE_KEY` visible en frontend
**Solución:**
- ⚠️ **NUNCA** usar `VITE_` prefix para service role key
- Solo configurar en Edge Functions environment

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### **Desarrollo:**
- [ ] Archivo `.env.local` creado
- [ ] `VITE_PLATFORM_ADMIN_EMAILS` configurado
- [ ] `VITE_GALLETTI_ADMIN_EMAILS` configurado
- [ ] `VITE_APP_NAME=Fydely` configurado
- [ ] `VITE_APP_URL=http://localhost:5173` configurado
- [ ] Variables validadas con script

### **Producción:**
- [ ] Variables configuradas en Netlify/Vercel
- [ ] `VITE_APP_URL` apunta a dominio real
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado en Edge Functions
- [ ] Build exitoso con todas las variables
- [ ] Funcionalidades de admin funcionando

### **Testing:**
- [ ] Login como superadmin funciona
- [ ] Galletti admin access funciona
- [ ] Branding muestra "Fydely"
- [ ] Links y redirects funcionan
- [ ] Edge Functions con service key funcionan

---

**🎯 OBJETIVO:** Todas las variables configuradas y validadas  
**📊 IMPACTO:** Elimina 5+ errores críticos de configuración  
**⏱️ TIEMPO ESTIMADO:** 30 minutos 