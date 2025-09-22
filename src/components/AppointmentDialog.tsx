import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  base_price: number;
  duration_hours: number;
}

interface AppointmentService {
  service_id: string;
  price: number;
  quantity: number;
  service?: Service;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: any;
  onSave: () => void;
}

export function AppointmentDialog({ open, onOpenChange, appointment, onSave }: AppointmentDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
    start_date: "",
    end_date: "",
    location: "",
    status: "scheduled",
  });
  const [appointmentServices, setAppointmentServices] = useState<AppointmentService[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
      if (appointment) {
        setFormData({
          title: appointment.title || "",
          description: appointment.description || "",
          client_id: appointment.client_id || "",
          start_date: appointment.start_date ? format(new Date(appointment.start_date), "yyyy-MM-dd'T'HH:mm") : "",
          end_date: appointment.end_date ? format(new Date(appointment.end_date), "yyyy-MM-dd'T'HH:mm") : "",
          location: appointment.location || "",
          status: appointment.status || "scheduled",
        });
        fetchAppointmentServices(appointment.id);
      } else {
        resetForm();
      }
    }
  }, [open, appointment]);

  const fetchData = async () => {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        supabase.from("clients").select("id, name").order("name"),
        supabase.from("services").select("*").order("name")
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setClients(clientsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const fetchAppointmentServices = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("appointment_services")
        .select(`
          *,
          services (*)
        `)
        .eq("appointment_id", appointmentId);

      if (error) throw error;

      const servicesData = data?.map(item => ({
        service_id: item.service_id!,
        price: item.price!,
        quantity: item.quantity!,
        service: item.services
      })) || [];

      setAppointmentServices(servicesData);
    } catch (error) {
      console.error("Erro ao carregar serviços do agendamento:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      client_id: "",
      start_date: "",
      end_date: "",
      location: "",
      status: "scheduled",
    });
    setAppointmentServices([]);
  };

  const addService = () => {
    setAppointmentServices([...appointmentServices, {
      service_id: "",
      price: 0,
      quantity: 1
    }]);
  };

  const removeService = (index: number) => {
    setAppointmentServices(appointmentServices.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof AppointmentService, value: any) => {
    const updated = [...appointmentServices];
    updated[index] = { ...updated[index], [field]: value };
    
    // Se mudou o serviço, atualizar o preço base
    if (field === "service_id") {
      const service = services.find(s => s.id === value);
      if (service) {
        updated[index].price = service.base_price;
        updated[index].service = service;
      }
    }
    
    setAppointmentServices(updated);
  };

  const getTotalValue = () => {
    return appointmentServices.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentData = {
        ...formData,
        client_id: formData.client_id || null,
      };

      let appointmentId: string;

      if (appointment) {
        // Atualizar agendamento existente
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointment.id);

        if (error) throw error;
        appointmentId = appointment.id;

        // Remover serviços existentes
        await supabase
          .from("appointment_services")
          .delete()
          .eq("appointment_id", appointmentId);
      } else {
        // Criar novo agendamento
        const { data, error } = await supabase
          .from("appointments")
          .insert([appointmentData])
          .select()
          .single();

        if (error) throw error;
        appointmentId = data.id;
      }

      // Inserir serviços do agendamento
      if (appointmentServices.length > 0) {
        const servicesData = appointmentServices.map(service => ({
          appointment_id: appointmentId,
          service_id: service.service_id,
          price: service.price,
          quantity: service.quantity,
        }));

        const { error: servicesError } = await supabase
          .from("appointment_services")
          .insert(servicesData);

        if (servicesError) throw servicesError;
      }

      // Se o agendamento foi concluído, criar transação de receita
      if (formData.status === "completed" && appointmentServices.length > 0) {
        const totalValue = getTotalValue();
        const client = clients.find(c => c.id === formData.client_id);
        
        const transactionData = {
          type: "income",
          amount: totalValue,
          description: `Receita do agendamento: ${formData.title}${client ? ` - ${client.name}` : ""}`,
          client_id: formData.client_id || null,
          transaction_date: format(new Date(formData.start_date), "yyyy-MM-dd"),
        };

        const { error: transactionError } = await supabase
          .from("transactions")
          .insert([transactionData]);

        if (transactionError) {
          console.error("Erro ao criar transação:", transactionError);
          // Não falhar o agendamento por causa da transação
        }
      }

      toast({
        title: "Sucesso",
        description: appointment ? "Agendamento atualizado com sucesso" : "Agendamento criado com sucesso",
      });

      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar agendamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription>
            {appointment 
              ? "Atualize as informações do agendamento" 
              : "Crie um novo agendamento com serviços vinculados"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data/Hora Início *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data/Hora Fim *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do agendamento..."
              />
            </div>

            {/* Serviços */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Serviços</Label>
                <Button type="button" variant="outline" size="sm" onClick={addService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </div>

              {appointmentServices.map((appointmentService, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label>Serviço</Label>
                        <Select
                          value={appointmentService.service_id}
                          onValueChange={(value) => updateService(index, "service_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - {formatCurrency(service.base_price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={appointmentService.quantity}
                          onChange={(e) => updateService(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Preço</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={appointmentService.price}
                          onChange={(e) => updateService(index, "price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label>Total</Label>
                        <div className="text-sm font-medium p-2">
                          {formatCurrency(appointmentService.price * appointmentService.quantity)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {appointmentServices.length > 0 && (
                <div className="flex justify-end">
                  <Badge variant="secondary" className="text-base p-2">
                    Total Geral: {formatCurrency(getTotalValue())}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {loading ? "Salvando..." : (appointment ? "Atualizar" : "Criar Agendamento")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}