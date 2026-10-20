# Linux Mastery

A local Linux learning game with ten beginner missions, a simulated shell, a live file tree, a free playground, and email/password accounts. The frontend uses HTML, CSS, and JavaScript modules. The account server uses Python's standard library and SQLite; there are no third-party application dependencies.

The arcade theme uses aubergine surfaces, orange action buttons, lime completion states, and Bungee display headings. Theme colors live in the `:root` variables in `dist/styles.css`. The penguin illustration is an original inline SVG in `dist/index.html`. Celebrations respect reduced-motion settings. Google Fonts supplies the typefaces, with local fallback fonts if unavailable.

This project is currently local-only. Running the preview does not upload or publish it.

Run `python3 server.py` from this directory and visit http://localhost:5173. `npm run dev` runs the same server if Node/npm is installed. Use Python 3.10+ with scrypt support. A plain static HTTP server can display the frontend but cannot provide accounts.

For a different port, run `python3 server.py --port 5174`. All paths resolve relative to `server.py`, so it can also be launched from another directory using its absolute path.

For a temporary Cloudflare Tunnel preview, start the tunnel to `http://localhost:5173`, then restart the app with `python3 server.py --public-origin https://your-exact-hostname.trycloudflare.com`. Substitute the HTTPS URL printed by your tunnel. Only that exact hostname is allowed; other tunnel hostnames remain blocked. Login uses same-origin checks and Secure cookies on the HTTPS preview, while ordinary localhost access still works. A new quick-tunnel URL requires restarting the app with the new value. The app remains bound to loopback, and accounts and progress remain on this computer. Stop the tunnel to end public access; omit the flag to return to localhost-only operation.

Run `npm test` with Node 22+ for command-engine and mission checks. Run `python3 -m unittest discover -s tests -p 'test_*.py'` for account API integration tests. The latter opens a loopback test server and uses a temporary database, keeping your real accounts untouched.

The terminal is an educational simulation, not an operating system. Supported syntax is documented in the in-app field guide. Different missions have independent workspaces; mission reset preserves earned XP. Advanced pipes, processes, services, and networking are outside this first chapter.

The layout and interactions follow GitMastery's UI: a sticky header with nav, field-guide button and XP chip; a hero with a command ticker; a player dashboard; a stage-based learning path; and a level workspace. The workspace has a milestone progress bar, a terminal panel, and a Challenge/Filesystem tabbed panel with objective checkboxes and collapsible hints. The playground puts the filesystem first, and the field guide is searchable. Linux's own palette, mascot, and copy are kept.

Each mission includes a story briefing from a fictional teammate, Maya, and a real-world use case. The briefing opens as a modal the first time a mission is entered and can be replayed with "Show Story". The list of seen briefings is kept in the UI-only localStorage key `linux-mastery-story-seen`. The `scenario` object on each lesson in `dist/lessons.js` holds its story, setting, and use case. These briefings describe a shared first-day narrative; each mission still starts with its own prepared practice filesystem.

Guest progress stays in browser localStorage. Signed-in users have separate progress saved to `.data/accounts.sqlite3`, outside the served `dist` directory. Signup offers an explicit choice to bring guest progress into the new account. Logging into an existing account loads that account's progress; logging out restores the separate guest workspace.

Passwords are stored as salted scrypt hashes. Sessions use random tokens in HttpOnly, SameSite=Strict cookies, expire after seven days, and are invalidated on logout. Only token hashes are stored in SQLite. The local server checks request origin and hostname and limits repeated login attempts. Pending or failed saves are shown in the progress bar, and logout waits for progress to save.

These are local accounts, not verified email identities. No email verification or password reset is provided. The server binds to `127.0.0.1` and is intended for local development; public hosting would need a production server, HTTPS, and a recovery flow. `.data/` is ignored by Git and should stay private. The old `.openai/hosting.json` is not used when running locally.

Visual and learning inspiration: [GitMastery](https://github.com/MikaStiebitz/Git-Mastery). This project uses original source and assets.
