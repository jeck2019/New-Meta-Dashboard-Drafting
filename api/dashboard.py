import json
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from urllib import parse

from server import MetaAPIError, build_dashboard_payload, get_settings, parse_custom_window


class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        return

    def do_GET(self):
        parsed = parse.urlparse(self.path)
        params = parse.parse_qs(parsed.query)
        force_refresh = params.get('refresh', ['0'])[0] == '1'

        try:
            custom_since, custom_until = parse_custom_window(params)
            payload = build_dashboard_payload(
                get_settings(),
                force_refresh=force_refresh,
                custom_since=custom_since,
                custom_until=custom_until,
            )
            self.respond_json(HTTPStatus.OK, payload)
        except ValueError as exc:
            self.respond_json(HTTPStatus.BAD_REQUEST, {
                'source': 'mock',
                'configured': False,
                'error': str(exc),
                'ads': [],
                'generatedAt': datetime.utcnow().isoformat() + 'Z',
            })
        except MetaAPIError as exc:
            self.respond_json(exc.status, {
                'source': 'mock',
                'configured': False,
                'error': exc.message,
                'details': exc.payload,
                'ads': [],
                'generatedAt': datetime.utcnow().isoformat() + 'Z',
            })
        except Exception as exc:
            self.respond_json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                'source': 'mock',
                'configured': False,
                'error': f'Unhandled server error: {exc}',
                'ads': [],
                'generatedAt': datetime.utcnow().isoformat() + 'Z',
            })

    def respond_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
