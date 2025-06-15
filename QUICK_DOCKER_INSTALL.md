# 🐳 INSTALACIÓN RÁPIDA DE DOCKER

## 🎯 **PROBLEMA ACTUAL**

Tu aplicación funciona perfectamente, pero **no puedes crear clientes** porque las Edge Functions no están desplegadas. El error que ves:

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://sosdnyzzhzowoxsztgol.supabase.co/functions/v1/create-client. (Reason: CORS request did not succeed). Status code: (null).
```

**Causa**: Las Edge Functions necesitan Docker para desplegarse.

## 🚀 **SOLUCIÓN: INSTALAR DOCKER (15 minutos)**

### **OPCIÓN 1: Docker Desktop (Recomendado)**

#### **Para Fedora Linux:**
```bash
# 1. Descargar Docker Desktop
wget https://desktop.docker.com/linux/main/amd64/docker-desktop-4.26.1-x86_64.rpm

# 2. Instalar
sudo dnf install ./docker-desktop-4.26.1-x86_64.rpm

# 3. Iniciar Docker Desktop
systemctl --user start docker-desktop

# 4. Habilitar auto-inicio
systemctl --user enable docker-desktop
```

#### **Verificar instalación:**
```bash
docker --version
docker ps
```

### **OPCIÓN 2: Docker Engine (Más ligero)**

```bash
# 1. Agregar repositorio Docker
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# 2. Instalar Docker
sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# 4. Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# 5. Reiniciar sesión o ejecutar:
newgrp docker
```

## ⚡ **DESPUÉS DE INSTALAR DOCKER**

### **1. Verificar Docker funciona:**
```bash
docker run hello-world
```

### **2. Desplegar Edge Functions:**
```bash
cd /home/martin/ZerionStudio/ZerionStudioBusiness/Softwares/RestoLoyal/RestaurantLoyalty
./deploy-edge-functions-current.sh
```

### **3. Verificar despliegue:**
```bash
./test-complete-system.sh
```

### **4. Probar creación de cliente:**
- Abrir: https://fydely.com (tu aplicación)
- Intentar crear un cliente desde superadmin
- ¡Debería funcionar!

## 🔧 **ALTERNATIVA SIN DOCKER (Temporal)**

Si no puedes instalar Docker ahora, puedes usar la **Supabase Dashboard** para crear datos manualmente:

### **1. Ir a Supabase Dashboard:**
https://supabase.com/dashboard/project/sosdnyzzhzowoxsztgol

### **2. Crear cliente manualmente:**
```sql
-- En SQL Editor de Supabase
INSERT INTO clients (name, slug, business_type, email, phone, status) 
VALUES ('Test Restaurant', 'test-restaurant', 'restaurant', 'test@example.com', '+1234567890', 'active');
```

### **3. Crear admin del cliente:**
```sql
-- Primero crear usuario en Auth (desde Dashboard)
-- Luego agregar a client_admins
INSERT INTO client_admins (user_id, client_id, name, email, phone, is_active)
VALUES ('user-id-from-auth', 'client-id-from-above', 'Test Admin', 'admin@test.com', '+1234567891', true);
```

## 📊 **COMPARACIÓN DE OPCIONES**

| Método | Tiempo | Dificultad | Funcionalidad |
|--------|--------|------------|---------------|
| **Docker Desktop** | 15 min | Fácil | 100% completa |
| **Docker Engine** | 10 min | Medio | 100% completa |
| **Manual DB** | 5 min | Fácil | 70% limitada |

## 🎯 **RECOMENDACIÓN**

**Instala Docker Desktop** - Es la solución más completa y te permitirá:
- ✅ Desplegar las 6 Edge Functions
- ✅ Funcionalidad completa de la aplicación
- ✅ Testing completo
- ✅ Desarrollo futuro sin limitaciones

## 📞 **SOPORTE**

### **Si Docker falla:**
```bash
# Verificar estado
sudo systemctl status docker

# Reiniciar Docker
sudo systemctl restart docker

# Ver logs
sudo journalctl -u docker.service
```

### **Si Edge Functions fallan:**
```bash
# Verificar Supabase CLI
supabase --version

# Re-login
supabase login

# Intentar despliegue nuevamente
./deploy-edge-functions-current.sh
```

## ⏰ **TIEMPO ESTIMADO TOTAL**

- **Instalación Docker**: 15 minutos
- **Despliegue Edge Functions**: 5 minutos
- **Testing completo**: 5 minutos
- **Total**: **25 minutos para funcionalidad 100%**

---

**🎯 Una vez instalado Docker, tu aplicación funcionará completamente y podrás crear clientes sin problemas.** 