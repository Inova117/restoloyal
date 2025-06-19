# Setup de Formularios de Contacto

## Resumen

Se ha implementado un sistema completo para gestionar los formularios de contacto enviados desde la landing page. El sistema incluye:

1. **Almacenamiento en Supabase**: Nueva tabla `contact_forms` con RLS
2. **Formulario actualizado**: Ahora guarda datos en la base de datos
3. **Dashboard de gestión**: Nueva pestaña en el dashboard de superadmin
4. **Funcionalidades avanzadas**: Estados, prioridades, filtros y respuestas

## Configuración de Base de Datos

### Paso 1: Crear la tabla en Supabase

1. Ve a tu dashboard de Supabase
2. Navega a **SQL Editor**
3. Ejecuta el siguiente script:

```sql
-- ============================================================================
-- CONTACT FORMS TABLE CREATION
-- ============================================================================
-- Tabla para almacenar los entries del formulario de contacto de la landing page

CREATE TABLE IF NOT EXISTS contact_forms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    phone text,
    message text NOT NULL,
    status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    source text DEFAULT 'landing_page',
    user_agent text,
    ip_address inet,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    replied_at timestamp with time zone
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_contact_forms_status ON contact_forms(status);
CREATE INDEX IF NOT EXISTS idx_contact_forms_created_at ON contact_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_forms_email ON contact_forms(email);
CREATE INDEX IF NOT EXISTS idx_contact_forms_priority ON contact_forms(priority);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contact_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_forms_updated_at
    BEFORE UPDATE ON contact_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_forms_updated_at();

-- RLS (Row Level Security) - Solo superadmins pueden ver todos los formularios
ALTER TABLE contact_forms ENABLE ROW LEVEL SECURITY;

-- Policy para superadmins: pueden ver y gestionar todos los formularios
CREATE POLICY "Superadmins can manage all contact forms" ON contact_forms
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.tier = 'superadmin'
        )
    );

-- Policy para insertar desde la landing page (público)
CREATE POLICY "Anyone can submit contact forms" ON contact_forms
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE contact_forms IS 'Almacena los formularios de contacto enviados desde la landing page';
COMMENT ON COLUMN contact_forms.status IS 'Estado del formulario: new, read, replied, closed';
COMMENT ON COLUMN contact_forms.priority IS 'Prioridad asignada: low, normal, high, urgent';
COMMENT ON COLUMN contact_forms.source IS 'Origen del formulario (landing_page, etc.)';
COMMENT ON COLUMN contact_forms.metadata IS 'Datos adicionales en formato JSON';
```

## Funcionalidades Implementadas

### 1. Formulario de Contacto (Landing Page)

- **Ubicación**: `src/components/ContactForm.tsx`
- **Funcionalidad**: Ahora guarda datos directamente en Supabase
- **Datos capturados**:
  - Información básica: nombre, email, teléfono, empresa
  - Metadatos: tipo de negocio, número de ubicaciones, horario preferido
  - Información técnica: user agent, timestamp

### 2. Dashboard de Gestión (Superadmin)

- **Ubicación**: Nueva pestaña "Contact Forms" en el dashboard de plataforma
- **Acceso**: Solo para usuarios con rol `superadmin`
- **Funcionalidades**:
  - Lista de todos los formularios con filtros
  - Vista detallada de cada formulario
  - Gestión de estados y prioridades
  - Respuesta directa por email
  - Búsqueda y filtrado avanzado

### 3. Estados y Flujo de Trabajo

#### Estados disponibles:
- **new**: Formulario recién enviado (por defecto)
- **read**: Formulario leído por un administrador
- **replied**: Se ha respondido al cliente
- **closed**: Caso cerrado

#### Prioridades disponibles:
- **low**: Prioridad baja
- **normal**: Prioridad normal (por defecto)
- **high**: Prioridad alta
- **urgent**: Prioridad urgente

### 4. Seguridad y Permisos

- **RLS habilitado**: Solo superadmins pueden ver/gestionar formularios
- **Inserción pública**: Cualquiera puede enviar formularios desde la landing
- **Auditoría**: Timestamps automáticos para created_at, read_at, replied_at

## Uso del Sistema

### Para Visitantes de la Landing Page:

1. Hacer clic en el botón "Contacto" en la landing page
2. Completar el formulario con la información requerida
3. Enviar - los datos se guardan automáticamente en Supabase

### Para Superadmins:

1. Iniciar sesión como superadmin
2. Ir al dashboard de plataforma
3. Seleccionar la pestaña "Contact Forms"
4. Ver lista de formularios con filtros por estado, prioridad, etc.
5. Hacer clic en un formulario para ver detalles completos
6. Gestionar estado y prioridad según sea necesario
7. Responder directamente por email usando el botón integrado

## Filtros y Búsqueda

- **Búsqueda de texto**: Por nombre, email, empresa o mensaje
- **Filtro por estado**: new, read, replied, closed
- **Filtro por prioridad**: low, normal, high, urgent
- **Ordenamiento**: Por fecha de creación (más recientes primero)

## Archivos Modificados/Creados

1. `src/components/ContactForm.tsx` - Actualizado para guardar en Supabase
2. `src/components/ContactFormsManager.tsx` - Nuevo componente de gestión
3. `src/components/platform/PlatformDashboard.tsx` - Nueva pestaña agregada
4. `src/integrations/supabase/types.ts` - Tipos actualizados para contact_forms
5. `docs/CREATE_CONTACT_FORMS_TABLE.sql` - Script de creación de tabla
6. `docs/CONTACT_FORMS_SETUP.md` - Esta documentación

## Próximos Pasos Opcionales

1. **Notificaciones**: Implementar notificaciones en tiempo real para nuevos formularios
2. **Templates de email**: Crear plantillas predefinidas para respuestas
3. **Exportación**: Funcionalidad para exportar formularios a CSV/Excel
4. **Estadísticas**: Dashboard con métricas de formularios (conversión, tiempo de respuesta, etc.)
5. **Integración CRM**: Conectar con sistemas CRM externos

## Troubleshooting

### Error: "contact_forms table does not exist"
- Verificar que el script SQL se ejecutó correctamente en Supabase
- Comprobar que la tabla aparece en el Table Editor de Supabase

### Error: "Permission denied"
- Verificar que el usuario tiene rol 'superadmin' en la tabla user_roles
- Comprobar que las políticas RLS están correctamente configuradas

### Formularios no se muestran
- Verificar conexión a Supabase
- Comprobar que existen datos en la tabla contact_forms
- Revisar console del navegador para errores de JavaScript 