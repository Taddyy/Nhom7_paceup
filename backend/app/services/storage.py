"""
Cloudflare R2 storage service helpers.
"""
from __future__ import annotations

import io
import logging
import os
import uuid
from dataclasses import dataclass
from typing import BinaryIO, Optional

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings


logger = logging.getLogger(__name__)


class StorageError(RuntimeError):
    """Raised when document storage fails."""


@dataclass
class StoredObject:
    """Metadata for an uploaded object."""

    key: str
    url: str
    content_type: str
    size: int


def _default_endpoint() -> Optional[str]:
    if settings.CLOUDFLARE_R2_ACCOUNT_ID:
        return f"https://{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return None


class R2StorageService:
    """Upload helper that wraps the S3-compatible R2 API."""

    def __init__(self, client: Optional[BaseClient] = None):
        bucket = settings.CLOUDFLARE_R2_BUCKET

        if not bucket:
            raise StorageError("CLOUDFLARE_R2_BUCKET is not configured")

        endpoint_url = settings.CLOUDFLARE_R2_ENDPOINT or _default_endpoint()
        if not endpoint_url:
            raise StorageError("R2 endpoint is not configured")

        access_key = settings.CLOUDFLARE_R2_ACCESS_KEY_ID
        secret_key = settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY

        if not client:
            if not access_key or not secret_key:
                raise StorageError("R2 credentials are not configured")

            session = boto3.session.Session()
            client = session.client(
                "s3",
                region_name=os.getenv("CLOUDFLARE_R2_REGION", "auto"),
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                config=Config(signature_version="s3v4"),
            )

        self._client = client
        self._bucket = bucket
        self._public_base_url = (settings.CLOUDFLARE_R2_PUBLIC_DOMAIN or f"{endpoint_url}/{bucket}").rstrip("/")

    def upload_bytes(self, data: bytes, *, content_type: str, prefix: str = "documents") -> StoredObject:
        """Upload bytes to Cloudflare R2."""
        stream = io.BytesIO(data)
        stream.seek(0)  # Ensure stream is at the beginning
        return self._upload_stream(stream, size=len(data), content_type=content_type, prefix=prefix)

    def upload_file(self, file_path: str, *, content_type: str, prefix: str = "documents") -> StoredObject:
        """Upload a local file path."""
        with open(file_path, "rb") as file_obj:
            data = file_obj.read()
        return self.upload_bytes(data, content_type=content_type, prefix=prefix)

    def _upload_stream(
        self,
        file_obj: BinaryIO,
        *,
        size: int,
        content_type: str,
        prefix: str,
    ) -> StoredObject:
        """
        Upload a file-like object to R2 storage.
        
        Args:
            file_obj: Binary file-like object to upload
            size: Size of the data in bytes
            content_type: MIME type of the content
            prefix: Prefix for the object key in R2
            
        Returns:
            StoredObject with metadata about the uploaded file
            
        Raises:
            StorageError: If upload fails for any reason
        """
        object_key = f"{prefix.rstrip('/')}/{uuid.uuid4().hex}"

        try:
            # Validate stream state
            if not hasattr(file_obj, 'read'):
                raise StorageError("Invalid file object: missing read method")
            
            # Ensure file pointer is at the beginning
            if hasattr(file_obj, 'seek'):
                try:
                    current_pos = file_obj.tell() if hasattr(file_obj, 'tell') else None
                    file_obj.seek(0)
                    logger.debug("Stream position reset from %s to 0", current_pos)
                except (IOError, OSError, AttributeError) as e:
                    logger.error("Failed to seek stream to beginning: %s", e)
                    raise StorageError(f"Stream is not seekable or closed: {str(e)}") from e
            
            # Validate stream is readable and not closed
            if hasattr(file_obj, 'closed') and file_obj.closed:
                raise StorageError("Cannot upload: stream is closed")
            
            # Validate size
            if size <= 0:
                raise StorageError(f"Invalid size: {size} bytes")
            
            logger.debug("Uploading to R2: bucket=%s, key=%s, size=%d, content_type=%s", 
                        self._bucket, object_key, size, content_type)
            
            # Perform the upload
            self._client.upload_fileobj(
                file_obj,
                self._bucket,
                object_key,
                ExtraArgs={"ContentType": content_type},
            )
            
            logger.info("Successfully uploaded to R2: %s (%d bytes)", object_key, size)
            
        except ClientError as exc:
            error_code = exc.response.get('Error', {}).get('Code', 'Unknown')
            error_message = exc.response.get('Error', {}).get('Message', str(exc))
            request_id = exc.response.get('ResponseMetadata', {}).get('RequestId', 'N/A')
            logger.exception(
                "AWS ClientError uploading to R2 (code=%s, request_id=%s): %s", 
                error_code, request_id, error_message
            )
            raise StorageError(
                f"Failed to upload document to storage: {error_code} - {error_message}"
            ) from exc
        except BotoCoreError as exc:
            logger.exception("BotoCoreError uploading to R2: %s", exc)
            raise StorageError(f"Failed to upload document to storage: {str(exc)}") from exc
        except Exception as exc:
            logger.exception("Unexpected error uploading to R2: %s", exc)
            raise StorageError(f"Failed to upload document to storage: {str(exc)}") from exc

        url = f"{self._public_base_url}/{object_key}"
        return StoredObject(key=object_key, url=url, content_type=content_type, size=size)

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Return a signed URL for private objects."""
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except (ClientError, BotoCoreError) as exc:
            logger.exception("Failed to generate presigned URL for %s", key)
            raise StorageError("Failed to generate download URL") from exc


