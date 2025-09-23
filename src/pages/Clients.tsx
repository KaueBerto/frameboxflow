import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, FileText, Users, UserPlus } from "lucide-react";

/**
 * Página de gerenciamento de clientes
 * 
 * Funcionalidades:
 * - Listagem de clientes com busca
 * - Cadastro e edição de clientes
 * - Exclusão de clientes com confirmação
 * - Interface responsiva e moderna
 * - Validação de dados
 * - Feedback visual para ações
 */

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export default function Clients() {
  // Estados do componente
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Carrega os clientes ao montar o componente
  useEffect(() => {
    fetchClients();
  }, []);

  /**
   * Busca todos os clientes do banco de dados
   */
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar clientes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manipula o envio do formulário (criar/editar cliente)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from("clients")
          .update(formData)
          .eq("id", editingClient.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso! ✅",
          description: "Cliente atualizado com sucesso",
        });
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from("clients")
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso! ✅",
          description: "Cliente cadastrado com sucesso",
        });
      }
      
      // Limpa o formulário e fecha o dialog
      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
      fetchClients();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar cliente. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  /**
   * Prepara o formulário para edição de um cliente
   */
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setIsDialogOpen(true);
  };

  /**
   * Exclui um cliente após confirmação
   */
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso! ✅",
        description: "Cliente excluído com sucesso",
      });
      fetchClients();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  /**
   * Filtra clientes baseado no termo de busca
   */
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes de forma eficiente
          </p>
        </div>
        
        {/* Botão para adicionar novo cliente */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="btn-gradient-primary shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => {
                setEditingClient(null);
                setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          
          {/* Dialog para criar/editar cliente */}
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>{editingClient ? "Editar Cliente" : "Novo Cliente"}</span>
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? "Atualize as informações do cliente" 
                  : "Cadastre um novo cliente no sistema"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Nome (obrigatório) */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome completo"
                    className="focus-ring"
                    required
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="focus-ring"
                  />
                </div>
                
                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="focus-ring"
                  />
                </div>
                
                {/* Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                    className="focus-ring"
                  />
                </div>
                
                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o cliente..."
                    className="focus-ring resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit"
                  className="btn-gradient-primary"
                >
                  {editingClient ? "Atualizar Cliente" : "Cadastrar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de busca e estatísticas */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus-ring"
            />
          </div>
        </div>
        
        {/* Badge com contador */}
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          {filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"}
        </Badge>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        // Skeleton loading
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="card-elevated group hover:scale-105 transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                    {client.name}
                  </CardTitle>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(client)}
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(client.id)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Email */}
                {client.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate-tooltip">{client.email}</span>
                  </div>
                )}
                
                {/* Telefone */}
                {client.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-success" />
                    <span>{client.phone}</span>
                  </div>
                )}
                
                {/* Endereço */}
                {client.address && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-warning" />
                    <span className="truncate-tooltip">{client.address}</span>
                  </div>
                )}
                
                {/* Observações */}
                {client.notes && (
                  <div className="flex items-start space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">{client.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && filteredClients.length === 0 && (
        <Card className="text-center py-12 card-elevated">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Tente ajustar sua busca ou adicione um novo cliente"
                : "Comece adicionando seu primeiro cliente ao sistema"
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="btn-gradient-primary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}