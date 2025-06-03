# 🏗️ **PLAN DE MIGRACIÓN: SISTEMA DE ROLES ESCALABLE**

## **PROBLEMA ACTUAL**
El sistema actual usa **emails hardcodeados** y **lógica de roles fija**, lo que hace imposible:
- Agregar nuevos clientes sin modificar código
- Gestionar roles dinámicamente
- Escalar a múltiples tenants

## **🎯 OBJETIVO**
Migrar a un sistema de roles **completamente dinámico** basado en base de datos.

---

## **📋 FASE 1: ESQUEMA DE BASE DE DATOS**

### **1.1 Tabla de Administradores de Plataforma**
```sql
-- Tabla para administradores de ZerionCore
CREATE TABLE platform_admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'super_admin', 'zerion_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **1.2 Tabla de Clientes de Plataforma**
```sql
-- Tabla para clientes multi-tenant (ya existe, pero mejorar)
CREATE TABLE IF NOT EXISTS platform_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'restaurant_chain',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial', 'suspended')),
  plan TEXT DEFAULT 'business' CHECK (plan IN ('trial', 'business', 'enterprise')),
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **1.3 Tabla de Roles de Usuario Mejorada**
```sql
-- Tabla mejorada para roles de usuario
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client_admin', 'restaurant_admin', 'location_staff')),
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions JSONB DEFAULT '{}',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints para asegurar jerarquía correcta
  CONSTRAINT valid_role_hierarchy CHECK (
    (role = 'client_admin' AND client_id IS NOT NULL AND restaurant_id IS NULL AND location_id IS NULL) OR
    (role = 'restaurant_admin' AND client_id IS NOT NULL AND restaurant_id IS NOT NULL AND location_id IS NULL) OR
    (role = 'location_staff' AND client_id IS NOT NULL AND restaurant_id IS NOT NULL AND location_id IS NOT NULL)
  )
);
```

---

## **📋 FASE 2: FUNCIONES DE GESTIÓN DE ROLES**

