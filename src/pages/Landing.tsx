import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIChat } from '@/components/ui/AIChat';
import ContactForm from '@/components/ContactForm';
import { ArrowRight, Check, Star, Smartphone, Shield, Zap, Globe, Users, BarChart3, CreditCard, Sparkles, ChevronDown, X } from 'lucide-react';

const Landing = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, -300]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const cardsY = useTransform(scrollY, [0, 800], [0, -200]);
  const textY = useTransform(scrollY, [0, 600], [0, -100]);
  
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

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
    { name: "Yoga", icon: "🧘‍♀️" },
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
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial window width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:100px_100px] md:bg-[size:80px_80px] lg:bg-[size:100px_100px]"></div>
          </motion.div>
          
          {/* Floating orbs - Simplified animations */}
          <div className="hidden md:block">
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                x: [0, 20, 0],
                y: [0, 10, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-80 md:h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2],
                x: [0, -15, 0],
                y: [0, 15, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Particle system - Optimized for performance */}
          {[...Array(windowWidth > 768 ? 30 : 10)].map((_, i) => (
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

        {/* Floating cards ecosystem - Responsive positioning */}
        <motion.div 
          style={{ y: cardsY }}
          className="absolute inset-0 pointer-events-none z-10"
        >
          {/* Main hero card - Responsive positioning */}
          <motion.div
            className="absolute bottom-4 left-4 md:bottom-8 md:left-8"

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
            <Card className="w-48 h-32 sm:w-56 sm:h-36 md:w-64 md:h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-0 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl opacity-80 hover:opacity-100 transition-opacity duration-300">
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
              </div>
              
              <div className="relative p-3 sm:p-4 h-full flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <motion.div 
                      className="text-xs opacity-90 tracking-wider font-light"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      FYDELY
                    </motion.div>
                    <div className="text-sm sm:text-base md:text-lg font-black tracking-tight">LOYALTY</div>
                  </div>
                  <motion.div 
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </motion.div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <motion.div 
                      className="text-lg sm:text-xl font-black"
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
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl shadow-xl shadow-emerald-500/20"></div>
            </Card>
          </motion.div>

          {/* Satellite cards - Fixed number to avoid hook issues */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            // Only render the number of cards we want based on screen size
            const shouldRender = windowWidth > 1024 ? i < 6 : windowWidth > 640 ? i < 4 : i < 4;
            
            if (!shouldRender) return null;
            
            // Mobile: simpler positioning, Tablet/Desktop: circular
            const isMobile = windowWidth <= 640;
            
            let top, left;
            if (isMobile) {
              // Mobile: position cards in corners and sides
              const positions = [
                { top: '15%', left: '10%' },
                { top: '15%', left: '85%' },
                { top: '75%', left: '10%' },
                { top: '75%', left: '85%' }
              ];
              const positionIndex = i % 4;
              top = positions[positionIndex]?.top || '15%';
              left = positions[positionIndex]?.left || '10%';
            } else {
              // Tablet/Desktop: circular layout
              const angle = (i * Math.PI * 2) / (windowWidth > 1024 ? 6 : 4);
              const radius = windowWidth > 1024 ? 45 : 35;
              const centerX = 50;
              const centerY = 50;
              top = `${centerY + Math.sin(angle) * radius}%`;
              left = `${centerX + Math.cos(angle) * radius}%`;
            }
            
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top,
                  left,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 3, 0],
                  opacity: [0.6, 0.9, 0.6],
                  x: [0, Math.sin(i) * 5, 0],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              >
                <Card className="w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-16 lg:w-28 lg:h-18 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-emerald-500/30 rounded-lg sm:rounded-xl md:rounded-2xl backdrop-blur-xl shadow-lg">
                  <div className="p-1 sm:p-1.5 md:p-2 lg:p-2.5 h-full flex flex-col justify-between text-white">
                    <div className="font-medium opacity-75 text-xs">Cliente #{i + 1}</div>
                    <div className="font-bold text-emerald-400 text-xs">{Math.floor(Math.random() * 1000) + 100} pts</div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main content - Responsive typography and spacing */}
        <motion.div 
          style={{ y: textY, opacity: heroOpacity }}
          className="container mx-auto px-4 sm:px-6 text-center relative z-30 max-w-5xl"
        >
          {/* Logo badge - Responsive sizing */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <Badge variant="outline" className="px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base text-emerald-400 border-emerald-400/50 bg-emerald-400/10 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="hidden sm:inline">Próxima generación en fidelización</span>
              <span className="sm:hidden">Nueva generación</span>
            </Badge>
          </motion.div>

          {/* Epic title - Better mobile typography */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-4 sm:mb-6 leading-none tracking-tight"
          >
            <span className="block bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
              REWARD
            </span>
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
              LOYALTY
            </span>
            <motion.span 
              className="block text-white/80 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light mt-2 sm:mt-4 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              WITH ELEGANCE
            </motion.span>
          </motion.h1>

          {/* Subtitle - Larger mobile text */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-sm sm:max-w-2xl md:max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-0"
          >
            <span className="block sm:inline">Convierte cada transacción en una experiencia memorable.</span>
            <br className="hidden sm:block" />
            <span className="block sm:inline mt-2 sm:mt-0">
              <span className="text-emerald-400">La lealtad vive en su wallet.</span> El vínculo, en su corazón.
            </span>
          </motion.p>

          {/* CTA Buttons - Better proportioned for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4 sm:px-0"
          >
            <Button 
              size="lg" 
              onClick={() => setIsContactFormOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 text-base sm:text-lg md:text-xl rounded-xl sm:rounded-2xl group shadow-2xl shadow-emerald-500/25 border border-emerald-400/50"
            >
              Contacto
              <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator - Responsive positioning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 z-40"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-white/60"
          >
            <span className="text-xs sm:text-sm mb-2 font-light tracking-wider">DESCUBRE MÁS</span>
            <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.div>
        </motion.div>

        {/* Cursor follower effect - Disabled for stability */}

        {/* AI Chat Bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.5, type: "spring" }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="relative">
            {/* Chat bubble */}
            <motion.button
              onClick={() => setIsChatOpen(!isChatOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-2xl cursor-pointer flex items-center justify-center group hover:shadow-emerald-500/25 transition-all duration-300"
            >
              {/* AI Icon */}
              <motion.div
                animate={{ 
                  rotate: isChatOpen ? [0, 0, 0] : [0, 10, -10, 0],
                  scale: isChatOpen ? [1, 1, 1] : [1, 1.1, 1]
                }}
                transition={{ 
                  duration: isChatOpen ? 0.3 : 4,
                  repeat: isChatOpen ? 0 : Infinity,
                  ease: "easeInOut"
                }}
                className="text-white"
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
              
              {/* Pulse effect - only when closed */}
              {!isChatOpen && (
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping"></div>
              )}
              
              {/* Notification dot */}
              {!isChatOpen && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">!</span>
                </motion.div>
              )}
            </motion.button>
            
            {/* Tooltip - only show when closed */}
            {!isChatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-slate-900/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap backdrop-blur-sm border border-emerald-500/20"
              >
                ¿Tienes preguntas? ¡Pregúntame!
                <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-slate-900/90 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* AI Chat Component */}
        <AIChat isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
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

      {/* Cómo Funciona Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              Tan simple que
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                funciona solo
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Tres pasos para revolucionar tu programa de fidelización.
              Sin complicaciones, sin fricción.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl hover:bg-white/15 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <BarChart3 className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">Configurar</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Crea tu programa en 5 minutos. Define puntos, recompensas y diseña tu tarjeta con nuestra interfaz tipo Notion.
                </p>

                {/* Mini mockup */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-emerald-500/30 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-600 rounded w-1/2"></div>
                    <div className="h-2 bg-slate-600 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>

              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent"></div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl hover:bg-white/15 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <Smartphone className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">Distribuir</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Tus clientes escanean un QR y ¡listo! La tarjeta va directo a su wallet. Sin apps, sin registros complicados.
                </p>

                {/* QR Code mockup */}
                <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                  <div className="w-16 h-16 bg-black rounded grid grid-cols-8 gap-px p-1">
                    {[...Array(64)].map((_, i) => (
                      <div
                        key={i}
                        className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'} rounded-sm`}
                      />
                    ))}
                  </div>
                </div>
              </Card>

              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent"></div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl hover:bg-white/15 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <Zap className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">Analizar</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Ve en tiempo real cómo crece tu negocio. Métricas claras, insights accionables, ROI transparente.
                </p>

                {/* Analytics mockup */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-emerald-400 font-medium">Retención</span>
                    <span className="text-xs text-white font-bold">+89%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '89%' }}
                      transition={{ delay: 1, duration: 1.5 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-slate-300 mb-6">¿Listo para empezar?</p>
            <Button 
              size="lg" 
              onClick={() => setIsContactFormOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold px-8 py-4 text-lg rounded-xl group shadow-2xl shadow-emerald-500/25"
            >
              Contacto
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
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

      {/* Comparison Section */}
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
              Fydely vs
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                la competencia
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comparamos con Loyalzoo, Stamp Me, FiveStars y sistemas tradicionales.
              <br />La diferencia es clara: menos fricción, más resultados.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {/* Header */}
              <div className="grid grid-cols-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="p-6">
                  <h3 className="font-bold text-lg">Características</h3>
                </div>
                <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Fydely</h3>
                  </div>
                </div>
                <div className="p-6 text-center border-l border-slate-700">
                  <h3 className="font-bold text-lg opacity-75">Competencia</h3>
                </div>
                <div className="p-6 text-center border-l border-slate-700">
                  <h3 className="font-bold text-lg opacity-75">Sistemas Tradicionales</h3>
                </div>
              </div>

              {/* Comparison Rows */}
              {[
                {
                  feature: "Onboarding digital real",
                  fydely: "Instantáneo (5 min)",
                  apps: "Días/Semanas",
                  physical: "Días/Semanas"
                },
                {
                  feature: "Instalación física",
                  fydely: "No requiere",
                  apps: "Tablets, impresoras, beacons",
                  physical: "Tablets, impresoras, beacons"
                },
                {
                  feature: "Costo inicial",
                  fydely: "€0 / transparente",
                  apps: "Setup fee, cargos ocultos",
                  physical: "Setup fee, cargos ocultos"
                },
                {
                  feature: "Escalabilidad",
                  fydely: "Ilimitada, multi-local",
                  apps: "Limitada, con upgrades manuales",
                  physical: "Limitada, con upgrades manuales"
                },
                {
                  feature: "Fricción del usuario",
                  fydely: "Solo escanear QR / Wallet",
                  apps: "App, descarga, registro forzado",
                  physical: "Llevar cupón físico"
                },
                {
                  feature: "Analytics en tiempo real",
                  fydely: "Sí, dashboard 'live'",
                  apps: "Export o demora de 24h+",
                  physical: "Manual, muy limitado"
                },
                {
                  feature: "Integración Wallet/Apple",
                  fydely: true,
                  apps: false,
                  physical: false
                },
                {
                  feature: "Branding personalizable",
                  fydely: "Completo, por sucursal",
                  apps: "Parcial, depende del plan",
                  physical: "Solo diseño físico"
                },
                {
                  feature: "Actualizaciones",
                  fydely: "Automáticas SaaS",
                  apps: "Manual, requiere soporte técnico",
                  physical: "Reimprimir todo"
                },
                {
                  feature: "Push geolocalizado",
                  fydely: "Nativo en iOS/Wallet",
                  apps: "Solo en apps propias",
                  physical: false
                },
                {
                  feature: "Soporte",
                  fydely: "Directo, humano, rápido",
                  apps: "Call center, tickets lentos",
                  physical: "Limitado"
                },
                {
                  feature: "Contrato mínimo",
                  fydely: "No",
                  apps: "Sí, 6-12 meses habitual",
                  physical: "Sí, 6-12 meses habitual"
                }
              ].map((row, index) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className={`grid grid-cols-4 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} border-t border-slate-200`}
                >
                  <div className="p-6 font-medium text-slate-900">
                    {row.feature}
                  </div>
                  
                  {/* Fydely column */}
                  <div className="p-6 bg-emerald-50 border-l border-emerald-200 text-center">
                    {typeof row.fydely === 'boolean' ? (
                      row.fydely ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                          viewport={{ once: true }}
                          className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full"
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      )
                    ) : (
                      <span className="font-semibold text-emerald-700">{row.fydely}</span>
                    )}
                  </div>
                  
                  {/* Apps column */}
                  <div className="p-6 text-center border-l border-slate-200">
                    {typeof row.apps === 'boolean' ? (
                      row.apps ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      )
                    ) : (
                      <span className="text-slate-600">{row.apps}</span>
                    )}
                  </div>
                  
                  {/* Physical column */}
                  <div className="p-6 text-center border-l border-slate-200">
                    {typeof row.physical === 'boolean' ? (
                      row.physical ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      )
                    ) : (
                      <span className="text-slate-600">{row.physical}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Bottom Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8 mt-16"
            >
              <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  viewport={{ once: true }}
                  className="text-4xl font-black text-emerald-600 mb-2"
                >
                  0%
                </motion.div>
                <p className="text-slate-700 font-medium">Fricción de adopción vs competencia</p>
              </Card>
              
              <Card className="p-6 text-center bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  viewport={{ once: true }}
                  className="text-4xl font-black text-teal-600 mb-2"
                >
                  100%
                </motion.div>
                <p className="text-slate-700 font-medium">Wallet nativo (único en el mercado)</p>
              </Card>
              
              <Card className="p-6 text-center bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  viewport={{ once: true }}
                  className="text-4xl font-black text-cyan-600 mb-2"
                >
                  5min
                </motion.div>
                <p className="text-slate-700 font-medium">Setup vs semanas de la competencia</p>
              </Card>
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

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              Precios que
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                escalan contigo
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Desde startups hasta empresas. Sin sorpresas, sin letra pequeña.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-slate-700 rounded-2xl hover:border-emerald-500/50 transition-all duration-300 h-full">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Starter</h3>
                  <p className="text-slate-400 mb-6">Perfecto para empezar</p>
                  <div className="mb-6">
                    <span className="text-5xl font-black">$49</span>
                    <span className="text-slate-400">/mes</span>
                  </div>
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    Empezar gratis
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {[
                    "Hasta 200 clientes activos",
                    "1 ubicación",
                    "Tarjetas básicas",
                    "Analytics esenciales",
                    "Soporte por email"
                  ].map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Growth Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="group relative"
            >
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 text-sm font-medium">
                  Más Popular
                </Badge>
              </div>
              
              <Card className="p-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border-2 border-emerald-500 rounded-2xl hover:scale-105 transition-all duration-300 h-full">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Growth</h3>
                  <p className="text-slate-300 mb-6">Para negocios en crecimiento</p>
                  <div className="mb-6">
                    <span className="text-5xl font-black">$149</span>
                    <span className="text-slate-400">/mes</span>
                  </div>
                  <Button 
                    onClick={() => setIsContactFormOpen(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold"
                  >
                    Contacto
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {[
                    "Hasta 1000 clientes activos",
                    "3 ubicaciones",
                    "Tarjetas personalizadas",
                    "Analytics avanzados",
                    "Integración POS",
                    "Campañas automáticas",
                    "Soporte prioritario"
                  ].map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-white">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-slate-700 rounded-2xl hover:border-emerald-500/50 transition-all duration-300 h-full">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <p className="text-slate-400 mb-6">Solución completa</p>
                  <div className="mb-6">
                    <span className="text-5xl font-black">Custom</span>
                  </div>
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    Contactar ventas
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {[
                    "Clientes ilimitados",
                    "Ubicaciones ilimitadas",
                    "Marca blanca completa",
                    "API dedicada",
                    "Integraciones custom",
                    "Account manager",
                    "SLA garantizado"
                  ].map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ROI Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">Calculadora de ROI</h3>
                <p className="text-slate-300">Ve cuánto puedes ahorrar y ganar con Fydely</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Input side */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Clientes mensuales promedio
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      defaultValue="1000"
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>100</span>
                      <span className="font-bold text-emerald-400">1,000</span>
                      <span>5,000</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Ticket promedio (€)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      defaultValue="25"
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>$10</span>
                      <span className="font-bold text-emerald-400">$25</span>
                      <span>$200</span>
                    </div>
                  </div>
                </div>

                {/* Results side */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/30">
                  <h4 className="text-xl font-bold mb-4 text-center">Tu ROI con Fydely</h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Revenue adicional/mes:</span>
                      <span className="text-2xl font-bold text-emerald-400">$7,500</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Costo Fydely:</span>
                      <span className="text-lg font-semibold">$99</span>
                    </div>
                    
                    <div className="border-t border-slate-600 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">ROI mensual:</span>
                        <span className="text-3xl font-black text-emerald-400">7,576%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-400">
                      *Basado en +30% retención y +15% frecuencia de visita
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Bottom guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Shield className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-semibold">Garantía de 30 días</span>
            </div>
            <p className="text-slate-400">
              Si no ves resultados en 30 días, te devolvemos el 100% de tu dinero.
            </p>
          </motion.div>
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
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={() => setIsContactFormOpen(true)}
                className="bg-white text-emerald-600 hover:bg-slate-50 px-8 py-6 text-lg rounded-xl group"
              >
                Contacto
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                Ver casos de éxito
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Inteligente Section */}
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
              Preguntas
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> frecuentes</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Todo lo que necesitas saber sobre Fydely. ¿No encuentras tu respuesta?
            </p>
            
            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-md mx-auto mb-8"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en FAQ..."
                  className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {/* FAQ Accordion */}
            <div className="space-y-4">
              {[
                {
                  question: "¿Cómo funciona exactamente la integración con el wallet?",
                  answer: "Cuando un cliente escanea el QR, automáticamente se genera una tarjeta digital compatible con Apple Wallet y Google Pay. No necesita descargar ninguna app adicional. La tarjeta se actualiza en tiempo real con puntos, ofertas y notificaciones."
                },
                {
                  question: "¿Qué sistemas POS son compatibles?",
                  answer: "Fydely se integra con los principales sistemas POS como Square, Toast, Lightspeed, Shopify POS, y muchos más. También ofrecemos una API REST para integraciones personalizadas. El proceso de integración típicamente toma menos de 24 horas."
                },
                {
                  question: "¿Puedo personalizar completamente el diseño de las tarjetas?",
                  answer: "Absolutamente. Puedes personalizar colores, logos, imágenes de fondo, y toda la información mostrada. En el plan Growth y Enterprise también incluimos opciones de marca blanca completa para que la experiencia sea 100% tuya."
                },
                {
                  question: "¿Cómo se manejan los datos de mis clientes?",
                  answer: "Todos los datos están encriptados y almacenados en servidores seguros con certificación SOC2. Cumplimos con GDPR y CCPA. Tus clientes mantienen control total sobre sus datos y pueden exportar o eliminar su información en cualquier momento."
                },
                {
                  question: "¿Hay límites en el número de campañas o promociones?",
                  answer: "En el plan Starter tienes hasta 5 campañas activas. Growth incluye campañas ilimitadas y automatizaciones avanzadas. Enterprise añade segmentación AI y campañas predictivas basadas en comportamiento."
                },
                {
                  question: "¿Qué pasa si mis clientes cambian de teléfono?",
                  answer: "Las tarjetas se sincronizan automáticamente con la cuenta de iCloud o Google del usuario. Al configurar su nuevo dispositivo, todas sus tarjetas de lealtad aparecen automáticamente. Cero fricción para el cliente."
                },
                {
                  question: "¿Ofrecen soporte durante la implementación?",
                  answer: "Sí, todos los planes incluyen onboarding guiado. Growth y Enterprise incluyen soporte prioritario y un customer success manager dedicado. También tenemos documentación completa y tutoriales en video."
                },
                {
                  question: "¿Puedo migrar desde mi sistema actual de fidelización?",
                  answer: "Definitivamente. Nuestro equipo te ayuda a migrar todos tus datos existentes: clientes, puntos acumulados, historial de compras. El proceso es transparente para tus clientes - mantienen todos sus beneficios."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="border border-slate-200 hover:border-emerald-300 transition-all duration-300 overflow-hidden">
                    <motion.button
                      className="w-full p-6 text-left focus:outline-none"
                      whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.02)" }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 pr-4">
                          {faq.question}
                        </h3>
                        <motion.div
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0"
                        >
                          <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                        </motion.div>
                      </div>
                    </motion.button>
                    
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      whileInView={{ height: "auto", opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                      viewport={{ once: true }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <p className="text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* AI Chat CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">¿Tienes más preguntas?</h3>
                    <p className="text-slate-600">Nuestro asistente IA está aquí para ayudarte</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setIsChatOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold px-6 py-3 rounded-xl group"
                >
                  <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Preguntar al asistente IA
                </Button>
                
                <p className="text-sm text-slate-500 mt-4">
                  Respuestas instantáneas • Disponible 24/7 • Conocimiento experto en fidelización
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Fydely is Different Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-800 text-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              Lo que nos hace
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                únicos
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Mientras otros se enfocan en apps o cupones, nosotros revolucionamos 
              la experiencia con tecnología wallet nativa.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Unique Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl hover:bg-white/15 transition-all duration-300 h-full">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <Smartphone className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">Wallet Nativo Real</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  <strong className="text-emerald-400">Únicos en el mercado:</strong> Integración 100% nativa con Apple Wallet y Google Pay. 
                  No apps que descargar, no registros complicados.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Push notifications geolocalizado nativo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Actualización automática en tiempo real</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Cero fricción de adopción</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Unique Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl hover:bg-white/15 transition-all duration-300 h-full">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <Zap className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">Setup Instantáneo</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  <strong className="text-emerald-400">5 minutos vs semanas:</strong> Mientras la competencia requiere 
                  instalaciones físicas y configuraciones complejas, tú estás operativo al instante.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Sin hardware físico requerido</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Sin contratos mínimos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Costo inicial: €0</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Unique Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="p-8 bg-white/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl hover:bg-white/15 transition-all duration-300 h-full">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <BarChart3 className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">Analytics en Vivo</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  <strong className="text-emerald-400">Dashboard "live":</strong> Mientras otros exportan datos con 24h+ de retraso, 
                  tú ves el impacto en tiempo real.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Métricas instantáneas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">ROI transparente</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Insights accionables</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Competitive Advantage Statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Card className="p-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/50 rounded-2xl max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-white">
                La diferencia es clara
              </h3>
              <p className="text-lg text-slate-200 leading-relaxed">
                Mientras <strong>Loyalzoo, FiveStars y Stamp Me</strong> siguen dependiendo de apps que nadie quiere descargar, 
                tablets que se rompen y configuraciones que toman semanas, <strong className="text-emerald-400">Fydely</strong> 
                aprovecha la tecnología que ya está en el bolsillo de cada cliente: <strong>su wallet nativo</strong>.
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setIsContactFormOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold px-8 py-4 text-lg rounded-xl group shadow-2xl shadow-emerald-500/25"
                >
                  Contacto
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
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

      {/* Contact Form */}
      <ContactForm 
        isOpen={isContactFormOpen} 
        onClose={() => setIsContactFormOpen(false)} 
      />
    </div>
  );
};

export default Landing; 