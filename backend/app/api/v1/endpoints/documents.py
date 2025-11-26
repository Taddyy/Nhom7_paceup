import base64
import logging
import os
import shutil
import tempfile
from typing import List, Optional

import pymupdf  # PyMuPDF
from docx import Document
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.storage import R2StorageService, StorageError, StoredObject

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_DOC_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a DOCX/PDF file to Cloudflare R2 and return its URL."""
    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF and DOCX are allowed.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_DOCUMENT_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 10MB.",
        )

    try:
        storage_service = R2StorageService()
    except StorageError as exc:
        logger.error("R2 unavailable for document upload: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Document storage is temporarily unavailable. Please try again later.",
        ) from exc

    try:
        stored_document = storage_service.upload_bytes(
            file_bytes,
            content_type=file.content_type or "application/octet-stream",
            prefix="documents/originals",
        )
    except StorageError as exc:
        logger.error("Failed to upload document to storage: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Document storage is temporarily unavailable. Please try again later.",
        ) from exc
    except Exception as exc:  # Defensive guard for unexpected boto errors
        logger.exception("Unexpected error while uploading document: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Unexpected error during document upload",
        ) from exc

    logger.info("Stored document %s (%s bytes)", stored_document.key, stored_document.size)

    return {
        "url": stored_document.url,
        "content_type": stored_document.content_type,
        "size": stored_document.size,
        "provider": "cloudflare-r2",
    }


@router.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """Analyze a PDF or DOCX document and convert to HTML with images."""
    logger.info("Starting document analysis for file: %s (content_type: %s)", 
                file.filename, file.content_type)
    
    # Initialize variables that might be used in exception handlers
    temp_filename = None
    content_html = ""
    text_html = ""
    
    # Create a unique temp file path
    temp_dir = tempfile.gettempdir()
    temp_filename = os.path.join(temp_dir, f"upload_{os.urandom(8).hex()}_{file.filename or 'document'}")
    
    try:
        # Read file content first
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        # Validate file size - do this early (before writing to temp file)
        if file_size == 0:
            logger.warning("Empty file uploaded: %s", file.filename)
            raise HTTPException(status_code=400, detail="File is empty")
        
        if file_size > MAX_DOCUMENT_BYTES:
            logger.warning("File too large: %s (%d bytes, max %d)", file.filename, file_size, MAX_DOCUMENT_BYTES)
            raise HTTPException(
                status_code=400,
                detail=f"File is too large ({file_size} bytes). Maximum allowed size is {MAX_DOCUMENT_BYTES} bytes."
            )
        
        logger.info("File read successfully: %d bytes", file_size)
        
        # Validate file type - check both content_type and extension
        file_ext = ""
        if file.filename:
            file_ext = file.filename.lower()
        
        # Check content type
        if file.content_type and file.content_type not in ALLOWED_DOC_TYPES:
            logger.warning("Unsupported content type: %s for file %s", file.content_type, file.filename)
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Only PDF and DOCX are allowed."
            )
        
        # Check file extension as fallback
        if not file_ext.endswith(('.pdf', '.docx')):
            logger.warning("Unsupported file extension: %s for file %s", file_ext, file.filename)
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload a PDF (.pdf) or DOCX (.docx) file."
            )
        
        # Write to temp file
        try:
            with open(temp_filename, "wb") as buffer:
                buffer.write(file_bytes)
            logger.debug("Temporary file created: %s", temp_filename)
        except IOError as e:
            logger.error("Failed to write temp file: %s", e)
            raise HTTPException(status_code=500, detail=f"Failed to create temporary file: {str(e)}")
        
        # Validate temp file exists and is readable
        if not os.path.exists(temp_filename):
            raise HTTPException(status_code=500, detail="Temporary file was not created")
        
        if not os.access(temp_filename, os.R_OK):
            raise HTTPException(status_code=500, detail="Temporary file is not readable")

        # Initialize storage service
        storage_service = None
        try:
            storage_service = R2StorageService()
            logger.info("R2 storage service initialized successfully")
        except StorageError as exc:
            logger.warning("R2 unavailable for document analysis: %s", exc)
            storage_service = None
        except Exception as exc:
            logger.warning("Unexpected error initializing R2 storage: %s", exc)
            storage_service = None

        stored_document: Optional[StoredObject] = None
        preview_urls: List[str] = []
        
        logger.debug("File extension detected: %s", file_ext)
        
        # Analyze DOCX
        if file_ext.endswith('.docx'):
            logger.info("Processing DOCX file")
            try:
                doc = Document(temp_filename)
                logger.debug("DOCX file opened successfully")
            except Exception as e:
                logger.error("Failed to open DOCX file: %s", e)
                raise HTTPException(status_code=400, detail=f"Invalid DOCX file: {str(e)}")
            for para in doc.paragraphs:
                text = para.text.strip()
                if not text:
                    continue
                
                # For DOCX, currently we just put everything in content_html as text
                # because docx doesn't easily support "render pages to images" without complex tools.
                # So we keep the previous behavior for DOCX for now (or user accepts text only).
                style_name = para.style.name
                tag = "p"
                if style_name.startswith('Heading 1'): tag = "h1"
                elif style_name.startswith('Heading 2'): tag = "h2"
                elif style_name.startswith('Heading 3'): tag = "h3"
                elif style_name.startswith('List Bullet'): 
                    content_html += f"<ul><li>{text}</li></ul>"
                    continue
                elif style_name.startswith('List Number'):
                    content_html += f"<ol><li>{text}</li></ol>"
                    continue
                
                content_html += f"<{tag}>{text}</{tag}>"
                text_html += f"<{tag}>{text}</{tag}>" # Also keep for SEO if needed

        # Analyze PDF with PyMuPDF (Render to Images + Text Extraction)
        elif file_ext.endswith('.pdf'):
            logger.info("Processing PDF file")
            try:
                # Try to open and validate PDF
                doc = pymupdf.open(temp_filename)
                page_count = len(doc)
                if page_count == 0:
                    doc.close()
                    raise HTTPException(status_code=400, detail="PDF file contains no pages")
                logger.info("PDF file opened successfully: %d pages", page_count)
            except HTTPException:
                # Re-raise HTTP exceptions
                raise
            except Exception as e:
                logger.error("Failed to open PDF file: %s", e)
                # Check if it's a known error type
                error_msg = str(e).lower()
                if "empty" in error_msg or "cannot open" in error_msg:
                    raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF file: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")
            
            try:
                for page_num, page in enumerate(doc):
                    try:
                        logger.debug("Processing PDF page %d/%d", page_num + 1, page_count)
                        
                        # 1. Render page to image
                        try:
                            pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))  # High resolution (2x zoom)
                            image_bytes = pix.tobytes("png")
                        except Exception as e:
                            logger.error("Failed to render PDF page %d to image: %s", page_num + 1, e)
                            # Try to extract text even if image rendering fails
                            try:
                                text = page.get_text()
                                if text.strip():
                                    text_html += f"<p>{text.replace(chr(10), '<br>')}</p>"
                            except:
                                pass
                            continue
                        
                        # Validate image bytes
                        if not image_bytes or len(image_bytes) == 0:
                            logger.warning("Empty image bytes for page %d, skipping", page_num + 1)
                            # Still try to extract text
                            try:
                                text = page.get_text()
                                if text.strip():
                                    text_html += f"<p>{text.replace(chr(10), '<br>')}</p>"
                            except:
                                pass
                            continue
                        
                        logger.debug("Rendered page %d to image: %d bytes", page_num + 1, len(image_bytes))

                        # Try to upload preview image, with fallback to base64
                        image_url = None
                        if storage_service:
                            try:
                                preview_object = storage_service.upload_bytes(
                                    image_bytes,
                                    content_type="image/png",
                                    prefix="documents/previews",
                                )
                                image_url = preview_object.url
                                preview_urls.append(image_url)
                                logger.info("Stored PDF preview page %d: %s", page_num + 1, preview_object.key)
                            except (StorageError, Exception) as e:
                                logger.error("Failed to upload PDF preview page %d: %s", page_num + 1, e)
                                # Fallback to base64 - this should never fail
                                try:
                                    data_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
                                    image_url = data_url
                                    logger.warning("Using base64 fallback for page %d", page_num + 1)
                                except Exception as base64_error:
                                    logger.error("Even base64 encoding failed for page %d: %s", page_num + 1, base64_error)
                                    # Skip this page if even base64 fails
                                    continue
                        else:
                            # No storage service, use base64
                            try:
                                data_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
                                image_url = data_url
                                logger.debug("Using inline base64 preview due to missing storage.")
                            except Exception as e:
                                logger.error("Base64 encoding failed for page %d: %s", page_num + 1, e)
                                continue

                        # Add image to content HTML
                        if image_url:
                            content_html += f'<img src="{image_url}" alt="Page {page_num + 1}" class="w-full h-auto mb-4 rounded-lg shadow-md" />'
                        
                        # 2. Extract text for SEO (hidden/collapsible content)
                        try:
                            text = page.get_text()
                            if text.strip():
                                text_html += f"<p>{text.replace(chr(10), '<br>')}</p>"
                        except Exception as e:
                            logger.warning("Failed to extract text from page %d: %s", page_num + 1, e)
                    except Exception as e:
                        logger.error("Error processing PDF page %d: %s", page_num + 1, e, exc_info=True)
                        # Continue with next page instead of failing completely
                        continue
            finally:
                doc.close()
                logger.debug("PDF document closed")
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload .docx or .pdf")

        # Upload original document to storage
        if storage_service:
            # Validate temp file exists before upload
            if not os.path.exists(temp_filename):
                logger.error("Temp file does not exist for upload: %s", temp_filename)
                stored_document = None
            else:
                try:
                    logger.info("Uploading original document to R2")
                    stored_document = storage_service.upload_file(
                        temp_filename,
                        content_type=file.content_type or "application/octet-stream",
                        prefix="documents/originals",
                    )
                    logger.info("Stored analyzed document: %s", stored_document.key)
                except StorageError as e:
                    logger.error("Failed to store analyzed document: %s", e)
                    # Don't fail the whole request if document storage fails - we still have content
                    stored_document = None
                except Exception as e:
                    logger.error("Unexpected error storing document: %s", e, exc_info=True)
                    # Don't fail the whole request
                    stored_document = None
        else:
            logger.warning("Document stored only in-memory; R2 unavailable.")
            stored_document = None

        # Build response - always return content even if storage fails
        response = {
            "content": content_html,  # Images (for PDF) or styled text (for DOCX)
            "seo_text": text_html,    # Raw text for SEO
        }

        if stored_document:
            response["document_url"] = stored_document.url
            logger.info("Response includes document URL: %s", stored_document.url)
        else:
            logger.warning("Response does not include document URL (storage failed or unavailable)")
        
        if preview_urls:
            response["preview_urls"] = preview_urls
            logger.info("Response includes %d preview URLs", len(preview_urls))
        
        # Validate that we have some content to return
        if not content_html and not text_html:
            logger.error("No content extracted from document")
            raise HTTPException(
                status_code=400, 
                detail="Could not extract any content from the document. The file may be empty or corrupted."
            )
        
        logger.info("Document analysis completed successfully. Content length: %d chars, SEO text length: %d chars", 
                   len(content_html), len(text_html))
        return response

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except StorageError as storage_error:
        logger.exception("Storage error in analyze_document: %s", storage_error)
        # Always try to return content if we have any, even if storage failed
        if content_html or text_html:
            logger.warning("Storage error but returning extracted content")
            return {
                "content": content_html,
                "seo_text": text_html,
                "warning": "Document storage failed, but content was extracted successfully"
            }
        # Only fail if we have no content at all
        raise HTTPException(status_code=500, detail=str(storage_error))
    except Exception as e:
        logger.exception("Unexpected error processing document: %s", e, exc_info=True)
        # Always try to return content if we have any
        if content_html or text_html:
            logger.warning("Unexpected error but returning extracted content")
            return {
                "content": content_html,
                "seo_text": text_html,
                "warning": f"Error occurred during processing: {str(e)}"
            }
        # Only fail if we have no content at all
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    finally:
        # Cleanup temp file
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception:
                pass
