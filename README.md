# Nakhdal

Simple Algerian-to-French vocabulary trainer built with React, TypeScript, and Vite.

## Run

```bash
npm install
npm run dev
```

## Deploy

The app is built for the `/nakhdar/` subpath on `outlandsight.com`.

1. Copy the example config:
```bash
Copy-Item scripts\deploy_config.example.json scripts\deploy_config.json
```

2. Fill in your real hosting credentials in `scripts/deploy_config.json`.

3. Run deploy:
```bash
python scripts/deploy_nakhdar.py
```

Optional:
```bash
python scripts/deploy_nakhdar.py --config scripts/deploy_config.json
python scripts/deploy_nakhdar.py --skip-build
```

Supported protocols:
- `ftp`
- `ftps`
- `sftp` (requires `pip install paramiko`)
