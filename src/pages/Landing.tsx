import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, Check, Star, Smartphone, Shield, Zap, Globe, Users, BarChart3, CreditCard, Sparkles, ChevronDown } from 'lucide-react';

const Landing = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, -300]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const cardsY = useTransform(scrollY, [0, 800], [0, -200]);
  const textY = useTransform(scrollY, [0, 600], [0, -100]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const testimonials = [
    {
      quote: "Nos olvidamos de cupones. Ahora fidelizamos como Apple.",
      author: "María González",
      business: "Café Artesano",
      rating: 5
    },
    {
      quote: "El cliente recibe la tarjeta, sonríe y vuelve.",
      author: "Carlos Mendoza",
      business: "Salón Élite",
      rating: 5
    },
    {
      quote: "La experiencia es tan fluida que nuestros clientes se sorprenden gratamente.",
      author: "Ana Rodríguez",
      business: "Yoga Studio Zen",
      rating: 5
    }
  ];

  const verticals = [
    { name: "Restaurantes", icon: "🍽️" },
    { name: "Cafés", icon: "☕" },
    { name: "Peluquerías", icon: "✂️" },
    { name: "Clínicas", icon: "🏥" },
    { name: "Estudios de yoga", icon: "🧘‍♀️" },
    { name: "Floristerías", icon: "🌸" },
    { name: "Boutiques", icon: "👗" },
    { name: "Spas", icon: "💆‍♀️" }
  ];

  const features = [
    {
      title: "Multi-tenant architecture",
      description: "Infraestructura escalable para cualquier tamaño de negocio",
      icon: <Globe className="h-6 w-6" />
    },
    {
      title: "Roles jerárquicos",
      description: "Gestión granular de permisos y accesos",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Marca blanca",
      description: "Personalización completa con tu identidad",
      icon: <Sparkles className="h-6 w-6" />
    },
    {
      title: "API-first",
      description: "Integración perfecta con tus sistemas existentes",
      icon: <Zap className="h-6 w-6" />
    },
    {
      title: "Integración con POS",
      description: "Conexión directa con tu punto de venta",
      icon: <CreditCard className="h-6 w-6" />
    },
    {
      title: "Analytics avanzado",
      description: "Insights profundos sobre comportamiento del cliente",
      icon: <BarChart3 className="h-6 w-6" />
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x * 50);
      mouseY.set(y * 50);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background - Lowest layer */}
        <div className="absolute inset-0 z-0">
          {/* Primary gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-black"></div>
          
          {/* Animated grid */}
          <motion.div 
            style={{ y: heroY }}
            className="absolute inset-0 opacity-30"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          </motion.div>
          
          {/* Floating orbs */}
          <motion.div
            style={{ x: springX, y: springY }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            style={{ x: useTransform(springX, x => -x * 0.5), y: useTransform(springY, y => -y * 0.5) }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Particle system */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/60 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Floating cards ecosystem - Middle layer */}
        <motion.div 
          style={{ y: cardsY }}
          className="absolute inset-0 pointer-events-none z-10"
        >
          {/* Main hero card - positioned safely away from interactive elements */}
          <motion.div
            className="absolute bottom-8 left-8"
            style={{ 
              x: useTransform(springX, x => x * 0.1), 
              y: useTransform(springY, y => y * 0.1) 
            }}
            animate={{
              rotateY: [0, 2, -2, 0],
              z: [0, 20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Card className="w-64 h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl opacity-80 hover:opacity-100 transition-opacity duration-300">
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
              </div>
              
              <div className="relative p-4 h-full flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <motion.div 
                      className="text-xs opacity-90 tracking-wider font-light"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      FYDELY
                    </motion.div>
                    <div className="text-lg font-black tracking-tight">LOYALTY</div>
                  </div>
                  <motion.div 
                    className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Smartphone className="h-4 w-4" />
                  </motion.div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <motion.div 
                      className="text-xl font-black"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      1,247
                    </motion.div>
                    <div className="text-xs opacity-90 font-light">Puntos acumulados</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">Próxima recompensa</div>
                    <div className="text-xs opacity-75">253 puntos más</div>
                  </div>
                </div>
              </div>
              
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-3xl shadow-xl shadow-emerald-500/20"></div>
            </Card>
          </motion.div>

          {/* Satellite cards - positioned in circular pattern around hero content */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * Math.PI * 2) / 6; // Distribute in perfect circle
            const radius = 45; // Distance from center
            const centerX = 50; // Center X percentage
            const centerY = 50; // Center Y percentage
            
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${centerY + Math.sin(angle) * radius}%`,
                  left: `${centerX + Math.cos(angle) * radius}%`,
                  x: useTransform(springX, x => x * (0.1 + i * 0.02)),
                  y: useTransform(springY, y => y * (0.1 + i * 0.02)),
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 3, 0],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              >
                <Card className="w-28 h-18 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-emerald-500/30 rounded-2xl backdrop-blur-xl shadow-lg">
                  <div className="p-2.5 h-full flex flex-col justify-between text-white text-xs">
                    <div className="font-medium opacity-75">Cliente #{i + 1}</div>
                    <div className="font-bold text-emerald-400">{Math.floor(Math.random() * 1000) + 100} pts</div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main content - Top layer */}
        <motion.div 
          style={{ y: textY, opacity: heroOpacity }}
          className="container mx-auto px-6 text-center relative z-30 max-w-5xl"
        >
          {/* Logo badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <Badge variant="outline" className="px-6 py-2 text-emerald-400 border-emerald-400/50 bg-emerald-400/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Próxima generación en fidelización
            </Badge>
          </motion.div>

          {/* Epic title with glow effect */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-none tracking-tight"
          >
            <span className="block bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
              REWARD
            </span>
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
              LOYALTY
            </span>
            <motion.span 
              className="block text-white/80 text-2xl md:text-3xl lg:text-4xl font-light mt-4 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              WITH ELEGANCE
            </motion.span>
          </motion.h1>

          {/* Subtitle with typewriter effect */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg md:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Convierte cada transacción en una experiencia memorable. 
            <br />
            <span className="text-emerald-400">La lealtad vive en su wallet.</span> El vínculo, en su corazón.
          </motion.p>

          {/* CTA Buttons with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold px-10 py-6 text-xl rounded-2xl group shadow-2xl shadow-emerald-500/25 border border-emerald-400/50"
            >
              Solicita una demo
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="text-white border-2 border-white/20 hover:border-emerald-400/50 hover:bg-emerald-400/10 px-10 py-6 text-xl rounded-2xl group backdrop-blur-sm"
            >
              <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
              Ver cómo funciona
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator - High layer but positioned at bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-white/60"
          >
            <span className="text-sm mb-2 font-light tracking-wider">DESCUBRE MÁS</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>

        {/* Cursor follower effect - Highest layer */}
        <motion.div
          className="fixed w-4 h-4 bg-emerald-400/60 rounded-full pointer-events-none z-50 mix-blend-difference"
          style={{
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
          }}
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 0.3,
          }}
        />
      </section>

      {/* Universal by Design Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Una sola plataforma para
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                miles de experiencias
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Fydely se adapta al flujo, estilo y operación de cualquier negocio. 
              Cada cliente, una historia. Cada visita, una oportunidad.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {verticals.map((vertical, index) => (
              <motion.div
                key={vertical.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="p-6 text-center bg-white/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {vertical.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800">{vertical.name}</h3>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Swiss Precision Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Diseñado con
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                precisión suiza
              </span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Dashboard visual y limpio</h3>
                    <p className="text-slate-600">Métricas importantes al alcance de un vistazo, con diseño intuitivo.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Creador de campañas tipo Notion</h3>
                    <p className="text-slate-600">Diseña recompensas y promociones con una interfaz familiar y potente.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Vista de tarjetas activas</h3>
                    <p className="text-slate-600">Monitorea el engagement de cada cliente en tiempo real.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative">
                {/* Main Dashboard Mock */}
                <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden border-0">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="ml-4 text-white text-sm font-medium">Fydely Dashboard</div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-emerald-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">1,247</div>
                        <div className="text-xs text-emerald-600">Clientes activos</div>
                      </div>
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">89%</div>
                        <div className="text-xs text-teal-600">Retention</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-slate-600">€24.3K</div>
                        <div className="text-xs text-slate-600">Revenue</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-3/4"></div>
                      </div>
                      <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full w-1/2"></div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Floating Elements */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl shadow-lg flex items-center justify-center"
                >
                  <Star className="h-8 w-8 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Wallet Integration Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold mb-8">
                La tarjeta vive en
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  el wallet
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Sin apps, sin fricción. Tus clientes reciben y usan su tarjeta directamente desde su wallet. 
                Check-ins, puntos y recompensas, todo fluye.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg">Más engagement sin instalar nada</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg">100% mobile-native</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg">Push notifications nativas</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* iPhone Mockup */}
              <div className="relative mx-auto w-64">
                <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-white px-6 py-2 flex justify-between items-center text-black text-sm">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-2 bg-black rounded-sm"></div>
                        <div className="w-6 h-3 border border-black rounded-sm">
                          <div className="w-4 h-1 bg-black rounded-xs m-0.5"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Wallet Interface */}
                    <div className="px-4 py-6 bg-gray-100 min-h-[500px]">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-black">Wallet</h3>
                      </div>
                      
                      {/* Fydely Card in Wallet */}
                      <motion.div
                        animate={{ 
                          y: [0, -5, 0],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="mb-4"
                      >
                        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 border-0 rounded-2xl overflow-hidden shadow-lg">
                          <div className="p-4 text-white">
                            <div className="flex justify-between items-start mb-8">
                              <div>
                                <div className="text-xs opacity-90">FYDELY</div>
                                <div className="text-lg font-bold">Café Artesano</div>
                              </div>
                              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                <CreditCard className="h-3 w-3" />
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-2xl font-bold">1,247</div>
                                <div className="text-xs opacity-90">Puntos</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">Próxima recompensa</div>
                                <div className="text-xs opacity-90">253 puntos más</div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                      
                      {/* Other cards */}
                      <div className="space-y-2 opacity-50">
                        <div className="h-12 bg-blue-500 rounded-xl"></div>
                        <div className="h-12 bg-purple-500 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -top-4 -left-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="text-sm font-medium">¡Puntos añadidos!</div>
                <div className="text-xs opacity-90">+50 puntos por tu visita</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enterprise Power Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Potencia empresarial
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                invisible
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Para startups independientes o redes multinivel.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Testimonios
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> vivos</span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Card className="p-8 bg-white/80 backdrop-blur border-0 shadow-xl">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial]?.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-2xl font-medium text-slate-900 mb-6 italic">
                  "{testimonials[currentTestimonial]?.quote || ''}"
                </blockquote>
                <div>
                  <div className="font-semibold text-slate-900">{testimonials[currentTestimonial]?.author || ''}</div>
                  <div className="text-slate-600">{testimonials[currentTestimonial]?.business || ''}</div>
                </div>
              </Card>
            </motion.div>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-emerald-600 scale-125' 
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-8">
              Empieza a construir relaciones memorables.
              <br />
              Fydely está listo.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-slate-50 px-8 py-6 text-lg rounded-xl group">
                Quiero una demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                Ver casos de éxito
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="mb-8">
              <div className="text-2xl font-bold mb-4">FYDELY</div>
              <p className="text-slate-400 max-w-md mx-auto">
                Tu cliente en su bolsillo. Tu marca en su corazón.
              </p>
            </div>
            
            <div className="flex justify-center space-x-8 mb-8">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Platform</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">API</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Docs</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">LinkedIn</a>
            </div>
            
            <motion.div
              animate={{ 
                scaleX: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto max-w-md mb-8"
            />
            
            <p className="text-slate-500 text-sm">
              © 2024 Fydely. Designed with precision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 