import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { gptunnelService } from '@/lib/api';

export default function Sandbox() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('test');
  const [method, setMethod] = useState('POST');
  const [endpoint, setEndpoint] = useState(`${window.location.origin}/v1/chat/completions`);
  const [requestBody, setRequestBody] = useState(`{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "Привет! Как дела?"
    }
  ],
  "temperature": 0.7
}`);
  const [headers, setHeaders] = useState('Content-Type: application/json\nX-Api-Key: your-api-key');
  const [response, setResponse] = useState('');
  const [responseTime, setResponseTime] = useState(0);
  const [statusCode, setStatusCode] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendRequest = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const headerObj: Record<string, string> = {};
      headers.split('\n').forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length > 0) {
          headerObj[key.trim()] = values.join(':').trim();
        }
      });

      const res = await fetch(endpoint, {
        method,
        headers: headerObj,
        body: method !== 'GET' ? requestBody : undefined,
      });

      const duration = Date.now() - startTime;
      setResponseTime(duration);
      setStatusCode(res.status);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }

      toast({
        title: "Запрос выполнен",
        description: `${res.status} ${res.statusText} • ${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setResponseTime(duration);
      setStatusCode(500);
      setResponse(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : ''
      }, null, 2));

      toast({
        title: "Ошибка запроса",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const apiEndpoint = `${window.location.origin}/v1/chat/completions`;

  const quickRequests = [
    {
      name: 'GPT-4o Mini',
      method: 'POST',
      endpoint: apiEndpoint,
      body: `{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Напиши короткую историю про космонавта"}
  ]
}`
    },
    {
      name: 'Claude Sonnet',
      method: 'POST',
      endpoint: apiEndpoint,
      body: `{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {"role": "user", "content": "Объясни квантовую физику простыми словами"}
  ]
}`
    },
    {
      name: 'Gemini Pro',
      method: 'POST',
      endpoint: apiEndpoint,
      body: `{
  "model": "gemini-2.0-flash-exp",
  "messages": [
    {"role": "user", "content": "Расскажи интересный факт"}
  ]
}`
    },
  ];

  const loadQuickRequest = (req: typeof quickRequests[0]) => {
    setMethod(req.method);
    setEndpoint(req.endpoint);
    setRequestBody(req.body);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">API Sandbox</h2>
        <p className="text-muted-foreground">Тестирование и документация API</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="test">Тестирование</TabsTrigger>
          <TabsTrigger value="docs">Документация</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <Icon name="BookOpen" className="text-primary" size={24} />
                Документация API
              </CardTitle>
              <CardDescription>Полное руководство по использованию API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">API Endpoint</h3>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                  <code className="flex-1 font-mono text-sm text-foreground">POST https://{'{'}{window.location.host}{'}'}/v1/chat/completions</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`${window.location.origin}/v1/chat/completions`)}
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Аутентификация</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Все запросы требуют API ключ в заголовке <code className="bg-muted px-1.5 py-0.5 rounded">X-Api-Key</code>
                </p>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <pre className="text-xs font-mono text-foreground overflow-x-auto">
{`curl -X POST https://{домен_проекта}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Доступные модели</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: 'gpt-4o-mini', desc: 'OpenAI GPT-4o Mini - быстрый и экономичный' },
                    { name: 'gpt-4o', desc: 'OpenAI GPT-4o - самая мощная модель' },
                    { name: 'claude-3-5-sonnet-20241022', desc: 'Anthropic Claude 3.5 Sonnet' },
                    { name: 'gemini-2.0-flash-exp', desc: 'Google Gemini 2.0 Flash' },
                  ].map((model) => (
                    <div key={model.name} className="p-3 bg-muted/50 rounded-lg border border-border">
                      <code className="text-sm font-mono text-primary">{model.name}</code>
                      <p className="text-xs text-muted-foreground mt-1">{model.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Параметры запроса</h3>
                <div className="space-y-2">
                  {[
                    { param: 'model', type: 'string', required: true, desc: 'Модель для генерации ответа' },
                    { param: 'messages', type: 'array', required: true, desc: 'Массив сообщений с ролями (user/assistant/system)' },
                    { param: 'temperature', type: 'number', required: false, desc: 'Температура генерации (0.0-2.0), по умолчанию 0.7' },
                    { param: 'max_tokens', type: 'number', required: false, desc: 'Максимальное количество токенов в ответе' },
                  ].map((param) => (
                    <div key={param.param} className="flex items-start gap-3 p-3 bg-muted/50 rounded border border-border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-foreground">{param.param}</code>
                          <Badge variant="outline" className="text-xs">{param.type}</Badge>
                          {param.required && <Badge className="text-xs bg-destructive/20 text-destructive">required</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{param.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Пример ответа</h3>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <pre className="text-xs font-mono text-foreground overflow-x-auto">
{`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699999999,
  "model": "gpt-4o-mini",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Привет! Как я могу помочь?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Коды ответов</h3>
                <div className="space-y-2">
                  {[
                    { code: 200, desc: 'Успешный запрос' },
                    { code: 401, desc: 'Отсутствует или неверный API ключ' },
                    { code: 403, desc: 'API ключ отключен' },
                    { code: 429, desc: 'Превышен лимит запросов' },
                    { code: 500, desc: 'Внутренняя ошибка сервера' },
                  ].map((status) => (
                    <div key={status.code} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <Badge className={status.code === 200 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}>
                        {status.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{status.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="mt-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {quickRequests.map((req) => (
          <Card
            key={req.name}
            className="bg-card border-border hover:border-primary/50 cursor-pointer transition-all"
            onClick={() => loadQuickRequest(req)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-foreground">{req.name}</CardTitle>
                <Badge variant="outline" className={
                  req.method === 'POST' ? 'border-primary/50 text-primary' :
                  req.method === 'GET' ? 'border-secondary/50 text-secondary' :
                  'border-accent/50 text-accent'
                }>
                  {req.method}
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono">{req.endpoint}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Icon name="Send" className="text-primary" size={20} />
              Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-32 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/endpoint"
                className="flex-1 bg-muted border-border font-mono text-sm"
              />
            </div>

            <Tabs defaultValue="body" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>
              <TabsContent value="body" className="mt-4">
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Request body (JSON)"
                  className="min-h-[300px] bg-muted border-border font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="headers" className="mt-4">
                <Textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder="Header-Name: value"
                  className="min-h-[300px] bg-muted border-border font-mono text-sm"
                />
              </TabsContent>
            </Tabs>

            <Button
              onClick={sendRequest}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" className="mr-2" size={16} />
                  Отправить запрос
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Icon name="Code2" className="text-secondary" size={20} />
                Response
              </CardTitle>
              {statusCode > 0 && (
                <div className="flex items-center gap-3">
                  <Badge className={
                    statusCode >= 200 && statusCode < 300 ? 'bg-primary/20 text-primary' :
                    statusCode >= 400 ? 'bg-destructive/20 text-destructive' :
                    'bg-accent/20 text-accent'
                  }>
                    {statusCode}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{responseTime}ms</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(response);
                      toast({ title: "Скопировано!", description: "Ответ скопирован в буфер" });
                    }}
                    className="border-border hover:bg-primary/10"
                  >
                    <Icon name="Copy" size={14} className="mr-1" />
                    Копировать
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded border border-border overflow-x-auto text-xs">
                  <code className="text-foreground font-mono">{response}</code>
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <Icon name="FileCode2" size={48} className="mb-4 opacity-50" />
                <p className="text-sm">Отправьте запрос для просмотра ответа</p>
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