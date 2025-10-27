import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  method: string;
  endpoint: string;
  status: number;
  message: string;
  duration: string;
}

const logs: LogEntry[] = [
  {
    id: '1',
    timestamp: '14:32:45',
    level: 'success',
    method: 'POST',
    endpoint: '/api/chat/send',
    status: 200,
    message: 'Message delivered successfully',
    duration: '102ms',
  },
  {
    id: '2',
    timestamp: '14:31:23',
    level: 'info',
    method: 'GET',
    endpoint: '/api/webhooks/list',
    status: 200,
    message: 'Retrieved 5 webhooks',
    duration: '45ms',
  },
  {
    id: '3',
    timestamp: '14:30:12',
    level: 'error',
    method: 'POST',
    endpoint: '/api/gptunnel/complete',
    status: 500,
    message: 'GPTunnel timeout: Request exceeded 30s',
    duration: '30124ms',
  },
  {
    id: '4',
    timestamp: '14:28:56',
    level: 'warn',
    method: 'PUT',
    endpoint: '/api/settings/update',
    status: 429,
    message: 'Rate limit approaching: 95% of quota used',
    duration: '12ms',
  },
  {
    id: '5',
    timestamp: '14:27:34',
    level: 'success',
    method: 'DELETE',
    endpoint: '/api/keys/revoke',
    status: 204,
    message: 'API key revoked: sk_live_***',
    duration: '56ms',
  },
  {
    id: '6',
    timestamp: '14:26:18',
    level: 'info',
    method: 'POST',
    endpoint: '/api/webhook/test',
    status: 200,
    message: 'Webhook test completed',
    duration: '234ms',
  },
];

const levelConfig = {
  success: { icon: 'CheckCircle2', color: 'text-primary', bg: 'bg-primary/20' },
  info: { icon: 'Info', color: 'text-secondary', bg: 'bg-secondary/20' },
  warn: { icon: 'AlertTriangle', color: 'text-accent', bg: 'bg-accent/20' },
  error: { icon: 'XCircle', color: 'text-destructive', bg: 'bg-destructive/20' },
};

export default function Logs() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch = 
      log.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Логи</h2>
        <p className="text-muted-foreground">Мониторинг событий системы в реальном времени</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Фильтры</CardTitle>
              <CardDescription>Поиск и фильтрация логов</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-border hover:bg-primary/10">
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по endpoint или сообщению..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 bg-muted border-border">
                <SelectValue placeholder="Уровень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="Terminal" className="text-primary" size={20} />
            Live Logs
            <Badge className="ml-2 bg-primary/20 text-primary animate-pulse">
              {filteredLogs.length} записей
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const config = levelConfig[log.level];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-all font-mono text-sm"
                >
                  <span className="text-muted-foreground text-xs mt-1 w-20 shrink-0">{log.timestamp}</span>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Icon name={config.icon} className={config.color} size={16} />
                    <Badge className={`${config.bg} ${config.color} text-xs uppercase`}>
                      {log.level}
                    </Badge>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs font-mono shrink-0 ${
                      log.method === 'POST' ? 'border-primary/50 text-primary' :
                      log.method === 'GET' ? 'border-secondary/50 text-secondary' :
                      log.method === 'DELETE' ? 'border-destructive/50 text-destructive' :
                      'border-accent/50 text-accent'
                    }`}
                  >
                    {log.method}
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <code className="text-foreground block mb-1 truncate">{log.endpoint}</code>
                    <p className="text-muted-foreground text-xs truncate">{log.message}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      className={
                        log.status >= 200 && log.status < 300
                          ? 'bg-primary/20 text-primary'
                          : log.status >= 400
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-accent/20 text-accent'
                      }
                    >
                      {log.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs w-20 text-right">{log.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Всего запросов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12,845</div>
            <p className="text-xs text-primary mt-1">+12.5% за 24ч</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Ошибок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">424</div>
            <p className="text-xs text-destructive mt-1">3.3% от общего</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg. Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">124ms</div>
            <p className="text-xs text-primary mt-1">-5.4% за 24ч</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
