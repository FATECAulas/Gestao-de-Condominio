import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Building2, Users, ParkingCircle, MessageSquare, Calendar, UtensilsCrossed } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Condomínio Pro</h1>
          </div>
          {isAuthenticated ? (
            <Button onClick={() => setLocation('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
              Ir para Dashboard
            </Button>
          ) : (
            <a href={getLoginUrl()}>
              <Button className="bg-blue-600 hover:bg-blue-700">Entrar</Button>
            </a>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Gestão Condominial
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Sofisticada e Completa
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Centralize o controle de condôminos, garagens, salão de festas e comunicação interna em uma única plataforma elegante e refinada.
          </p>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                Começar Agora
              </Button>
            </a>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Users,
              title: 'Gestão de Condôminos',
              description: 'Cadastre e gerencie todos os condôminos com informações completas e perfis diferenciados.',
            },
            {
              icon: Building2,
              title: 'Unidades Organizadas',
              description: 'Organize as unidades por bloco, apartamento e andar para melhor controle.',
            },
            {
              icon: ParkingCircle,
              title: 'Sorteio de Garagens',
              description: 'Sistema inteligente de sorteio respeitando garagens fixas e pré-determinadas.',
            },
            {
              icon: Calendar,
              title: 'Reserva de Salão',
              description: 'Gerencie reservas do salão de festas e gere documentos automaticamente.',
            },
            {
              icon: UtensilsCrossed,
              title: 'Inventário de Utensílios',
              description: 'Controle completo dos utensílios da cozinha com estado de conservação.',
            },
            {
              icon: MessageSquare,
              title: 'Chat Condominial',
              description: 'Comunicação interna entre condôminos para assuntos do condomínio.',
            },
          ].map((feature, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Pronto para transformar sua gestão condominial?</h3>
          <p className="text-blue-100 mb-8 text-lg">
            Comece agora e tenha acesso a todas as funcionalidades de um sistema profissional.
          </p>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-6 text-lg">
                Acessar Sistema
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2026 Sistema de Gestão Condominial. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
