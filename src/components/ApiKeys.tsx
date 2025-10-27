import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import { apiKeysService, ApiKey } from '@/lib/api';

export default function ApiKeys() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await apiKeysService.getAll();
      setKeys(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ключи",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: "API ключ скопирован в буфер обмена",
    });
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название ключа",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newKey = await apiKeysService.create(newKeyName);
      setKeys([newKey, ...keys]);
      setNewKeyName('');
      toast({
        title: "Ключ создан!",
        description: "Новый API ключ успешно сгенерирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать ключ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await apiKeysService.delete(id);
      setKeys(keys.filter((k) => k.id !== id));
      toast({
        title: "Ключ отозван",
        description: "API ключ успешно удален",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить ключ",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">API-ключи</h2>
        <p className="text-muted-foreground">Управление ключами доступа к API</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Создать новый ключ</CardTitle>
          <CardDescription>Сгенерируйте новый API ключ для интеграции</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyName" className="text-sm text-muted-foreground mb-2 block">
                Название ключа
              </Label>
              <Input
                id="keyName"
                placeholder="Например: Mobile App Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateKey} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать ключ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Активные ключи</CardTitle>
          <CardDescription>Всего ключей: {keys.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-5 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{key.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        Создан: {key.created}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {key.lastUsed}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary">
                    {key.requests.toLocaleString()} запросов
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <code className="flex-1 px-4 py-3 bg-background/50 rounded border border-border text-foreground font-mono text-sm">
                    {key.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(key.key)}
                    className="border-border hover:bg-primary/10 hover:text-primary"
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-border hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Icon name="BarChart3" size={14} className="mr-1" />
                    Статистика
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeKey(key.id)}
                    className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Icon name="Trash2" size={14} className="mr-1" />
                    Отозвать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border border-accent/30">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="ShieldAlert" className="text-accent" size={20} />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Icon name="Check" className="text-primary mt-0.5" size={16} />
            Храните API ключи в безопасном месте, не публикуйте их в коде
          </p>
          <p className="flex items-start gap-2">
            <Icon name="Check" className="text-primary mt-0.5" size={16} />
            Используйте разные ключи для production и development окружений
          </p>
          <p className="flex items-start gap-2">
            <Icon name="Check" className="text-primary mt-0.5" size={16} />
            Регулярно ротируйте ключи и отзывайте неиспользуемые
          </p>
        </CardContent>
      </Card>
    </div>
  );
}