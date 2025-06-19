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