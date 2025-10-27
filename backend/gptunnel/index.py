import json
import os
import requests
from typing import Dict, Any
from datetime import datetime
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: GPTunnel API proxy for AI model completions
    Args: event with httpMethod, body (model, messages, temperature)
    Returns: HTTP response with AI completion
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
    
    gptunnel_key = os.environ.get('GPTUNNEL_API_KEY')
    if not gptunnel_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'GPTunnel API key not configured'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    model = body_data.get('model', 'gpt-4')
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
    
    try:
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
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'GPTunnel API error',
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
        
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            try:
                conn = psycopg2.connect(database_url)
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO request_history 
                        (endpoint, method, model, prompt_tokens, completion_tokens, total_tokens, 
                         status_code, user_message, ai_response)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, ('/api/gptunnel/complete', 'POST', model, prompt_tokens, 
                          completion_tokens, total_tokens, 200, 
                          messages[-1].get('content', '') if messages else '',
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
                    
                    conn.commit()
                conn.close()
            except Exception:
                pass
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'model': result.get('model', model),
                'content': ai_content,
                'usage': usage,
                'finish_reason': result.get('choices', [{}])[0].get('finish_reason', 'stop')
            }),
            'isBase64Encoded': False
        }
    
    except requests.exceptions.Timeout:
        return {
            'statusCode': 504,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Request timeout', 'message': 'GPTunnel API timeout after 30s'}),
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