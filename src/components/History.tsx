import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const HISTORY_URL = 'https://functions.poehali.dev/0b710409-f8f9-492c-9fb7-708ec0403161';

interface HistoryItem {
  id: number;
  timestamp: string;
  endpoint: string;
  method: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  status: number;
  userMessage: string;
  aiResponse: string;
  error: string;
}

interface TokenStats {
  model: string;
  total_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

interface DailyStats {
  date: string;
  tokens: number;
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<TokenStats[]>([]);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${HISTORY_URL}?action=history&limit=50`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${HISTORY_URL}?action=stats`);
      const data = await response.json();
      setStats(data.models || []);
      setDaily(data.daily || []);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalTokens = stats.reduce((sum, s) => sum + s.total_tokens, 0);
  const totalRequests = stats.reduce((sum, s) => sum + s.total_requests, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">История и Статистика</h2>
        <p className="text-muted-foreground">Отслеживание запросов и использования токенов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Всего запросов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-primary mt-1">За последние 30 дней</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Использовано токенов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-secondary mt-1">Всего моделей: {stats.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Avg за запрос</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {totalRequests > 0 ? Math.round(totalTokens / totalRequests).toLocaleString() : 0}
            </div>
            <p className="text-xs text-accent mt-1">токенов</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="history">История запросов</TabsTrigger>
          <TabsTrigger value="stats">Статистика токенов</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Последние запросы</CardTitle>
              <CardDescription>История API вызовов с деталями</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Icon name="Loader2" className="animate-spin text-primary" size={32} />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Icon name="Inbox" size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">История запросов пуста</p>
                  <p className="text-xs mt-2">Отправьте первый запрос в Sandbox</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon name="MessageSquare" className="text-primary" size={20} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.model}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary text-xs">
                            {item.tokens.total} tokens
                          </Badge>
                          <Badge
                            className={
                              item.status === 200
                                ? 'bg-primary/20 text-primary'
                                : 'bg-destructive/20 text-destructive'
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="bg-background/50 p-3 rounded border border-border">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Icon name="User" size={12} />
                            Запрос:
                          </p>
                          <p className="text-sm text-foreground">{item.userMessage || 'N/A'}</p>
                        </div>
                        {item.aiResponse && (
                          <div className="bg-background/50 p-3 rounded border border-border">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Icon name="Bot" size={12} />
                              Ответ:
                            </p>
                            <p className="text-sm text-foreground">
                              {item.aiResponse}
                              {item.aiResponse.length >= 200 && '...'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Zap" size={12} />
                          Prompt: {item.tokens.prompt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Sparkles" size={12} />
                          Completion: {item.tokens.completion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">По моделям</CardTitle>
                <CardDescription>Использование токенов за 30 дней</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
                  ) : (
                    stats.map((stat) => (
                      <div key={stat.model} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{stat.model}</p>
                            <p className="text-xs text-muted-foreground">
                              {stat.total_requests} запросов
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">
                              {stat.total_tokens.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">токенов</p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                            style={{
                              width: `${(stat.total_tokens / totalTokens) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Prompt: {stat.prompt_tokens.toLocaleString()}</span>
                          <span>Completion: {stat.completion_tokens.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">За неделю</CardTitle>
                <CardDescription>Использование токенов по дням</CardDescription>
              </CardHeader>
              <CardContent>
                {daily.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
                ) : (
                  <div className="space-y-3">
                    {daily.map((day) => {
                      const date = new Date(day.date);
                      const dayName = date.toLocaleDateString('ru-RU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      });
                      const maxTokens = Math.max(...daily.map((d) => d.tokens));
                      const percentage = (day.tokens / maxTokens) * 100;

                      return (
                        <div key={day.date} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{dayName}</span>
                            <span className="text-primary font-mono">
                              {day.tokens.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
