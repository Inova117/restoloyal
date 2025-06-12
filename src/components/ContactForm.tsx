import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  X, 
  Phone, 
  Mail, 
  Building, 
  Users, 
  Calendar, 
  Send, 
  Check,
  Sparkles,
  Clock
} from 'lucide-react';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactForm({ isOpen, onClose }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    businessType: '',
    numberOfLocations: '',
    message: '',
    preferredContactTime: ''
  });

  const businessTypes = [
    'Restaurante/Cafetería',
    'Salón de Belleza/Peluquería',
    'Clínica/Consultorio Médico',
    'Tienda de Ropa/Boutique',
    'Spa/Centro de Bienestar',
    'Gimnasio/Centro Deportivo',
    'Panadería/Pastelería',
    'Farmacia',
    'Floristería',
    'Otro'
  ];

  const locationOptions = [
    '1 ubicación',
    '2-5 ubicaciones',
    '6-10 ubicaciones',
    '11-25 ubicaciones',
    '26-50 ubicaciones',
    'Más de 50 ubicaciones'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form data:', formData);
      
      setIsSubmitted(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Te contactaremos dentro de las próximas 24 horas.",
      });

      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          businessType: '',
          numberOfLocations: '',
          message: '',
          preferredContactTime: ''
        });
        onClose();
      }, 3000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 border-emerald-500/20 shadow-2xl">
              <CardHeader className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute right-4 top-4 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="text-center space-y-2">
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 bg-emerald-400/10">
                    <Sparkles className="w-3 h-3 mr-2" />
                    Solicitud de Acceso
                  </Badge>
                  
                  <CardTitle className="text-3xl font-bold text-white">
                    ¿Listo para revolucionar
                    <span className="block text-emerald-400">tu programa de fidelización?</span>
                  </CardTitle>
                  
                  <CardDescription className="text-slate-300 text-lg">
                    Completa este formulario y te contactaremos en menos de 24 horas para 
                    agendar una demo personalizada de Fydely.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 space-y-4"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mx-auto"
                    >
                      <Check className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white">¡Solicitud Enviada!</h3>
                    <p className="text-slate-300">
                      Hemos recibido tu información. Nuestro equipo se pondrá en contacto contigo 
                      dentro de las próximas 24 horas para agendar una demo personalizada.
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Cerrando automáticamente...</span>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          Nombre Completo *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Tu nombre completo"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-emerald-400" />
                          Email Corporativo *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="tu.email@empresa.com"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-400" />
                          Teléfono *
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-white flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-400" />
                          Empresa *
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder="Nombre de tu empresa"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Tipo de Negocio *</Label>
                        <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue placeholder="Selecciona tu industria" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Número de Ubicaciones *</Label>
                        <Select value={formData.numberOfLocations} onValueChange={(value) => handleInputChange('numberOfLocations', value)}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue placeholder="¿Cuántas ubicaciones tienes?" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {locationOptions.map((option) => (
                              <SelectItem key={option} value={option} className="text-white hover:bg-slate-700">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Mejor Horario para Contactarte
                      </Label>
                      <Select value={formData.preferredContactTime} onValueChange={(value) => handleInputChange('preferredContactTime', value)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue placeholder="Selecciona tu preferencia" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="morning" className="text-white hover:bg-slate-700">Mañana (9:00 - 12:00)</SelectItem>
                          <SelectItem value="afternoon" className="text-white hover:bg-slate-700">Tarde (12:00 - 17:00)</SelectItem>
                          <SelectItem value="evening" className="text-white hover:bg-slate-700">Noche (17:00 - 20:00)</SelectItem>
                          <SelectItem value="flexible" className="text-white hover:bg-slate-700">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white">Mensaje Adicional</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Cuéntanos más sobre tus necesidades, objetivos, o cualquier pregunta específica..."
                        rows={4}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold py-4 text-lg rounded-xl shadow-lg shadow-emerald-500/25"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full mr-2"
                        />
                      ) : (
                        <Send className="w-5 h-5 mr-2" />
                      )}
                      {isSubmitting ? 'Enviando...' : 'Solicitar Demo Gratuita'}
                    </Button>

                    <p className="text-sm text-slate-400 text-center">
                      Al enviar este formulario, aceptas que nos pongamos en contacto contigo 
                      para proporcionarte información sobre Fydely.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 