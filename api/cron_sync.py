import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler

from server import MetaAPIError, build_dashboard_payload, build_sync_summary, cron_request_authorized, get_settings


class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        return

    def do_GET(self):
        settings = get_settings()
        if not cron_request_authorized(settings, self.headers):
            self.respond_json(HTTPStatus.UNAUTHORIZED, {
                'ok': False,
                'error': 'Unauthorized cron request.',
            })
            return

        try:
            summary = build_sync_summary(build_dashboard_payload(settings, force_refresh=True))
            self.respond_json(HTTPStatus.OK if summary['ok'] else HTTPStatus.INTERNAL_SERVER_ERROR, summary)
        except MetaAPIError as exc:
            self.respond_json(exc.status, {
                'ok': False,
                'error': exc.message,
                'details': exc.payload,
            })
        except Exception as exc:
            self.respond_json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                'ok': False,
                'error': f'Unhandled cron sync error: {exc}',
            })

    def respond_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
