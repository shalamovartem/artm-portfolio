"""Run against a temporary data directory; never touches the working site's data."""
import copy
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def run():
    with tempfile.TemporaryDirectory(prefix='artm-test-') as directory:
        username = 'qa'
        password = secrets.token_urlsafe(24)
        salt = secrets.token_hex(16)
        admin = {
            'username': username,
            'salt': salt,
            'hash': hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64).hex(),
            'secret': secrets.token_hex(32),
        }
        Path(directory, 'admin.json').write_text(json.dumps(admin))
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        base = f'http://127.0.0.1:{port}'
        env = {**os.environ, 'DATA_DIR': directory, 'PORT': str(port), 'PUBLIC_ORIGIN': base}
        process = subprocess.Popen([shutil.which('node') or 'node', 'server.cjs'], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        jar = http.cookiejar.CookieJar()
        client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

        def request(path, body=None, method=None, origin=base):
            req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, method=method,
                                         headers={'Origin': origin, 'Content-Type': 'application/json'})
            try:
                with client.open(req, timeout=15) as response:
                    return response.status, response.read().decode()
            except urllib.error.HTTPError as error:
                return error.code, error.read().decode()

        try:
            for _ in range(100):
                try:
                    if request('/api/document')[0] == 200:
                        break
                except urllib.error.URLError:
                    time.sleep(.1)
            else:
                raise AssertionError('Test server failed to start')
            assert request('/api/document?draft=1')[0] == 401
            assert request('/api/places?q=Moscow')[0] == 401
            assert request('/api/auth', {'username': username, 'password': password}, 'POST', 'https://invalid.example')[0] == 403
            assert request('/api/auth', {'username': username, 'password': password}, 'POST')[0] == 200
            state = json.loads(request('/api/document?draft=1')[1])
            doc, revision = state['document'], state['revision']
            status, licenses = request('/licenses')
            assert status == 200 and 'GNU GPL v3' in licenses and 'OpenFreeMap' in licenses
            assert request('/legal/GPL-3.0.txt')[0] == 200
            assert request('/legal/THIRD-PARTY-NOTICES.txt')[0] == 200
            assert all(not p['slug'].startswith('aglicense') for p in doc['projects'])
            assert request('/projects/aglicense')[0] == 404
            assert all('latitude' in card and 'icon' in card for card in doc['cards'])
            assert all('description' in section for section in doc['sections'])
            doc['cards'][0].update(url='/?section=photos', icon='vk')
            location = next(card for card in doc['cards'] if card['type'] == 'map')
            location.update(title='Москва', latitude=55.7558, longitude=37.6173, mapZoom=10)
            doc['sections'][0]['description'] = 'Редактируемое описание'
            root_page = copy.deepcopy(doc['projects'][0])
            root_page.update(slug='qa-root', location='root', browserTitle='QA root title')
            doc['projects'].append(root_page)

            def save(document, action='draft'):
                return request('/api/document', {'document': document, 'revision': revision, 'action': action}, 'PUT')

            status, raw = save(doc)
            assert status == 200, raw
            revision = json.loads(raw)['revision']
            saved = json.loads(request('/api/document?draft=1')[1])['document']
            assert next(c for c in saved['cards'] if c['type'] == 'map')['latitude'] == 55.7558
            assert saved['cards'][0]['icon'] == 'vk'
            assert request('/qa-root?edit=1')[0] == 200
            assert request('/qa-root')[0] == 404
            assert request('/projects/qa-root?edit=1')[0] == 404
            for field, value in [('latitude', 91), ('longitude', -181), ('mapZoom', 30), ('url', 'javascript:alert(1)')]:
                invalid = copy.deepcopy(doc)
                invalid['cards'][0][field] = value
                assert save(invalid)[0] == 400, field
            invalid = copy.deepcopy(doc)
            invalid['projects'][-1]['slug'] = 'login'
            assert save(invalid)[0] == 400
            assert save(doc, 'publish')[0] == 200
            assert 'QA root title' in request('/qa-root')[1]
            for path in ['/api/weather?latitude=91&longitude=20', '/api/weather?latitude=x&longitude=0', '/api/weather?latitude=&longitude=0']:
                assert request(path)[0] == 400
            cookie = http.cookiejar.Cookie(0, 'portfolio_theme', 'light', None, False, '127.0.0.1', False, False, '/', True, False, None, False, None, None, {})
            jar.set_cookie(cookie)
            assert 'site light' in request('/')[1]
            assert 'site light' in request('/qa-root')[1]
            assert request('/api/auth', method='DELETE')[0] == 200
            assert request('/api/document?draft=1')[0] == 401
            print('PASS: isolated auth, CSRF, sections, root pages, icons, location persistence, invalid coordinates, theme across routes, logout')
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    run()
