"""Local Linux Mastery server: static assets, accounts, sessions, and saved progress."""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from collections import defaultdict, deque
from contextlib import contextmanager
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
SESSION_TTL = 7 * 24 * 60 * 60
COOKIE = "linux_mastery_session"
MAX_BODY = 2 * 1024 * 1024
EMPTY_PROGRESS = {"completed": [], "sessions": {}}


def public_origin(value: str) -> str:
    parsed = urlsplit(value.strip())
    hostname = parsed.hostname or ""
    if (parsed.scheme != "https" or parsed.username is not None or parsed.password is not None
            or parsed.path not in ("", "/") or parsed.query or parsed.fragment
            or len(hostname) > 253
            or not re.fullmatch(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", hostname)):
        raise ValueError("Use one exact HTTPS origin, such as https://your-preview.trycloudflare.com, with no path or wildcard.")
    port = parsed.port
    return "https://" + hostname + (f":{port}" if port and port != 443 else "")


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    # OWASP's scrypt N=2^15, r=8, p=3 work-factor option.
    digest = hashlib.scrypt(password.encode(), salt=salt, n=32768, r=8, p=3,
                            maxmem=64 * 1024 * 1024, dklen=32)
    return "scrypt$32768$8$3$" + salt.hex() + "$" + digest.hex()


def password_matches(password: str, stored: str) -> bool:
    return hmac.compare_digest(password_hash(password, bytes.fromhex(stored.split("$")[4])), stored)


def validate_progress(value: object) -> dict:
    if not isinstance(value, dict):
        raise ValueError("Progress must be an object.")
    completed, sessions = value.get("completed"), value.get("sessions")
    if not isinstance(completed, list) or len(completed) > 10 or any(type(i) is not int or not 0 <= i < 10 for i in completed):
        raise ValueError("Invalid completed missions.")
    if not isinstance(sessions, dict) or any(k not in [str(i) for i in range(-1, 10)] for k in sessions):
        raise ValueError("Invalid mission workspaces.")
    for session in sessions.values():
        if not isinstance(session, dict) or not isinstance(session.get("shell"), dict):
            raise ValueError("Invalid workspace.")
        shell = session["shell"]
        fs = shell.get("fs")
        if not isinstance(fs, dict) or len(fs) > 5000 or not isinstance(shell.get("cwd"), str):
            raise ValueError("Invalid filesystem.")
        cwd_node = fs.get(shell["cwd"])
        if not isinstance(cwd_node, dict) or cwd_node.get("type") != "dir":
            raise ValueError("Invalid working directory.")
        for path, node in fs.items():
            if not isinstance(path, str) or len(path) > 2048 or not isinstance(node, dict) or node.get("type") not in ("dir", "file"):
                raise ValueError("Invalid file.")
            if not re.fullmatch(r"[0-7]{3}", str(node.get("mode", ""))):
                raise ValueError("Invalid file permissions.")
            if node["type"] == "file" and (not isinstance(node.get("content"), str) or len(node["content"]) > 200000):
                raise ValueError("A practice file is too large to save.")
        if not isinstance(session.get("logs"), list) or len(session["logs"]) > 180:
            raise ValueError("Invalid command log.")
        if any(not isinstance(log, dict) or not isinstance(log.get("text"), str) or log.get("type") not in ("info", "command", "result", "error", "success") for log in session["logs"]):
            raise ValueError("Invalid command output.")
        if not isinstance(session.get("history"), list) or len(session["history"]) > 100 or any(not isinstance(c, str) for c in session["history"]):
            raise ValueError("Invalid command history.")
        if type(session.get("count")) is not int or session["count"] < 0:
            raise ValueError("Invalid command count.")
        if type(session.get("hints")) is not int or not 0 <= session["hints"] <= 2 or type(session.get("cleared")) is not bool:
            raise ValueError("Invalid mission state.")
    return {"completed": sorted(set(completed)), "sessions": sessions}


class Store:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
        os.close(fd)
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
                    created_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
                    expires_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS progress (
                    user_id TEXT PRIMARY KEY REFERENCES users(id),
                    data TEXT NOT NULL, updated_at REAL NOT NULL
                );
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def session(self, token: str):
        if not token:
            return None
        digest = hashlib.sha256(token.encode()).hexdigest()
        with self.connect() as db:
            row = db.execute("SELECT u.id,u.name,u.email FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?", (digest, time.time())).fetchone()
            return dict(row) if row else None

    def issue_session(self, user_id: str, old_token: str = "") -> str:
        token = secrets.token_urlsafe(32)
        with self.connect() as db:
            db.execute("DELETE FROM sessions WHERE expires_at<=? OR token_hash=?", (time.time(), hashlib.sha256(old_token.encode()).hexdigest()))
            db.execute("INSERT INTO sessions VALUES(?,?,?)", (hashlib.sha256(token.encode()).hexdigest(), user_id, time.time() + SESSION_TTL))
        return token

    def progress(self, user_id: str) -> dict:
        with self.connect() as db:
            row = db.execute("SELECT data FROM progress WHERE user_id=?", (user_id,)).fetchone()
        return json.loads(row[0]) if row else {"completed": [], "sessions": {}}


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, store, preview_origin=None):
        self.store = store
        self.failures = defaultdict(deque)
        self.attempt_lock = threading.Lock()
        super().__init__(address, Handler)
        port = self.server_address[1]
        self.origins = {f"localhost:{port}": f"http://localhost:{port}",
                        f"127.0.0.1:{port}": f"http://127.0.0.1:{port}"}
        if preview_origin:
            normalized = public_origin(preview_origin)
            self.origins[urlsplit(normalized).netloc] = normalized
        self.allowed_hosts = set(self.origins)


class Handler(SimpleHTTPRequestHandler):
    server_version = "LinuxMasteryLocal/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "dist"), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def json_response(self, status, value, cookie=None):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(body)

    def token(self):
        try:
            cookie = SimpleCookie(self.headers.get("Cookie", ""))
            return cookie[COOKIE].value if COOKIE in cookie else ""
        except Exception:
            return ""

    def user(self):
        return self.server.store.session(self.token())

    def session_cookie(self, token="", max_age=0):
        value = f"{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={max_age}"
        # Trust only the configured HTTPS hostname, not forwarded headers.
        if self.server.origins.get(self.headers.get("Host", ""), "").startswith("https://"):
            value += "; Secure"
        return value

    def host_ok(self):
        if self.headers.get("Host") not in self.server.allowed_hosts:
            self.json_response(403, {"error": "Use localhost or the explicitly configured public preview URL."})
            return False
        return True

    def mutation_ok(self):
        if not self.host_ok():
            return False
        if self.headers.get("Origin") != self.server.origins[self.headers.get("Host")]:
            self.json_response(403, {"error": "This request must come from the same app origin."})
            return False
        return True

    def read_json(self):
        if self.headers.get_content_type() != "application/json":
            raise ValueError("Send a JSON request.")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid request size.")
        if length <= 0 or length > MAX_BODY:
            raise ValueError("The request is empty or too large.")
        try:
            value = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError("Invalid JSON.")
        if not isinstance(value, dict):
            raise ValueError("Send a JSON object.")
        return value

    def do_GET(self):
        if not self.host_ok():
            return
        path = urlsplit(self.path).path
        if path == "/api/me":
            user = self.user()
            self.json_response(200, {"user": user, "progress": self.server.store.progress(user["id"]) if user else None})
        elif path == "/api/progress":
            user = self.user()
            self.json_response(200, {"progress": self.server.store.progress(user["id"])}) if user else self.json_response(401, {"error": "Log in to save your progress."})
        elif path.startswith("/api/"):
            self.json_response(404, {"error": "API route not found."})
        else:
            super().do_GET()

    def do_HEAD(self):
        if self.host_ok():
            super().do_HEAD()

    def do_POST(self):
        if not self.mutation_ok():
            return
        try:
            payload = self.read_json()
            path = urlsplit(self.path).path
            if path == "/api/auth/logout":
                with self.server.store.connect() as db:
                    db.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(self.token().encode()).hexdigest(),))
                self.json_response(200, {"ok": True}, self.session_cookie())
                return
            if path not in ("/api/auth/register", "/api/auth/login"):
                self.json_response(404, {"error": "API route not found."})
                return
            email = payload.get("email", "")
            password = payload.get("password", "")
            if not isinstance(email, str) or not isinstance(password, str):
                raise ValueError("Enter an email and password.")
            email = email.strip().lower()
            if len(email) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
                raise ValueError("Enter a valid email address.")
            if len(password) > 128:
                raise ValueError("Use a password of 128 characters or fewer.")
            key = (self.client_address[0], path, email)
            with self.server.attempt_lock:
                attempts = self.server.failures[key]
                now = time.monotonic()
                while attempts and attempts[0] <= now - 300:
                    attempts.popleft()
                if len(attempts) >= 8:
                    self.json_response(429, {"error": "Too many attempts. Try again in five minutes."})
                    return
                attempts.append(now)
            if path.endswith("register"):
                name = payload.get("name", "")
                if not isinstance(name, str) or not 1 <= len(name.strip()) <= 40:
                    raise ValueError("Choose a display name between 1 and 40 characters.")
                if len(password) < 10:
                    raise ValueError("Use at least 10 characters for your password.")
                progress = validate_progress(payload.get("progress", EMPTY_PROGRESS))
                user = {"id": secrets.token_hex(16), "name": name.strip(), "email": email}
                hashed = password_hash(password)
                try:
                    with self.server.store.connect() as db:
                        db.execute("INSERT INTO users VALUES(?,?,?,?,?)", (user["id"], user["name"], email, hashed, time.time()))
                        db.execute("INSERT INTO progress VALUES(?,?,?)", (user["id"], json.dumps(progress), time.time()))
                except sqlite3.IntegrityError:
                    self.json_response(409, {"error": "That email already has an account. Try logging in."})
                    return
            else:
                with self.server.store.connect() as db:
                    row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
                # Perform the same expensive operation for unknown email addresses.
                candidate = row["password_hash"] if row else "scrypt$32768$8$3$" + "00" * 16 + "$" + "00" * 32
                if not password_matches(password, candidate):
                    self.json_response(401, {"error": "Email or password is incorrect."})
                    return
                user = {k: row[k] for k in ("id", "name", "email")}
                progress = self.server.store.progress(user["id"])
            with self.server.attempt_lock:
                self.server.failures.pop(key, None)
            token = self.server.store.issue_session(user["id"], self.token())
            self.json_response(201 if path.endswith("register") else 200, {"user": user, "progress": progress}, self.session_cookie(token, SESSION_TTL))
        except ValueError as error:
            self.json_response(400, {"error": str(error)})
        except sqlite3.Error:
            self.json_response(503, {"error": "The local account database is busy. Please try again."})

    def do_PUT(self):
        if not self.mutation_ok():
            return
        if urlsplit(self.path).path != "/api/progress":
            self.json_response(404, {"error": "API route not found."})
            return
        user = self.user()
        if not user:
            self.json_response(401, {"error": "Your session has expired. Log in again to save."})
            return
        try:
            progress = validate_progress(self.read_json().get("progress"))
            with self.server.store.connect() as db:
                db.execute("INSERT INTO progress VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at", (user["id"], json.dumps(progress), time.time()))
            self.json_response(200, {"ok": True})
        except ValueError as error:
            self.json_response(400, {"error": str(error)})
        except sqlite3.Error:
            self.json_response(503, {"error": "Progress could not be saved. Please try again."})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=5173)
    parser.add_argument("--db", type=Path, default=ROOT / ".data" / "accounts.sqlite3")
    parser.add_argument("--public-origin", type=public_origin, help="Allow one exact HTTPS tunnel origin for a temporary shared preview.")
    args = parser.parse_args()
    os.umask(0o077)
    server = LocalServer(("127.0.0.1", args.port), Store(args.db), args.public_origin)
    print(f"Linux Mastery is ready at http://localhost:{server.server_port}", flush=True)
    print("Local accounts and progress stay on this computer. Press Ctrl+C to stop.", flush=True)
    if args.public_origin:
        print(f"Shared preview allowed at {args.public_origin} while your tunnel is running.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
