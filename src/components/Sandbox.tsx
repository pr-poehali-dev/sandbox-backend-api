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
  const [method, setMethod] = useState('POST');
  const [endpoint, setEndpoint] = useState('/api/gptunnel/complete');
  const [requestBody, setRequestBody] = useState(`{
  "model": "gpt-4",
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
      if (endpoint === '/api/gptunnel/complete') {
        const body = JSON.parse(requestBody);
        const result = await gptunnelService.complete(body);
        
        const duration = Date.now() - startTime;
        setResponseTime(duration);
        setStatusCode(200);
        setResponse(JSON.stringify(result, null, 2));
        
        toast({
          title: "Запрос выполнен",
          description: `200 OK • ${duration}ms`,
        });
      } else {
        const headerObj: Record<string, string> = {};
        headers.split('\n').forEach(line => {
          const [key, ...values] = line.split(':');
          if (key && values.length > 0) {
            headerObj[key.trim()] = values.join(':').trim();
          }
        });

        const res = await fetch(`https://api.example.com${endpoint}`, {
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
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setResponseTime(duration);
      setStatusCode(error instanceof Error && error.message.includes('GPTunnel') ? 500 : 0);
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

  const quickRequests = [
    {
      name: 'GPT-4 Chat',
      method: 'POST',
      endpoint: '/api/gptunnel/complete',
      body: `{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Напиши короткую историю про космонавта"}
  ]
}`
    },
    {
      name: 'Claude-3 Assistant',
      method: 'POST',
      endpoint: '/api/gptunnel/complete',
      body: `{
  "model": "claude-3",
  "messages": [
    {"role": "user", "content": "Объясни квантовую физику простыми словами"}
  ]
}`
    },
    {
      name: 'Get Webhooks',
      method: 'GET',
      endpoint: '/api/webhooks',
      body: ''
    },
  ];

  const loadQuickRequest = (req: typeof quickRequests[0]) => {
    setMethod(req.method);
    setEndpoint(req.endpoint);
    setRequestBody(req.body);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">API Sandbox</h2>
        <p className="text-muted-foreground">Тестирование API запросов в реальном времени</p>
      </div>

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

      <Card className="bg-card border-border border-secondary/30">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Icon name="BookOpen" className="text-secondary" size={20} />
            Документация API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-foreground mb-2">GPTunnel Integration</h4>
            <p className="text-muted-foreground mb-2">
              Endpoint: <code className="text-primary font-mono text-xs">/api/gptunnel/complete</code>
            </p>
            <p className="text-muted-foreground">
              Поддерживаемые модели: GPT-4, GPT-3.5 Turbo, Claude-3, Gemini Pro
            </p>
          </div>
          <div className="pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground mb-2">Webhooks API</h4>
            <p className="text-muted-foreground">
              GET <code className="text-secondary font-mono text-xs">/api/webhooks</code> - список webhooks
            </p>
            <p className="text-muted-foreground">
              POST <code className="text-primary font-mono text-xs">/api/webhooks</code> - создать webhook
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}