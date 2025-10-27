import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [gptunnelKey, setGptunnelKey] = useState('gpt_*********************');
  const [defaultModel, setDefaultModel] = useState('gpt-4');
  const [webhooksEnabled, setWebhooksEnabled] = useState(true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimit, setRateLimit] = useState('1000');

  const saveSettings = () => {
    toast({
      title: "Настройки сохранены",
      description: "Все изменения успешно применены",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Настройки</h2>
        <p className="text-muted-foreground">Конфигурация API и интеграций</p>
      </div>

      <Card className="bg-card border-border border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="Sparkles" className="text-primary" size={20} />
            GPTunnel Integration
          </CardTitle>
          <CardDescription>
            Подключение к GPTunnel для доступа к различным AI моделям
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gptunnelKey" className="text-sm text-muted-foreground mb-2 block">
              API Key GPTunnel
            </Label>
            <div className="flex gap-3">
              <Input
                id="gptunnelKey"
                type="password"
                value={gptunnelKey}
                onChange={(e) => setGptunnelKey(e.target.value)}
                className="flex-1 bg-muted border-border text-foreground font-mono"
              />
              <Button variant="outline" className="border-border hover:bg-primary/10">
                <Icon name="Eye" size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Получить ключ можно на{' '}
              <a
                href="https://docs.gptunnel.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                docs.gptunnel.ru
              </a>
            </p>
          </div>

          <div>
            <Label htmlFor="defaultModel" className="text-sm text-muted-foreground mb-2 block">
              Модель по умолчанию
            </Label>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger id="defaultModel" className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (Рекомендуется)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: 'OpenAI', status: 'connected', icon: 'Sparkles' },
              { label: 'Anthropic', status: 'connected', icon: 'Cpu' },
              { label: 'Google', status: 'connected', icon: 'Chrome' },
            ].map((provider) => (
              <div
                key={provider.label}
                className="p-3 rounded-lg bg-muted/50 border border-border text-center"
              >
                <Icon name={provider.icon} className="text-primary mx-auto mb-2" size={20} />
                <p className="text-sm text-foreground font-medium mb-1">{provider.label}</p>
                <Badge className="bg-primary/20 text-primary text-xs">
                  {provider.status === 'connected' ? 'Подключен' : 'Отключен'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="Webhook" className="text-secondary" size={20} />
            Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground">Включить webhooks</Label>
              <p className="text-xs text-muted-foreground">
                Отправка событий на внешние endpoints
              </p>
            </div>
            <Switch checked={webhooksEnabled} onCheckedChange={setWebhooksEnabled} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <Label className="text-sm text-foreground">Retry при ошибках</Label>
              <p className="text-xs text-muted-foreground">
                Автоматическая повторная отправка
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="pt-2 border-t border-border">
            <Label htmlFor="retryCount" className="text-sm text-muted-foreground mb-2 block">
              Количество попыток
            </Label>
            <Select defaultValue="3">
              <SelectTrigger id="retryCount" className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 попытка</SelectItem>
                <SelectItem value="3">3 попытки</SelectItem>
                <SelectItem value="5">5 попыток</SelectItem>
                <SelectItem value="10">10 попыток</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="Shield" className="text-accent" size={20} />
            Безопасность и лимиты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground">Rate Limiting</Label>
              <p className="text-xs text-muted-foreground">
                Ограничение количества запросов
              </p>
            </div>
            <Switch checked={rateLimitEnabled} onCheckedChange={setRateLimitEnabled} />
          </div>

          {rateLimitEnabled && (
            <div className="pt-2 border-t border-border">
              <Label htmlFor="rateLimit" className="text-sm text-muted-foreground mb-2 block">
                Лимит запросов в час
              </Label>
              <Input
                id="rateLimit"
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <Label className="text-sm text-foreground">IP Whitelist</Label>
              <p className="text-xs text-muted-foreground">
                Доступ только с разрешенных IP
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <Label className="text-sm text-foreground">CORS</Label>
              <p className="text-xs text-muted-foreground">
                Cross-Origin Resource Sharing
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="Bell" className="text-secondary" size={20} />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground">Email уведомления</Label>
              <p className="text-xs text-muted-foreground">
                При критических событиях
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <Label className="text-sm text-foreground">Telegram alerts</Label>
              <p className="text-xs text-muted-foreground">
                Мгновенные уведомления в Telegram
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="pt-2 border-t border-border">
            <Label htmlFor="alertEmail" className="text-sm text-muted-foreground mb-2 block">
              Email для уведомлений
            </Label>
            <Input
              id="alertEmail"
              type="email"
              placeholder="dev@example.com"
              className="bg-muted border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-border">
          Отмена
        </Button>
        <Button onClick={saveSettings} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Icon name="Save" size={16} className="mr-2" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  );
}
