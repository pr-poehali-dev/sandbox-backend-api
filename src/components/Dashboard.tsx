import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const metrics = [
  { label: 'Всего запросов', value: '12,845', change: '+12.5%', icon: 'Activity', trend: 'up' },
  { label: 'Успешных', value: '12,421', change: '+8.2%', icon: 'CheckCircle2', trend: 'up' },
  { label: 'Ошибок', value: '424', change: '-3.1%', icon: 'XCircle', trend: 'down' },
  { label: 'Latency', value: '124ms', change: '-5.4%', icon: 'Zap', trend: 'down' },
];

const recentRequests = [
  { id: '1', method: 'POST', endpoint: '/api/chat/send', status: 200, latency: '102ms', time: '2 мин назад' },
  { id: '2', method: 'GET', endpoint: '/api/webhooks/list', status: 200, latency: '45ms', time: '5 мин назад' },
  { id: '3', method: 'POST', endpoint: '/api/gptunnel/complete', status: 500, latency: '234ms', time: '8 мин назад' },
  { id: '4', method: 'PUT', endpoint: '/api/settings/update', status: 200, latency: '87ms', time: '12 мин назад' },
  { id: '5', method: 'DELETE', endpoint: '/api/keys/revoke', status: 204, latency: '56ms', time: '15 мин назад' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Дашборд</h2>
        <p className="text-muted-foreground">Мониторинг API в реальном времени</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="bg-card border-border hover:glow-border transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <Icon name={metric.icon} className="text-primary" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
              <p className={`text-xs flex items-center gap-1 ${
                metric.trend === 'up' ? 'text-primary' : 'text-accent'
              }`}>
                <Icon name={metric.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={14} />
                {metric.change} за 24ч
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Последние запросы</CardTitle>
          <CardDescription>Live мониторинг API эндпоинтов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Badge
                    variant={request.method === 'GET' ? 'secondary' : 'default'}
                    className={`font-mono text-xs ${
                      request.method === 'POST' ? 'bg-primary/20 text-primary' :
                      request.method === 'DELETE' ? 'bg-destructive/20 text-destructive' :
                      'bg-secondary/20 text-secondary'
                    }`}
                  >
                    {request.method}
                  </Badge>
                  <code className="text-sm text-foreground font-mono flex-1">{request.endpoint}</code>
                </div>
                <div className="flex items-center gap-6">
                  <Badge
                    variant={request.status === 200 || request.status === 204 ? 'default' : 'destructive'}
                    className={request.status === 200 || request.status === 204 ? 'bg-primary/20 text-primary' : ''}
                  >
                    {request.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-mono w-16 text-right">{request.latency}</span>
                  <span className="text-xs text-muted-foreground w-28 text-right">{request.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Icon name="Activity" className="text-primary" size={20} />
              Статус системы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { service: 'API Gateway', status: 'operational', uptime: '99.98%' },
              { service: 'GPTunnel Integration', status: 'operational', uptime: '99.95%' },
              { service: 'Webhook Delivery', status: 'operational', uptime: '99.99%' },
              { service: 'Database', status: 'operational', uptime: '100%' },
            ].map((item) => (
              <div key={item.service} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-foreground">{item.service}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{item.uptime}</span>
                  <Badge className="bg-primary/20 text-primary">Работает</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Icon name="Globe" className="text-secondary" size={20} />
              Регионы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { region: 'Europe (Frankfurt)', requests: '5,234', percentage: 40 },
              { region: 'US East (Virginia)', requests: '3,891', percentage: 30 },
              { region: 'Asia (Singapore)', requests: '2,678', percentage: 20 },
              { region: 'US West (Oregon)', requests: '1,042', percentage: 10 },
            ].map((item) => (
              <div key={item.region} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.region}</span>
                  <span className="text-muted-foreground font-mono">{item.requests}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
