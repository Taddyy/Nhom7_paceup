from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from docx import Document
from pypdf import PdfReader
import pymupdf  # PyMuPDF
import tempfile
import uuid

router = APIRouter()

@router.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    # Create a unique temp file path
    temp_dir = tempfile.gettempdir()
    temp_filename = os.path.join(temp_dir, f"upload_{os.urandom(8).hex()}_{file.filename}")
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        content_html = ""
        text_html = "" # Store raw text separately
        
        # Analyze DOCX
        if file.filename.lower().endswith('.docx'):
            doc = Document(temp_filename)
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
        elif file.filename.lower().endswith('.pdf'):
            doc = pymupdf.open(temp_filename)
            
            # Directory to save generated images
            upload_dir = os.path.join(os.getcwd(), 'public/uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            for page_num, page in enumerate(doc):
                # 1. Render page to image
                pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2)) # High resolution (2x zoom)
                image_filename = f"{uuid.uuid4()}.png"
                image_path = os.path.join(upload_dir, image_filename)
                pix.save(image_path)
                
                # Generate Image HTML
                # Use absolute URL pointing to backend
                image_url = f"http://localhost:8000/uploads/{image_filename}"
                content_html += f'<img src="{image_url}" alt="Page {page_num + 1}" class="w-full h-auto mb-4 rounded-lg shadow-md" />'
                
                # 2. Extract text for SEO (hidden/collapsible content)
                text = page.get_text()
                if text.strip():
                     text_html += f"<p>{text.replace(chr(10), '<br>')}</p>"
            
            doc.close()
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload .docx or .pdf")

        return {
            "content": content_html, # Images (for PDF) or styled text (for DOCX)
            "seo_text": text_html    # Raw text for SEO
        }

    except Exception as e:
        print(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    finally:
        # Cleanup temp file
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception:
                pass
