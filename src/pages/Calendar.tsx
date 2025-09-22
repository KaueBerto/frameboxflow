import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, Plus, DollarSign, Filter, Edit, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentDialog } from "@/components/AppointmentDialog";

interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
  clients?: { name: string };
  appointment_services?: Array<{
    price: number;
    quantity: number;
    services: { name: string };
  }>;
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (name),
          appointment_services (
            price,
            quantity,
            services (name)
          )
        `)
        .order("start_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar agenda",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
    
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso",
      });
      fetchAppointments();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir agendamento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    const labels = {
      scheduled: "Agendado",
      completed: "Concluído", 
      cancelled: "Cancelado"
    };
    return { color: colors[status as keyof typeof colors], label: labels[status as keyof typeof labels] };
  };

  const getTotalValue = (appointment: Appointment) => {
    if (!appointment.appointment_services) return 0;
    return appointment.appointment_services.reduce((total, service) => 
      total + (service.price * service.quantity), 0
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredAppointments = appointments.filter(appointment => 
    statusFilter === "all" || appointment.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus compromissos</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4 mr-2" />
          onClick={() => {
            setEditingAppointment(null);
            setIsDialogOpen(true);
          }}
          Novo Compromisso
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">
          {filteredAppointments.length} {filteredAppointments.length === 1 ? "compromisso" : "compromissos"}
        </Badge>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === "all" ? "Nenhum compromisso agendado" : "Nenhum compromisso encontrado"}
              </h3>
              <p className="text-muted-foreground">
                {statusFilter === "all" 
                  ? "Comece adicionando seu primeiro compromisso"
                  : "Tente ajustar o filtro ou adicione um novo compromisso"
                }
              </p>
              {statusFilter === "all" && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-primary hover:opacity-90 transition-opacity mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Compromisso
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{appointment.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status).color}`}>
                      {getStatusBadge(appointment.status).label}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(appointment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(appointment.start_date), "dd/MM/yyyy HH:mm", { locale: ptBR })} - 
                    {format(parseISO(appointment.end_date), "HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {appointment.clients && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.clients.name}</span>
                  </div>
                )}
                {appointment.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                {appointment.description && (
                  <p className="text-sm text-muted-foreground">{appointment.description}</p>
                )}
                
                {/* Serviços e Valor Total */}
                {appointment.appointment_services && appointment.appointment_services.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Serviços:</span>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-semibold text-success">
                          {formatCurrency(getTotalValue(appointment))}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {appointment.appointment_services.map((service, index) => (
                        <div key={index} className="flex justify-between text-sm text-muted-foreground">
                          <span>{service.services.name} (x{service.quantity})</span>
                          <span>{formatCurrency(service.price * service.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        appointment={editingAppointment}
        onSave={fetchAppointments}
      />
    </div>
  );
}