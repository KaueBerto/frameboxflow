import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { Camera, Sparkles, Eye, EyeOff, Lock, Mail } from "lucide-react";

/**
 * Sistema de autenticação da aplicação
 * 
 * Funcionalidades:
 * - Gerenciamento de estado de autenticação
 * - Persistência de login no localStorage
 * - Interface de login responsiva e moderna
 * - Validação de credenciais
 * - Feedback visual para o usuário
 */

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook para acessar o contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação que gerencia o estado global de login
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verifica se já existe uma sessão ativa ao inicializar
  useEffect(() => {
    const authState = localStorage.getItem("framebox-auth");
    if (authState === "authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * Função de login com validação de credenciais
   */
  const login = (email: string, password: string) => {
    // Credenciais fixas conforme especificação
    const validEmail = "patriciacostastorymaker@gmail.com";
    const validPassword = "Pati5688@";

    if (email === validEmail && password === validPassword) {
      setIsAuthenticated(true);
      localStorage.setItem("framebox-auth", "authenticated");
      toast({
        title: "Login realizado com sucesso! 🎉",
        description: "Bem-vinda ao FrameBOX",
      });
      return true;
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos. Verifique suas credenciais.",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Função de logout que limpa a sessão
   */
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("framebox-auth");
    toast({
      title: "Logout realizado",
      description: "Até logo! Volte sempre.",
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Componente de formulário de login
 */
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  /**
   * Manipula o envio do formulário de login
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simula delay de autenticação para melhor UX
    setTimeout(() => {
      login(email, password);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo e branding */}
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <Camera className="h-8 w-8 text-primary-foreground" />
                </div>
                <Sparkles className="h-4 w-4 text-warning absolute -top-1 -right-1" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gradient-primary">
                  FrameBOX
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestão Fotográfica
                </p>
              </div>
            </div>
            
            <div>
              <CardTitle className="text-2xl text-foreground">
                Bem-vinda de volta!
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 focus-ring"
                    required
                  />
                </div>
              </div>
              
              {/* Campo de senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 focus-ring"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Botão de login */}
              <Button 
                type="submit" 
                className="w-full btn-gradient-primary h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar no Sistema"
                )}
              </Button>
            </form>
            
            {/* Informações adicionais */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Sistema seguro e protegido 🔒
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface AuthWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper que controla o acesso à aplicação baseado no estado de autenticação
 */
export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isAuthenticated } = useAuth();

  // Se não estiver autenticado, mostra a tela de login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Se estiver autenticado, mostra o conteúdo da aplicação
  return <>{children}</>;
};