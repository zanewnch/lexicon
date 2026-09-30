"""Same-origin gateway to Unus's existing local English services."""
import asyncio
import json
import os
import urllib.error
import urllib.request

from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt


def connection():
    url = os.environ.get('UNUS_ENGLISH_SERVICE_URL', '')
    token = os.environ.get('UNUS_ENGLISH_SERVICE_TOKEN', '')
    if not url.startswith('http://127.0.0.1:') or not token:
        raise ConnectionError('請先啟動 Unus，以使用英文本機服務')
    return url, token


@csrf_exempt
def rpc(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    # Writes must originate from the unified UI, including requests without Origin.
    origin = request.headers.get('Origin')
    expected = os.environ.get('UNUS_FRONTEND_ORIGIN')
    if origin and origin != expected:
        return JsonResponse({'error': 'Invalid local origin'}, status=403)
    if request.headers.get('X-Unus-Client') != 'web' or request.headers.get('Sec-Fetch-Site') == 'cross-site':
        return JsonResponse({'error': 'Invalid local client'}, status=403)
    if len(request.body) > 256 * 1024:
        return JsonResponse({'error': 'Request too large'}, status=413)
    try:
        url, token = connection()
        body = json.loads(request.body)
        upstream = urllib.request.Request(url + '/rpc', data=json.dumps(body).encode(), headers={
            'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json',
        })
        # Model inference/downloads can take minutes; browser cancellation does not
        # cause the model operation to be executed a second time.
        with urllib.request.urlopen(upstream, timeout=7200) as result:
            return JsonResponse(json.load(result))
    except urllib.error.HTTPError as error:
        try:
            payload = json.loads(error.read())
        except (ValueError, UnicodeError):
            payload = {'error': '英文本機服務拒絕此操作'}
        return JsonResponse(payload, status=error.code)
    except (ConnectionError, OSError):
        return JsonResponse({'error': '英文本機服務未連線，請確認 Unus 正在運行'}, status=503)
    except (ValueError, UnicodeError):
        return JsonResponse({'error': '英文請求格式不正確'}, status=400)


async def events(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if request.headers.get('Sec-Fetch-Site') == 'cross-site':
        return JsonResponse({'error': 'Invalid local client'}, status=403)
    try:
        url, token = connection()
        from urllib.parse import urlsplit
        port = urlsplit(url).port
        reader, writer = await asyncio.open_connection('127.0.0.1', port)
        writer.write((f'GET /events HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nAuthorization: Bearer {token}\r\nConnection: close\r\n\r\n').encode())
        await writer.drain()
        header = await asyncio.wait_for(reader.readuntil(b'\r\n\r\n'), timeout=5)
        if not header.startswith(b'HTTP/1.1 200'):
            writer.close()
            return JsonResponse({'error': '英文事件服務未連線'}, status=503)
    except (ConnectionError, OSError, asyncio.TimeoutError, asyncio.IncompleteReadError):
        return JsonResponse({'error': '英文本機服務未連線，請先啟動 Unus'}, status=503)

    async def stream():
        try:
            # Node uses HTTP chunk framing. Decode each chunk before passing SSE.
            while True:
                line = await reader.readline()
                if not line:
                    break
                length = int(line.split(b';', 1)[0].strip(), 16)
                if not length:
                    break
                yield await reader.readexactly(length)
                await reader.readexactly(2)
        except (OSError, ValueError, asyncio.IncompleteReadError):
            yield b'event: unavailable\ndata: {}\n\n'
        finally:
            writer.close()
            await writer.wait_closed()

    response = StreamingHttpResponse(stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response
