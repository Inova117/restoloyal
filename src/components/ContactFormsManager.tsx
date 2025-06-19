import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  MessageSquare, 
  Eye, 
  CheckCircle, 
  Reply, 
  X,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Star,
  ExternalLink
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ContactForm = Tables<'contact_forms'>;

interface ContactFormWithMetadata extends ContactForm {
  metadata: {
    businessType?: string;
    numberOfLocations?: string;
    preferredContactTime?: string;
    originalMessage?: string;
  };
}

export default function ContactFormsManager() {
  const [contactForms, setContactForms] = useState<ContactFormWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<ContactFormWithMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchContactForms();
  }, []);

  const fetchContactForms = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContactForms(data as ContactFormWithMetadata[]);
    } catch (error) {
      console.error('Error fetching contact forms:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los formularios de contacto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = async (id: string, status: string, priority?: string) => {
    try {
      const updates: any = { status };
      if (priority) updates.priority = priority;
      if (status === 'read' && !contactForms.find(f => f.id === id)?.read_at) {
        updates.read_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contact_forms')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchContactForms();
      toast({
        title: "Actualizado",
        description: "Estado del formulario actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error updating form status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del formulario.",
        variant: "destructive"
      });
    }
  };

  const filteredForms = contactForms.filter(form => {
    const matchesSearch = 
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || form.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'read': return 'bg-yellow-500';
      case 'replied': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de Formularios */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-500" />
                Formularios de Contacto
                <Badge variant="secondary" className="ml-auto">
                  {filteredForms.length} total
                </Badge>
              </CardTitle>
              <CardDescription>
                Gestiona las solicitudes de contacto desde la landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="read">Leído</SelectItem>
                    <SelectItem value="replied">Respondido</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={fetchContactForms}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Actualizar
                </Button>
              </div>

              {/* Lista de formularios */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredForms.map((form) => (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedForm?.id === form.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedForm(form)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{form.name}</h3>
                          <Badge className={`${getStatusColor(form.status)} text-white text-xs`}>
                            {form.status}
                          </Badge>
                          <Badge className={`${getPriorityColor(form.priority)} text-white text-xs`}>
                            {form.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {form.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3" />
                            {form.company}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {formatDate(form.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {form.status === 'new' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Nuevo
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForm(form);
                            if (form.status === 'new') {
                              updateFormStatus(form.id, 'read');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredForms.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron formularios de contacto</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle del Formulario */}
        {selectedForm && (
          <div className="lg:w-96">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Detalle del Formulario</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedForm(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del contacto */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <p className="text-gray-900">{selectedForm.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{selectedForm.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`mailto:${selectedForm.email}`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedForm.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900">{selectedForm.phone}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`tel:${selectedForm.phone}`)}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectedForm.company && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Empresa</label>
                      <p className="text-gray-900">{selectedForm.company}</p>
                    </div>
                  )}
                </div>

                {/* Metadatos */}
                {selectedForm.metadata && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Información del Negocio</h4>
                    
                    {selectedForm.metadata.businessType && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tipo de Negocio</label>
                        <p className="text-gray-900">{selectedForm.metadata.businessType}</p>
                      </div>
                    )}
                    
                    {selectedForm.metadata.numberOfLocations && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Número de Ubicaciones</label>
                        <p className="text-gray-900">{selectedForm.metadata.numberOfLocations}</p>
                      </div>
                    )}
                    
                    {selectedForm.metadata.preferredContactTime && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Horario Preferido</label>
                        <p className="text-gray-900">{selectedForm.metadata.preferredContactTime}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje */}
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-700">Mensaje</label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedForm.message}</p>
                  </div>
                </div>

                {/* Información del sistema */}
                <div className="pt-4 border-t text-xs text-gray-500 space-y-1">
                  <p>Recibido: {formatDate(selectedForm.created_at)}</p>
                  {selectedForm.read_at && (
                    <p>Leído: {formatDate(selectedForm.read_at)}</p>
                  )}
                  {selectedForm.replied_at && (
                    <p>Respondido: {formatDate(selectedForm.replied_at)}</p>
                  )}
                  <p>Fuente: {selectedForm.source}</p>
                </div>

                {/* Acciones */}
                <div className="pt-4 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={selectedForm.status}
                      onValueChange={(value) => updateFormStatus(selectedForm.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="read">Leído</SelectItem>
                        <SelectItem value="replied">Respondido</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedForm.priority}
                      onValueChange={(value) => updateFormStatus(selectedForm.id, selectedForm.status, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      window.open(`mailto:${selectedForm.email}?subject=Re: Solicitud de demo - ${selectedForm.company}`);
                      updateFormStatus(selectedForm.id, 'replied');
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Responder por Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 