#!/usr/bin/env python3
"""Build and deploy the Nakhdal app to outlandsight.com/nakhdar.

Supported protocols:
- ftp
- ftps
- sftp (requires paramiko)

Examples:
  python scripts/deploy_nakhdar.py
  python scripts/deploy_nakhdar.py --config scripts/deploy_config.json

JSON config example:
{
  "protocol": "ftps",
  "host": "ftp.outlandsight.com",
  "port": 21,
  "username": "your_username",
  "password": "your_password",
  "remote_dir": "public_html/nakhdar"
}
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import posixpath
import shutil
import subprocess
import sys
from dataclasses import dataclass
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path
from typing import Any, Iterable

ROOT_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT_DIR / "dist"
DEFAULT_REMOTE_DIR = "public_html/nakhdar"
DEFAULT_CONFIG_PATH = ROOT_DIR / "scripts" / "deploy_config.json"


@dataclass
class DeployConfig:
    protocol: str
    host: str
    port: int | None
    username: str
    password: str
    remote_dir: str
    skip_build: bool


class DeploymentError(RuntimeError):
    pass


def parse_args() -> DeployConfig:
    parser = argparse.ArgumentParser(description="Deploy Nakhdal to a web host.")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--skip-build", action="store_true")
    args = parser.parse_args()

    config_path = Path(args.config)
    if not config_path.is_absolute():
        config_path = ROOT_DIR / config_path

    raw_config = load_config_file(config_path)

    protocol = str(raw_config.get("protocol", "ftps")).lower()
    host = str(raw_config.get("host", "")).strip()
    username = str(raw_config.get("username", "")).strip()
    password = str(raw_config.get("password", "")).strip()
    remote_dir = str(raw_config.get("remote_dir", DEFAULT_REMOTE_DIR)).strip("/")
    port_value = raw_config.get("port")
    port = int(port_value) if port_value is not None else None

    if not host:
        raise DeploymentError(f"Missing host in {config_path}.")
    if not username:
        raise DeploymentError(f"Missing username in {config_path}.")
    if not password:
        raise DeploymentError(f"Missing password in {config_path}.")

    return DeployConfig(
        protocol=protocol,
        host=host,
        port=port,
        username=username,
        password=password,
        remote_dir=remote_dir,
        skip_build=args.skip_build,
    )


def load_config_file(config_path: Path) -> dict[str, Any]:
    if not config_path.exists():
        raise DeploymentError(
            f"Config file not found: {config_path}. Create it from scripts/deploy_config.example.json.",
        )

    try:
        return json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise DeploymentError(f"Invalid JSON in {config_path}: {error}") from error


def resolve_npm_command() -> list[str]:
    candidates = ["npm.cmd", "npm.exe", "npm"] if sys.platform == "win32" else ["npm"]

    for candidate in candidates:
        executable = shutil.which(candidate)
        if executable:
            return [executable]

    raise DeploymentError(
        "npm was not found in PATH. Install Node.js and ensure npm is available in your shell.",
    )


def run_build(skip_build: bool) -> None:
    if skip_build:
        if not DIST_DIR.exists():
            raise DeploymentError("dist directory is missing and --skip-build was used.")
        return

    npm_command = resolve_npm_command()
    print(f"[deploy] Building app with {' '.join(npm_command)} run build...")
    completed = subprocess.run(
        [*npm_command, "run", "build"],
        cwd=ROOT_DIR,
        check=False,
    )
    if completed.returncode != 0:
        raise DeploymentError("npm run build failed.")


def iter_local_files(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if path.is_file():
            yield path


def ensure_remote_dirs_ftp(client: FTP, remote_dir: str) -> None:
    current = ""
    for part in [segment for segment in remote_dir.split("/") if segment]:
        current = f"{current}/{part}" if current else part
        try:
            client.mkd(current)
            print(f"[deploy] Created remote directory: {current}")
        except error_perm as error:
            message = str(error)
            if not any(code in message for code in ("550", "521", "File exists")):
                raise


def upload_via_ftp(config: DeployConfig) -> None:
    ftp_class = FTP_TLS if config.protocol == "ftps" else FTP
    port = config.port or (21 if config.protocol in {"ftp", "ftps"} else None)
    assert port is not None

    print(f"[deploy] Connecting via {config.protocol.upper()} to {config.host}:{port}...")
    with ftp_class() as client:
        client.connect(config.host, port, timeout=30)
        client.login(config.username, config.password)
        if isinstance(client, FTP_TLS):
            client.prot_p()
        ensure_remote_dirs_ftp(client, config.remote_dir)

        for local_file in iter_local_files(DIST_DIR):
            relative_path = local_file.relative_to(DIST_DIR).as_posix()
            remote_path = posixpath.join(config.remote_dir, relative_path)
            remote_parent = posixpath.dirname(remote_path)
            if remote_parent:
                ensure_remote_dirs_ftp(client, remote_parent)

            print(f"[deploy] Uploading {relative_path}")
            with local_file.open("rb") as file_handle:
                client.storbinary(f"STOR {remote_path}", file_handle)


def upload_via_sftp(config: DeployConfig) -> None:
    try:
        import paramiko
    except ImportError as error:
        raise DeploymentError(
            "SFTP requires paramiko. Install it with: pip install paramiko",
        ) from error

    port = config.port or 22
    print(f"[deploy] Connecting via SFTP to {config.host}:{port}...")
    transport = paramiko.Transport((config.host, port))
    try:
        transport.connect(username=config.username, password=config.password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        try:
            ensure_remote_dirs_sftp(sftp, config.remote_dir)
            for local_file in iter_local_files(DIST_DIR):
                relative_path = local_file.relative_to(DIST_DIR).as_posix()
                remote_path = posixpath.join(config.remote_dir, relative_path)
                ensure_remote_dirs_sftp(sftp, posixpath.dirname(remote_path))
                print(f"[deploy] Uploading {relative_path}")
                sftp.put(str(local_file), remote_path)
                content_type, _ = mimetypes.guess_type(str(local_file))
                if content_type:
                    try:
                        sftp.chmod(remote_path, 0o644)
                    except OSError:
                        pass
        finally:
            sftp.close()
    finally:
        transport.close()


def ensure_remote_dirs_sftp(client, remote_dir: str) -> None:
    current = ""
    for part in [segment for segment in remote_dir.split("/") if segment]:
        current = f"{current}/{part}" if current else part
        try:
            client.stat(current)
        except OSError:
            client.mkdir(current)
            print(f"[deploy] Created remote directory: {current}")


def main() -> int:
    try:
        config = parse_args()
        run_build(config.skip_build)
        if not DIST_DIR.exists():
            raise DeploymentError("Build output directory dist was not found.")

        if config.protocol in {"ftp", "ftps"}:
            upload_via_ftp(config)
        elif config.protocol == "sftp":
            upload_via_sftp(config)
        else:
            raise DeploymentError(
                f"Unsupported protocol '{config.protocol}'. Use ftp, ftps, or sftp.",
            )

        print("[deploy] Deployment complete.")
        print("[deploy] Expected public URL: https://outlandsight.com/nakhdar/")
        return 0
    except DeploymentError as error:
        print(f"[deploy] Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
