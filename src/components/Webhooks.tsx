import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { webhooksService, Webhook } from '@/lib/api';

export default function Webhooks() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const data = await webhooksService.getAll();
      setWebhooks(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить webhooks",
        variant: "destructive",
      });
    }
  };

  const testWebhook = async (id: string, url: string) => {
    try {
      const result = await webhooksService.test(id);
      toast({
        title: result.success ? "Тест успешен" : "Тест не прошел",
        description: result.message || `Webhook: ${url}`,
        variant: result.success ? "default" : "destructive",
      });
      await loadWebhooks();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить тест",
        variant: "destructive",
      });
    }
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      )
    );
  };

  const deleteWebhook = async (id: string) => {
    try {
      await webhooksService.delete(id);
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast({
        title: "Webhook удален",
        description: "Веб-хук успешно удален",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить webhook",
        variant: "destructive",
      });
    }
  };

  const addWebhook = async () => {
    if (!newUrl.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newWebhook = await webhooksService.create(newUrl, ['chat.message']);
      setWebhooks([newWebhook, ...webhooks]);
      setNewUrl('');
      toast({
        title: "Webhook создан",
        description: "Новый webhook успешно добавлен",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Веб-хуки</h2>
        <p className="text-muted-foreground">Настройка webhook endpoints для событий</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Добавить webhook</CardTitle>
          <CardDescription>Укажите URL для получения событий</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl" className="text-sm text-muted-foreground mb-2 block">
                Webhook URL
              </Label>
              <div className="flex gap-3">
                <Input
                  id="webhookUrl"
                  placeholder="https://your-domain.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 bg-muted border-border text-foreground font-mono text-sm"
                />
                <Button onClick={addWebhook} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Активные webhooks</CardTitle>
          <CardDescription>Всего: {webhooks.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-5 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm font-mono text-foreground bg-background/50 px-3 py-1 rounded">
                        {webhook.url}
                      </code>
                      <Switch
                        checked={webhook.enabled}
                        onCheckedChange={() => toggleWebhook(webhook.id)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs border-primary/30 text-primary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Clock" size={14} />
                      {webhook.lastDelivery}
                    </span>
                    <span className="flex items-center gap-2">
                      <Icon name="CheckCircle2" size={14} className="text-primary" />
                      <span className="text-foreground font-medium">{webhook.successRate}%</span>
                      <span className="text-muted-foreground">успешных</span>
                    </span>
                  </div>
                  <Badge
                    className={
                      webhook.enabled
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }
                  >
                    {webhook.enabled ? 'Активен' : 'Отключен'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(webhook.id, webhook.url)}
                    className="text-xs border-border hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Icon name="Send" size={14} className="mr-1" />
                    Тест
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-border hover:bg-primary/10 hover:text-primary"
                  >
                    <Icon name="FileText" size={14} className="mr-1" />
                    Логи
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-border hover:bg-muted"
                  >
                    <Icon name="Settings" size={14} className="mr-1" />
                    События
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWebhook(webhook.id)}
                    className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10 ml-auto"
                  >
                    <Icon name="Trash2" size={14} className="mr-1" />
                    Удалить
                  </Button>
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
              <Icon name="Zap" className="text-accent" size={20} />
              Доступные события
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { event: 'chat.message', description: 'Новое сообщение в чате' },
              { event: 'chat.status', description: 'Изменение статуса чата' },
              { event: 'ai.complete', description: 'Завершение AI-запроса' },
              { event: 'ai.error', description: 'Ошибка AI-обработки' },
              { event: 'api.quota', description: 'Достижение лимита запросов' },
            ].map((item) => (
              <div key={item.event} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <code className="text-xs text-primary font-mono">{item.event}</code>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Icon name="AlertCircle" className="text-accent" size={20} />
              Формат payload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-background/50 p-4 rounded border border-border overflow-x-auto">
              <code className="text-foreground font-mono">{`{
  "event": "chat.message",
  "timestamp": "2025-01-27T...",
  "data": {
    "chatId": "abc123",
    "message": "...",
    "userId": "user456"
  }
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}