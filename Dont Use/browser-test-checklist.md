# 🌐 BROWSER TESTING CHECKLIST

## 📋 **PRUEBAS MANUALES EN NAVEGADOR**

### **PASO 1: Abrir la Aplicación**
- [ ] Abrir: http://localhost:8081
- [ ] La página carga sin errores
- [ ] No hay errores en la consola del navegador

### **PASO 2: Verificar Variables de Entorno**
- [ ] Abrir Developer Tools (F12)
- [ ] Ir a la pestaña **Console**
- [ ] Buscar el mensaje: `🔍 Environment Debug Info:`
- [ ] Verificar que aparezca:
  ```
  ✅ Supabase environment variables are configured correctly
  ```

### **PASO 3: Verificar Componente Debug**
- [ ] En la esquina inferior derecha debe aparecer un cuadro negro con:
  ```
  🔍 Environment Debug
  Mode: development
  Supabase URL: ✅
  Anon Key: ✅
  Check browser console for details
  ```

### **PASO 4: Navegación Básica**
- [ ] La página de landing carga correctamente
- [ ] Los enlaces de navegación funcionan
- [ ] No hay errores 404 en recursos (CSS, JS, imágenes)

### **PASO 5: Autenticación (Si está configurada)**
- [ ] Ir a la página de login/auth
- [ ] El formulario de login aparece
- [ ] No hay errores de Supabase client

### **PASO 6: Dashboard (Si tienes acceso)**
- [ ] Intentar acceder al dashboard
- [ ] Verificar que los componentes cargan
- [ ] Revisar si hay errores de API en la consola

## 🚨 **ERRORES COMUNES Y SOLUCIONES**

### **Error: "VITE_SUPABASE_URL is undefined"**
**Solución**: Variables de entorno no configuradas
```bash
# Verificar archivo .env.local existe
ls -la .env.local

# Verificar contenido
cat .env.local
```

### **Error: "Failed to fetch" o CORS**
**Solución**: Edge Functions no desplegadas
```bash
# Desplegar Edge Functions
./deploy-edge-functions-current.sh
```

### **Error: "Network Error" en requests**
**Solución**: Supabase URL incorrecta o servicio caído
- Verificar URL en .env.local
- Verificar estado de Supabase

## 📊 **RESULTADOS ESPERADOS**

### **✅ TODO FUNCIONANDO:**
```
Console Output:
🔍 Environment Debug Info:
- MODE: development
- DEV: true
- PROD: false
- VITE_SUPABASE_URL: https://sosdnyzzhzowoxsztgol.supabase.co...
- VITE_SUPABASE_ANON_KEY: SET
- All VITE_ vars: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]
✅ Supabase environment variables are configured correctly
```

### **⚠️ EDGE FUNCTIONS NO DESPLEGADAS:**
```
Console Output:
❌ Error creating client: Error: Failed to send a request to the Edge Function
CORS Preflight Did Not Succeed
Status code: 404
```

## 🎯 **PRÓXIMOS PASOS SEGÚN RESULTADOS**

### **Si Frontend funciona pero Edge Functions fallan:**
1. Hacer login en Supabase: `supabase login`
2. Desplegar funciones: `./deploy-edge-functions-current.sh`
3. Configurar service role key
4. Probar nuevamente

### **Si Variables de Entorno fallan:**
1. Verificar .env.local
2. Reiniciar servidor de desarrollo
3. Verificar sintaxis del archivo

### **Si Supabase Connection falla:**
1. Verificar URL y anon key
2. Verificar estado de Supabase
3. Verificar firewall/proxy

## 📞 **SOPORTE**

Si encuentras errores no listados aquí:
1. Copia el error completo de la consola
2. Ejecuta: `./test-complete-system.sh`
3. Comparte los resultados para diagnóstico 