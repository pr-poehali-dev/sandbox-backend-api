import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get request history and token usage statistics
    Args: event with httpMethod, queryStringParameters (action, limit)
    Returns: HTTP response with history or stats data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
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
    
    params = event.get('queryStringParameters', {})
    action = params.get('action', 'history')
    limit = int(params.get('limit', '50'))
    
    conn = psycopg2.connect(database_url)
    
    try:
        if action == 'stats':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        model,
                        SUM(total_requests) as total_requests,
                        SUM(total_tokens) as total_tokens,
                        SUM(prompt_tokens) as prompt_tokens,
                        SUM(completion_tokens) as completion_tokens
                    FROM token_stats
                    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY model
                    ORDER BY total_tokens DESC
                """)
                stats = cur.fetchall()
                
                cur.execute("""
                    SELECT 
                        date,
                        SUM(total_tokens) as tokens
                    FROM token_stats
                    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
                    GROUP BY date
                    ORDER BY date ASC
                """)
                daily = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'models': [dict(s) for s in stats],
                        'daily': [{'date': d['date'].isoformat(), 'tokens': d['tokens']} for d in daily]
                    }),
                    'isBase64Encoded': False
                }
        
        else:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        id,
                        timestamp,
                        endpoint,
                        method,
                        model,
                        prompt_tokens,
                        completion_tokens,
                        total_tokens,
                        duration_ms,
                        status_code,
                        user_message,
                        ai_response,
                        error_message
                    FROM request_history
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (limit,))
                history = cur.fetchall()
                
                result = []
                for h in history:
                    result.append({
                        'id': h['id'],
                        'timestamp': h['timestamp'].isoformat() if h['timestamp'] else '',
                        'endpoint': h['endpoint'],
                        'method': h['method'],
                        'model': h['model'],
                        'tokens': {
                            'prompt': h['prompt_tokens'],
                            'completion': h['completion_tokens'],
                            'total': h['total_tokens']
                        },
                        'duration': h['duration_ms'],
                        'status': h['status_code'],
                        'userMessage': h['user_message'][:200] if h['user_message'] else '',
                        'aiResponse': h['ai_response'][:200] if h['ai_response'] else '',
                        'error': h['error_message']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'history': result}),
                    'isBase64Encoded': False
                }
    
    finally:
        conn.close()
