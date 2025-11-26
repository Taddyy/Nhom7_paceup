"""
Tests for the Cloudflare R2 storage helpers.
"""
from __future__ import annotations

from typing import Any, Dict

import pytest
from botocore.exceptions import ClientError

from app.core.config import settings
from app.services.storage import R2StorageService, StorageError


class DummyClient:
    """Minimal S3-compatible stub for tests."""

    def __init__(self, fail_upload: bool = False):
        self.fail_upload = fail_upload
        self.upload_calls: list[Dict[str, Any]] = []

    def upload_fileobj(self, file_obj, bucket, key, ExtraArgs):
        if self.fail_upload:
            raise ClientError({"Error": {"Code": "500", "Message": "boom"}}, "upload_fileobj")
        payload = file_obj.read()
        self.upload_calls.append(
            {
                "bucket": bucket,
                "key": key,
                "content_type": ExtraArgs.get("ContentType"),
                "payload": payload,
            }
        )

    def generate_presigned_url(self, *_args, **_kwargs):
        return "https://example.com/signed"


def _patch_r2_settings(monkeypatch):
    monkeypatch.setattr(settings, "CLOUDFLARE_R2_BUCKET", "test-bucket", raising=False)
    monkeypatch.setattr(settings, "CLOUDFLARE_R2_ENDPOINT", "https://example.com", raising=False)
    monkeypatch.setattr(settings, "CLOUDFLARE_R2_PUBLIC_DOMAIN", "https://cdn.example.com", raising=False)
    monkeypatch.setattr(settings, "CLOUDFLARE_R2_ACCESS_KEY_ID", "dummy", raising=False)
    monkeypatch.setattr(settings, "CLOUDFLARE_R2_SECRET_ACCESS_KEY", "dummy", raising=False)


def test_upload_bytes_returns_metadata(monkeypatch):
    _patch_r2_settings(monkeypatch)
    service = R2StorageService(client=DummyClient())

    result = service.upload_bytes(b"hello world", content_type="application/pdf", prefix="docs")

    assert result.size == 11
    assert result.url.startswith("https://cdn.example.com/docs/")


def test_upload_bytes_raises_storage_error(monkeypatch):
    _patch_r2_settings(monkeypatch)
    service = R2StorageService(client=DummyClient(fail_upload=True))

    with pytest.raises(StorageError):
        service.upload_bytes(b"boom", content_type="application/pdf")


