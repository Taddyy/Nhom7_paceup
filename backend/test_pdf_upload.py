"""
Test script for PDF upload and analysis functionality.
Tests various scenarios to ensure robustness.
"""
import os
import sys
import tempfile
import requests
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_test_pdf(pages: int = 1) -> bytes:
    """Create a simple valid PDF with specified number of pages."""
    # Minimal PDF structure
    pdf_header = b"%PDF-1.4\n"
    pdf_content = b""
    
    # Create pages
    for i in range(pages):
        obj_num = i * 2 + 1
        page_obj = f"{obj_num} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {obj_num + 1} 0 R >>\nendobj\n"
        content_obj = f"{obj_num + 1} 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Test Page {i + 1}) Tj ET\nendstream\nendobj\n"
        pdf_content += page_obj.encode() + content_obj.encode()
    
    # Catalog and pages object
    catalog_obj = b"2 0 obj\n<< /Type /Pages /Kids ["
    for i in range(pages):
        catalog_obj += f"{i * 2 + 1} 0 R ".encode()
    catalog_obj += b"] /Count " + str(pages).encode() + b" >>\nendobj\n"
    
    root_obj = b"3 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    
    # Xref table
    xref_offset = len(pdf_header) + len(pdf_content) + len(catalog_obj) + len(root_obj)
    xref = f"xref\n0 {pages * 2 + 3}\n0000000000 65535 f \n"
    for i in range(pages * 2 + 2):
        xref += f"{xref_offset + i * 50:010d} 00000 n \n"
    
    trailer = f"trailer\n<< /Size {pages * 2 + 3} /Root 3 0 R >>\nstartxref\n{xref_offset}\n%%EOF"
    
    return pdf_header + pdf_content + catalog_obj + root_obj + xref.encode() + trailer.encode()

def test_endpoint_health():
    """Test if the endpoint is accessible."""
    print("=" * 60)
    print("Test 1: Endpoint Health Check")
    print("=" * 60)
    try:
        response = requests.get("http://localhost:8000/api/v1/health", timeout=5)
        if response.status_code == 200:
            print("✓ Endpoint is accessible")
            return True
        else:
            print(f"✗ Endpoint returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend. Is it running on port 8000?")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_pdf_upload_single_page():
    """Test uploading a single-page PDF."""
    print("\n" + "=" * 60)
    print("Test 2: Single Page PDF Upload")
    print("=" * 60)
    try:
        pdf_data = create_test_pdf(pages=1)
        files = {'file': ('test_single.pdf', pdf_data, 'application/pdf')}
        
        response = requests.post(
            'http://localhost:8000/api/v1/documents/analyze',
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Upload successful!")
            print(f"  Content length: {len(data.get('content', ''))}")
            print(f"  SEO text length: {len(data.get('seo_text', ''))}")
            if 'document_url' in data:
                print(f"  Document URL: {data['document_url']}")
            if 'preview_urls' in data:
                print(f"  Preview URLs: {len(data['preview_urls'])}")
            return True
        else:
            print(f"✗ Upload failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_pdf_upload_multiple_pages():
    """Test uploading a multi-page PDF."""
    print("\n" + "=" * 60)
    print("Test 3: Multi-Page PDF Upload (5 pages)")
    print("=" * 60)
    try:
        pdf_data = create_test_pdf(pages=5)
        files = {'file': ('test_multi.pdf', pdf_data, 'application/pdf')}
        
        response = requests.post(
            'http://localhost:8000/api/v1/documents/analyze',
            files=files,
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Upload successful!")
            print(f"  Content length: {len(data.get('content', ''))}")
            print(f"  SEO text length: {len(data.get('seo_text', ''))}")
            if 'preview_urls' in data:
                print(f"  Preview URLs: {len(data['preview_urls'])}")
            return True
        else:
            print(f"✗ Upload failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_invalid_file():
    """Test uploading an invalid file."""
    print("\n" + "=" * 60)
    print("Test 4: Invalid File Upload")
    print("=" * 60)
    try:
        invalid_data = b"This is not a PDF file"
        files = {'file': ('test_invalid.txt', invalid_data, 'text/plain')}
        
        response = requests.post(
            'http://localhost:8000/api/v1/documents/analyze',
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✓ Correctly rejected invalid file")
            return True
        else:
            print(f"✗ Expected 400, got {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_empty_file():
    """Test uploading an empty file."""
    print("\n" + "=" * 60)
    print("Test 5: Empty File Upload")
    print("=" * 60)
    try:
        empty_data = b""
        files = {'file': ('test_empty.pdf', empty_data, 'application/pdf')}
        
        response = requests.post(
            'http://localhost:8000/api/v1/documents/analyze',
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✓ Correctly rejected empty file")
            return True
        else:
            print(f"✗ Expected 400, got {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_large_file():
    """Test uploading a large file (should be rejected)."""
    print("\n" + "=" * 60)
    print("Test 6: Large File Upload (should be rejected)")
    print("=" * 60)
    try:
        # Create a file larger than 10MB
        large_data = b"x" * (11 * 1024 * 1024)  # 11MB
        files = {'file': ('test_large.pdf', large_data, 'application/pdf')}
        
        response = requests.post(
            'http://localhost:8000/api/v1/documents/analyze',
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✓ Correctly rejected large file")
            return True
        else:
            print(f"✗ Expected 400, got {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("PDF Upload Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Endpoint Health", test_endpoint_health()))
    results.append(("Single Page PDF", test_pdf_upload_single_page()))
    results.append(("Multi-Page PDF", test_pdf_upload_multiple_pages()))
    results.append(("Invalid File", test_invalid_file()))
    results.append(("Empty File", test_empty_file()))
    results.append(("Large File", test_large_file()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
