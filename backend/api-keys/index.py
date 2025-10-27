import json
import os
import secrets
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage API keys - create, list, revoke
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with API keys data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, name, key_value, created_at, last_used_at, request_count, is_active
                    FROM api_keys
                    WHERE is_active = true
                    ORDER BY created_at DESC
                """)
                keys = cur.fetchall()
                
                result = []
                for key in keys:
                    result.append({
                        'id': key['id'],
                        'name': key['name'],
                        'key': key['key_value'],
                        'created': key['created_at'].strftime('%d %b %Y') if key['created_at'] else '',
                        'lastUsed': key['last_used_at'].strftime('%H:%M') if key['last_used_at'] else 'Не использовался',
                        'requests': key['request_count']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'keys': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name', '').strip()
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Name is required'}),
                    'isBase64Encoded': False
                }
            
            key_id = f"key_{secrets.token_hex(8)}"
            key_value = f"sk_live_{secrets.token_urlsafe(20)}"
            
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO api_keys (id, name, key_value, created_at, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                """, (key_id, name, key_value, datetime.now(), True))
                conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': key_id,
                    'name': name,
                    'key': key_value,
                    'created': datetime.now().strftime('%d %b %Y'),
                    'lastUsed': 'Не использовался',
                    'requests': 0
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            key_id = params.get('id', '')
            
            if not key_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Key ID is required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE api_keys SET is_active = false WHERE id = %s
                """, (key_id,))
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