import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ApiKeys from './components/ApiKeys';
import Webhooks from './components/Webhooks';
import Logs from './components/Logs';
import Settings from './components/Settings';
import Sandbox from './components/Sandbox';
import History from './components/History';

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sandbox':
        return <Sandbox />;
      case 'history':
        return <History />;
      case 'api-keys':
        return <ApiKeys />;
      case 'webhooks':
        return <Webhooks />;
      case 'logs':
        return <Logs />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="flex min-h-screen bg-background">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;