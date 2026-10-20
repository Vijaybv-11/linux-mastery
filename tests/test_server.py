import contextlib
import http.client
import json
import sqlite3
import tempfile
import threading
import time
import unittest
from pathlib import Path

from server import COOKIE, LocalServer, Store, password_hash, password_matches, public_origin


class AccountsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.db_path = Path(cls.temp.name) / 'accounts.sqlite3'
        cls.store = Store(cls.db_path)
        cls.server = LocalServer(('127.0.0.1', 0), cls.store)
        cls.port = cls.server.server_port
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.temp.cleanup()

    def setUp(self):
        with self.store.connect() as db:
            db.execute('DELETE FROM sessions')
            db.execute('DELETE FROM progress')
            db.execute('DELETE FROM users')
        self.server.failures.clear()

    def request(self, path, method='GET', payload=None, cookie='', origin=None, host=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.port)
        headers = {'Host': host or f'127.0.0.1:{self.port}'}
        if cookie:
            headers['Cookie'] = cookie
        if payload is not None:
            headers['Content-Type'] = 'application/json'
            headers['Origin'] = origin or f'http://127.0.0.1:{self.port}'
        connection.request(method, path, body=json.dumps(payload) if payload is not None else None, headers=headers)
        response = connection.getresponse()
        body = response.read()
        result = json.loads(body) if response.getheader('Content-Type', '').startswith('application/json') else body
        cookie_header = response.getheader('Set-Cookie', '')
        status = response.status
        connection.close()
        return status, result, cookie_header

    def register(self, email='one@example.com', progress=None):
        return self.request('/api/auth/register', 'POST', {'name': 'Explorer', 'email': email, 'password': 'a long test passphrase', 'progress': progress or {'completed': [], 'sessions': {}}})

    def test_passwords_use_distinct_salted_hashes(self):
        first, second = password_hash('a test passphrase'), password_hash('a test passphrase')
        self.assertNotEqual(first, second)
        self.assertTrue(password_matches('a test passphrase', first))
        self.assertFalse(password_matches('wrong passphrase', first))

    def test_register_sets_http_only_cookie_and_no_password_in_response(self):
        status, result, cookie = self.register()
        self.assertEqual(status, 201)
        self.assertIn('HttpOnly', cookie)
        self.assertIn('SameSite=Strict', cookie)
        self.assertNotIn('password', json.dumps(result))
        self.assertNotIn('token', json.dumps(result))
        status, me, _ = self.request('/api/me', cookie=cookie.split(';')[0])
        self.assertEqual(status, 200)
        self.assertEqual(me['user']['email'], 'one@example.com')
        with self.store.connect() as db:
            self.assertNotIn('a long test passphrase', db.execute('SELECT password_hash FROM users').fetchone()[0])
            self.assertNotIn(cookie.split('=', 1)[1].split(';')[0], db.execute('SELECT token_hash FROM sessions').fetchone()[0])

    def test_login_handles_case_and_logs_out(self):
        self.register()
        status, user, cookie = self.request('/api/auth/login', 'POST', {'email': 'ONE@EXAMPLE.COM', 'password': 'a long test passphrase'})
        self.assertEqual(status, 200)
        cookie = cookie.split(';')[0]
        self.assertEqual(self.request('/api/auth/logout', 'POST', {}, cookie=cookie)[0], 200)
        self.assertIsNone(self.request('/api/me', cookie=cookie)[1]['user'])

    def test_wrong_password_and_unknown_email_have_same_error(self):
        self.register()
        first = self.request('/api/auth/login', 'POST', {'email': 'one@example.com', 'password': 'wrong'})
        second = self.request('/api/auth/login', 'POST', {'email': 'unknown@example.com', 'password': 'wrong'})
        self.assertEqual(first[:2], second[:2])
        self.assertEqual(first[0], 401)

    def test_progress_is_separate_for_each_user(self):
        _, _, first = self.register()
        first = first.split(';')[0]
        self.assertEqual(self.request('/api/progress', 'PUT', {'progress': {'completed': [0, 1], 'sessions': {}}}, cookie=first)[0], 200)
        _, _, second = self.register('two@example.com')
        second = second.split(';')[0]
        self.assertEqual(self.request('/api/progress', cookie=second)[1]['progress']['completed'], [])
        self.assertEqual(self.request('/api/progress', cookie=first)[1]['progress']['completed'], [0, 1])
        self.assertEqual(self.request('/api/progress')[0], 401)
        self.assertEqual(self.request('/api/progress', 'PUT', {'progress': {'completed': [9], 'sessions': {}}})[0], 401)

    def test_imported_progress_survives_reconnection(self):
        _, _, cookie = self.register(progress={'completed': [0, 2], 'sessions': {}})
        self.assertEqual(self.request('/api/me', cookie=cookie.split(';')[0])[1]['progress']['completed'], [0, 2])
        reopened = Store(self.db_path)
        with reopened.connect() as db:
            user_id = db.execute('SELECT id FROM users').fetchone()[0]
        self.assertEqual(reopened.progress(user_id)['completed'], [0, 2])

    def test_cross_origin_and_untrusted_host_are_rejected(self):
        payload = {'name': 'X', 'email': 'x@example.com', 'password': 'test passphrase'}
        self.assertEqual(self.request('/api/auth/register', 'POST', payload, origin='https://other.example')[0], 403)
        self.assertEqual(self.request('/api/me', host='attacker.example')[0], 403)

    def test_tunnel_host_is_rejected_without_opt_in(self):
        self.assertEqual(self.request('/api/me', host='preview.trycloudflare.com')[0], 403)

    def test_https_preview_origin_validation(self):
        self.assertEqual(public_origin('https://Preview.trycloudflare.com:443/'), 'https://preview.trycloudflare.com')
        for value in ['http://preview.trycloudflare.com', 'https://*.trycloudflare.com', 'https://x.example/path', 'https://user:password@x.example', 'https://x.example?query=1', 'https://x.example#fragment']:
            with self.assertRaises(ValueError, msg=value):
                public_origin(value)

    def test_opted_in_tunnel_preserves_host_origin_and_cookie_protection(self):
        preview = LocalServer(('127.0.0.1', 0), self.store, 'https://preview.trycloudflare.com')
        thread = threading.Thread(target=preview.serve_forever, daemon=True)
        thread.start()
        local_port = self.port
        try:
            self.port = preview.server_port
            host, origin = 'preview.trycloudflare.com', 'https://preview.trycloudflare.com'
            self.assertEqual(self.request('/api/me', host=host)[0], 200)
            self.assertEqual(self.request('/api/me', host='other.trycloudflare.com')[0], 403)
            payload = {'name': 'Tunnel Explorer', 'email': 'tunnel@example.com', 'password': 'a long test passphrase'}
            for wrong_origin in ['http://preview.trycloudflare.com', 'https://attacker.example', f'http://localhost:{self.port}']:
                self.assertEqual(self.request('/api/auth/register', 'POST', payload, host=host, origin=wrong_origin)[0], 403)
            status, _, cookie = self.request('/api/auth/register', 'POST', payload, host=host, origin=origin)
            self.assertEqual(status, 201)
            self.assertIn('; Secure', cookie)
            self.assertIn('HttpOnly', cookie)
            cookie = cookie.split(';')[0]
            self.assertEqual(self.request('/api/me', host=host, cookie=cookie)[1]['user']['email'], 'tunnel@example.com')
            status, _, cleared = self.request('/api/auth/logout', 'POST', {}, host=host, origin=origin, cookie=cookie)
            self.assertEqual(status, 200)
            self.assertIn('; Secure', cleared)
            self.assertIn('Max-Age=0', cleared)
            self.assertEqual(self.request('/')[0], 200)
        finally:
            self.port = local_port
            preview.shutdown()
            preview.server_close()

    def test_invalid_account_and_progress_are_rejected(self):
        self.assertEqual(self.request('/api/auth/register', 'POST', {'name': 'X', 'email': 'x@example.com', 'password': 'short'})[0], 400)
        _, _, cookie = self.register()
        cookie = cookie.split(';')[0]
        for progress in [{'completed': [999], 'sessions': {}}, {'completed': [True], 'sessions': {}}, {'completed': [], 'sessions': {'0': {'shell': {'cwd': '/', 'fs': {'/': []}}}}}]:
            self.assertEqual(self.request('/api/progress', 'PUT', {'progress': progress}, cookie=cookie)[0], 400)

    def test_expired_sessions_and_duplicate_emails(self):
        _, _, cookie = self.register()
        self.assertEqual(self.register()[0], 409)
        with self.store.connect() as db:
            db.execute('UPDATE sessions SET expires_at=?', (time.time() - 1,))
        self.assertIsNone(self.request('/api/me', cookie=cookie.split(';')[0])[1]['user'])

    def test_login_attempts_are_limited(self):
        for _ in range(8):
            self.assertEqual(self.request('/api/auth/login', 'POST', {'email': 'x@example.com', 'password': 'wrong'})[0], 401)
        self.assertEqual(self.request('/api/auth/login', 'POST', {'email': 'x@example.com', 'password': 'wrong'})[0], 429)

    def test_private_database_and_source_are_not_served(self):
        self.assertEqual(self.request('/')[0], 200)
        for path in ['/.data/accounts.sqlite3', '/server.py', '/.openai/hosting.json', '/../server.py']:
            self.assertEqual(self.request(path)[0], 404, path)


if __name__ == '__main__':
    unittest.main()
