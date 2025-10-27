import json
import os
import hashlib
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Public API endpoint that validates API keys and proxies requests to GPTunnel
    Args: event with httpMethod, headers (X-Api-Key), body (model, messages)
    Returns: HTTP response with AI completion or error
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    api_key = headers.get('X-Api-Key') or headers.get('x-api-key')
    
    if not api_key:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'API key required', 'message': 'Include X-Api-Key header'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    
    try:
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, name, is_active 
                FROM api_keys 
                WHERE key_value = %s
            """, (api_key,))
            key_record = cur.fetchone()
            
            if not key_record:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid API key'}),
                    'isBase64Encoded': False
                }
            
            if not key_record['is_active']:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'API key is disabled'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE api_keys 
                SET last_used_at = %s, request_count = request_count + 1
                WHERE id = %s
            """, (datetime.now(), key_record['id']))
            conn.commit()
        
        body_data = json.loads(event.get('body', '{}'))
        model = body_data.get('model', 'gpt-4o-mini')
        messages = body_data.get('messages', [])
        temperature = body_data.get('temperature', 0.7)
        max_tokens = body_data.get('max_tokens', 1000)
        
        if not messages:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Messages array is required'}),
                'isBase64Encoded': False
            }
        
        gptunnel_key = os.environ.get('GPTUNNEL_API_KEY')
        if not gptunnel_key:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'GPTunnel not configured'}),
                'isBase64Encoded': False
            }
        
        start_time = datetime.now()
        
        response = requests.post(
            'https://gptunnel.ru/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {gptunnel_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'messages': messages,
                'temperature': temperature,
                'max_tokens': max_tokens
            },
            timeout=30
        )
        
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        if response.status_code != 200:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO api_logs (level, method, endpoint, status_code, message, duration_ms)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, ('error', 'POST', '/api/v1/completions', response.status_code, 
                      response.text[:500], duration_ms))
                conn.commit()
            
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'GPTunnel error',
                    'details': response.text
                }),
                'isBase64Encoded': False
            }
        
        result = response.json()
        usage = result.get('usage', {})
        prompt_tokens = usage.get('prompt_tokens', 0)
        completion_tokens = usage.get('completion_tokens', 0)
        total_tokens = usage.get('total_tokens', 0)
        ai_content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO request_history 
                (endpoint, method, model, prompt_tokens, completion_tokens, total_tokens, 
                 duration_ms, status_code, user_message, ai_response)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, ('/api/v1/completions', 'POST', model, prompt_tokens, 
                  completion_tokens, total_tokens, duration_ms, 200,
                  messages[-1].get('content', '')[:500] if messages else '',
                  ai_content[:1000]))
            
            cur.execute("""
                INSERT INTO token_stats (date, model, total_requests, total_tokens, 
                                        prompt_tokens, completion_tokens)
                VALUES (CURRENT_DATE, %s, 1, %s, %s, %s)
                ON CONFLICT (date, model) 
                DO UPDATE SET 
                    total_requests = token_stats.total_requests + 1,
                    total_tokens = token_stats.total_tokens + %s,
                    prompt_tokens = token_stats.prompt_tokens + %s,
                    completion_tokens = token_stats.completion_tokens + %s
            """, (model, total_tokens, prompt_tokens, completion_tokens,
                  total_tokens, prompt_tokens, completion_tokens))
            
            cur.execute("""
                INSERT INTO api_logs (level, method, endpoint, status_code, message, duration_ms)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, ('info', 'POST', '/api/v1/completions', 200, 
                  f'Success: {total_tokens} tokens', duration_ms))
            
            conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    except requests.exceptions.Timeout:
        return {
            'statusCode': 504,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Timeout', 'message': 'Request timeout after 30s'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal error', 'message': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
