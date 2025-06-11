# 🚀 Configuración de Variables de Entorno en Netlify

## ❌ Problema Actual
Las variables de entorno **VITE_SUPABASE_URL** y **VITE_SUPABASE_ANON_KEY** no están configuradas en Netlify, causando que la aplicación no funcione.

## ✅ Solución: Configurar Variables en Netlify

### Paso 1: Acceder a la Configuración del Sitio
1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio (RestaurantLoyalty)
3. Ve a **Site settings** → **Environment variables**

### Paso 2: Agregar Variables Requeridas
Haz clic en **Add environment variable** y agrega estas dos variables:

| Variable Name | Valor de Ejemplo | Descripción |
|---------------|------------------|-------------|
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Clave anónima de Supabase |

### Paso 3: Obtener las Credenciales de Supabase
1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **URL**: Para `VITE_SUPABASE_URL`
   - **anon public key**: Para `VITE_SUPABASE_ANON_KEY`

### Paso 4: Configurar en Netlify
```
Variable name: VITE_SUPABASE_URL
Value: https://xyzabc123.supabase.co
Scopes: All deploys
```

```
Variable name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpbnp...
Scopes: All deploys
```

### Paso 5: Trigger Nueva Build
1. Ve a **Deploys** en tu sitio de Netlify
2. Haz clic en **Trigger deploy** → **Deploy site**
3. Espera a que complete el build

## 🔍 Verificación

### Script de Diagnóstico
Puedes usar este comando para verificar localmente:

```bash
# Simular build de Netlify con variables
VITE_SUPABASE_URL=tu_url VITE_SUPABASE_ANON_KEY=tu_key npm run build
```

### Después del Deploy
1. Abre la consola del navegador en tu sitio
2. Deberías ver: `✅ Supabase environment variables found successfully`
3. **NO** deberías ver: `🚨 SUPABASE ENV VARS DEBUG`

## ⚠️ Errores Comunes

### Error: "Missing Supabase environment variables"
- **Causa**: Variables no configuradas en Netlify
- **Solución**: Seguir Paso 2 arriba

### Error: "Invalid API key"
- **Causa**: Clave incorrecta o copiada mal
- **Solución**: Re-copiar desde Supabase Dashboard

### Error: "Network request failed"
- **Causa**: URL incorrecta
- **Solución**: Verificar URL en Supabase Dashboard

## 📋 Checklist Final

- [ ] Variables agregadas en Netlify Site Settings
- [ ] Build triggered después de agregar variables
- [ ] No hay errores en la consola del navegador
- [ ] App carga correctamente
- [ ] Funcionalidad de login/logout funciona

## 🆘 Si Sigue Sin Funcionar

1. Revisa la build log en Netlify para errores
2. Verifica que las variables estén en "All deploys" scope
3. Confirma que los valores no tengan espacios extras
4. Intenta hacer una nueva build desde cero 