### **2.1 Función para Verificar Roles de Plataforma**
```sql
-- Función para verificar si un usuario es admin de plataforma
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admin_users 
    WHERE user_id = $1 
    AND status = 'active'
    AND role IN ('platform_admin', 'super_admin', 'zerion_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2.2 Función para Verificar Roles de Cliente**
```sql
-- Función para verificar si un usuario es admin de cliente
CREATE OR REPLACE FUNCTION is_client_admin(user_id UUID, client_id UUID DEFAULT NULL)
RETURNS TABLE(is_admin BOOLEAN, client_id UUID, client_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_admin,
    ur.client_id,
    pc.name as client_name
  FROM user_roles ur
  JOIN platform_clients pc ON pc.id = ur.client_id
  WHERE ur.user_id = $1
  AND ur.role = 'client_admin'
  AND ur.status = 'active'
  AND (client_id IS NULL OR ur.client_id = $2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2.3 Función para Asignar Roles**
```sql
-- Función para asignar roles de forma segura
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id UUID,
  role_name TEXT,
  client_id UUID DEFAULT NULL,
  restaurant_id UUID DEFAULT NULL,
  location_id UUID DEFAULT NULL,
  assigned_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  can_assign BOOLEAN := FALSE;
BEGIN
  -- Verificar permisos del usuario que asigna
  IF assigned_by_user_id IS NULL THEN
    assigned_by_user_id := auth.uid();
  END IF;
  
  -- Solo platform admins pueden asignar roles de cliente
  IF role_name = 'client_admin' THEN
    can_assign := is_platform_admin(assigned_by_user_id);
  END IF;
  
  -- Client admins pueden asignar roles de restaurant y location
  IF role_name IN ('restaurant_admin', 'location_staff') THEN
    can_assign := is_platform_admin(assigned_by_user_id) OR 
                  EXISTS(SELECT 1 FROM is_client_admin(assigned_by_user_id, client_id));
  END IF;
  
  IF NOT can_assign THEN
    RAISE EXCEPTION 'Insufficient permissions to assign role %', role_name;
  END IF;
  
  -- Insertar el rol
  INSERT INTO user_roles (user_id, role, client_id, restaurant_id, location_id, assigned_by)
  VALUES (target_user_id, role_name, client_id, restaurant_id, location_id, assigned_by_user_id)
  ON CONFLICT (user_id, client_id, restaurant_id, location_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    status = 'active',
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## **📋 FASE 3: ACTUALIZACIÓN DEL FRONTEND**

### **3.1 Hook de Roles Dinámico**
```typescript
// src/hooks/useUserRole.ts - Versión completamente dinámica
async function checkPlatformAdminRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_platform_admin', { user_id: userId })
  
  return !error && data === true
}

async function checkClientAdminRole(userId: string): Promise<ClientAdminResult> {
  const { data, error } = await supabase
    .rpc('is_client_admin', { user_id: userId })
  
  if (error || !data || data.length === 0) {
    return { isClientAdmin: false }
  }
  
  return {
    isClientAdmin: true,
    clientId: data[0].client_id,
    clientName: data[0].client_name
  }
}
```

### **3.2 Interfaz de Gestión de Roles**
```typescript
// src/components/RoleManagement.tsx
export function RoleManagement() {
  const assignRole = async (userId: string, role: string, clientId?: string) => {
    const { error } = await supabase
      .rpc('assign_user_role', {
        target_user_id: userId,
        role_name: role,
        client_id: clientId
      })
    
    if (error) {
      toast.error('Failed to assign role: ' + error.message)
    } else {
      toast.success('Role assigned successfully')
    }
  }
  
  // UI para gestionar roles...
}
```

---

## **📋 FASE 4: MIGRACIÓN DE DATOS**

### **4.1 Script de Migración**
```sql
-- Migrar administradores existentes
INSERT INTO platform_admin_users (user_id, role, status)
SELECT 
  id as user_id,
  'platform_admin' as role,
  'active' as status
FROM auth.users 
WHERE email IN (
  'admin@zerioncore.com',
  'platform@zerioncore.com', 
  'owner@zerioncore.com',
  'martin@zerionstudio.com'
);

-- Migrar clientes existentes (Galletti)
INSERT INTO platform_clients (name, slug, contact_email, status)
VALUES ('Galletti Restaurant Chain', 'galletti', 'admin@galletti.com', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Migrar roles de cliente existentes
INSERT INTO user_roles (user_id, role, client_id, status)
SELECT 
  u.id as user_id,
  'client_admin' as role,
  pc.id as client_id,
  'active' as status
FROM auth.users u
CROSS JOIN platform_clients pc
WHERE u.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com')
AND pc.slug = 'galletti';
```

---

## **📋 FASE 5: TESTING Y VALIDACIÓN**

### **5.1 Tests de Roles**
```typescript
// tests/roles.test.ts
describe('Role Management', () => {
  test('Platform admin can assign client admin role', async () => {
    // Test implementation
  })
  
  test('Client admin can assign restaurant admin role', async () => {
    // Test implementation
  })
  
  test('Unauthorized user cannot assign roles', async () => {
    // Test implementation
  })
})
```

### **5.2 Validación de Seguridad**
```sql
-- Test de seguridad: verificar que RLS funciona
SELECT * FROM user_roles; -- Debe fallar para usuarios no autorizados
SELECT * FROM platform_admin_users; -- Debe fallar para no-admins
```

---

## **🚀 CRONOGRAMA DE IMPLEMENTACIÓN**

### **Semana 1: Base de Datos**
- [ ] Crear tablas nuevas
- [ ] Crear funciones de gestión
- [ ] Migrar datos existentes
- [ ] Configurar RLS policies

### **Semana 2: Frontend**
- [ ] Actualizar useUserRole hook
- [ ] Crear interfaz de gestión de roles
- [ ] Actualizar componentes existentes
- [ ] Testing completo

### **Semana 3: Deployment y Validación**
- [ ] Deploy a staging
- [ ] Testing de seguridad
- [ ] Deploy a producción
- [ ] Monitoreo post-deployment

---

## **✅ BENEFICIOS DEL NUEVO SISTEMA**

### **Escalabilidad**
- ✅ Agregar nuevos clientes sin modificar código
- ✅ Gestión de roles completamente dinámica
- ✅ Soporte para múltiples tenants

### **Seguridad**
- ✅ No más emails hardcodeados
- ✅ Permisos granulares por rol
- ✅ Auditoría completa de asignaciones

### **Mantenibilidad**
- ✅ Lógica de roles centralizada en DB
- ✅ Interfaz de gestión para admins
- ✅ Fácil debugging y troubleshooting

---

**🎯 ESTADO ACTUAL: Planificación completa ✅**
**🚀 PRÓXIMO PASO: Implementar esquema de base de datos** 