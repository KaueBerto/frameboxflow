-- Habilitar RLS e criar políticas para sistema de usuário único

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para sistema de usuário único (sem autenticação externa)
-- Todas as operações são permitidas para simplificar o sistema

-- Categorias
CREATE POLICY "Allow all operations on categories" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);

-- Clientes
CREATE POLICY "Allow all operations on clients" ON public.clients
  FOR ALL USING (true) WITH CHECK (true);

-- Transações
CREATE POLICY "Allow all operations on transactions" ON public.transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Compromissos
CREATE POLICY "Allow all operations on appointments" ON public.appointments
  FOR ALL USING (true) WITH CHECK (true);

-- Serviços
CREATE POLICY "Allow all operations on services" ON public.services
  FOR ALL USING (true) WITH CHECK (true);

-- Serviços dos Compromissos
CREATE POLICY "Allow all operations on appointment_services" ON public.appointment_services
  FOR ALL USING (true) WITH CHECK (true);