import json
import os
import secrets
import requests
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage webhooks - create, list, test, delete
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with webhooks data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'list')
            
            if action == 'test':
                webhook_id = event.get('queryStringParameters', {}).get('id', '')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT url FROM webhooks WHERE id = %s", (webhook_id,))
                    webhook = cur.fetchone()
                    
                    if not webhook:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Webhook not found'}),
                            'isBase64Encoded': False
                        }
                    
                    test_payload = {
                        'event': 'test.ping',
                        'timestamp': datetime.now().isoformat(),
                        'data': {'message': 'Test webhook from API Hub'}
                    }
                    
                    try:
                        response = requests.post(
                            webhook['url'],
                            json=test_payload,
                            timeout=10,
                            headers={'Content-Type': 'application/json'}
                        )
                        success = response.status_code < 400
                        
                        with conn.cursor() as cur_update:
                            if success:
                                cur_update.execute("""
                                    UPDATE webhooks 
                                    SET last_delivery_at = %s, success_count = success_count + 1
                                    WHERE id = %s
                                """, (datetime.now(), webhook_id))
                            else:
                                cur_update.execute("""
                                    UPDATE webhooks 
                                    SET failure_count = failure_count + 1
                                    WHERE id = %s
                                """, (webhook_id,))
                            conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': success,
                                'status': response.status_code,
                                'message': 'Test completed'
                            }),
                            'isBase64Encoded': False
                        }
                    except Exception as e:
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': False,
                                'message': str(e)
                            }),
                            'isBase64Encoded': False
                        }
            
            else:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, url, events, is_enabled, last_delivery_at, 
                               success_count, failure_count
                        FROM webhooks
                        ORDER BY created_at DESC
                    """)
                    webhooks = cur.fetchall()
                    
                    result = []
                    for wh in webhooks:
                        total = wh['success_count'] + wh['failure_count']
                        success_rate = (wh['success_count'] / total * 100) if total > 0 else 100
                        
                        result.append({
                            'id': wh['id'],
                            'url': wh['url'],
                            'events': wh['events'],
                            'enabled': wh['is_enabled'],
                            'lastDelivery': wh['last_delivery_at'].strftime('%H:%M') if wh['last_delivery_at'] else 'Не использовался',
                            'successRate': round(success_rate, 1)
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'webhooks': result}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            url = body_data.get('url', '').strip()
            events = body_data.get('events', ['chat.message'])
            
            if not url:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'URL is required'}),
                    'isBase64Encoded': False
                }
            
            webhook_id = f"wh_{secrets.token_hex(8)}"
            
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO webhooks (id, url, events, is_enabled, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (webhook_id, url, events, True, datetime.now()))
                conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': webhook_id,
                    'url': url,
                    'events': events,
                    'enabled': True,
                    'lastDelivery': 'Не использовался',
                    'successRate': 100.0
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            webhook_id = params.get('id', '')
            
            if not webhook_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Webhook ID is required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute("DELETE FROM webhooks WHERE id = %s", (webhook_id,))
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()