'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { useState } from 'react'

const buildDocumentsAnalyzeUrl = (): string => {
  const envBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

  if (!envBase) {
    return '/api/v1/documents/analyze'
  }

  if (envBase.endsWith('/api/v1')) {
    return `${envBase}/documents/analyze`
  }

  if (envBase.endsWith('/api')) {
    return `${envBase}/v1/documents/analyze`
  }

  return `${envBase}/api/v1/documents/analyze`
}

const buildDocumentAnalyzeFallbacks = (): string[] => {
  const primary = buildDocumentsAnalyzeUrl()
  const fallbacks = ['/api/v1/documents/analyze', 'http://localhost:8000/api/v1/documents/analyze']

  return [primary, ...fallbacks.filter((url) => url !== primary)]
}

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSEOContent?: (seoContent: string) => void // Callback for SEO content
  placeholder?: string
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'

interface DocumentUploadState {
  status: UploadStatus
  message?: string
}

type DocumentUploadStateSetter = (
  value: DocumentUploadState | ((prev: DocumentUploadState) => DocumentUploadState)
) => void

const MenuBar = ({
  editor,
  onSEOContent,
  documentUploadState,
  setDocumentUploadState,
}: {
  editor: any
  onSEOContent?: (content: string) => void
  documentUploadState: DocumentUploadState
  setDocumentUploadState: DocumentUploadStateSetter
}) => {
  if (!editor) {
    return null
  }
  // ... existing code ...

  const addImageUpload = () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = 'image/*';
     input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                // Use existing upload API
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if(response.ok) {
                    const data = await response.json();
                    editor.chain().focus().setImage({ src: data.url }).run();
                } else {
                    alert('Upload failed');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error uploading image');
            }
        }
     };
     input.click();
  }

  const clearStatusSoon = () => {
    window.setTimeout(() => {
      setDocumentUploadState({ status: 'idle' })
    }, 2500)
  }

  const handleDocumentUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx, .pdf'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)

        try {
          setDocumentUploadState({
            status: 'uploading',
            message: 'Đang tải tệp lên máy chủ...',
          })
          const endpoints = buildDocumentAnalyzeFallbacks()
          let response: Response | null = null
          let lastError: unknown = null

          for (const [index, endpoint] of endpoints.entries()) {
            setDocumentUploadState({
              status: 'uploading',
              message: `Đang tải lên... (thử ${index + 1}/${endpoints.length})`,
            })
            try {
              response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
              })

              if (response.ok) {
                break
              }

              lastError = new Error(`Document analyzer returned ${response.status} for ${endpoint}`)
            } catch (error) {
              lastError = error
            }
          }

          if (!response || !response.ok) {
            throw lastError ?? new Error('Không thể kết nối đến máy chủ phân tích tài liệu.')
          }

          setDocumentUploadState({
            status: 'analyzing',
            message: 'Đang phân tích và trích xuất nội dung...',
          })

          if (response.ok) {
            const data = await response.json()
            
            // Insert visuals (images) into editor
            if (data.content) {
               editor.chain().focus().insertContent(data.content).run()
            }
            
            // Send hidden SEO text to parent
            if (data.seo_text && onSEOContent) {
                onSEOContent(data.seo_text)
                alert('Đã tải tài liệu thành công! Nội dung văn bản đã được trích xuất để tối ưu SEO.')
            }
            
            setDocumentUploadState({
              status: 'success',
              message: 'Hoàn tất! Nội dung đã được chèn vào bài viết.',
            })
            clearStatusSoon()
          } else {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            alert(`Không thể phân tích tài liệu. Lỗi: ${response.status} - ${response.statusText}`);
            setDocumentUploadState({
              status: 'error',
              message: 'Tải tệp thất bại. Vui lòng thử lại.',
            })
            clearStatusSoon()
          }
        } catch (error) {
          console.error('Error uploading document:', error)
          alert('Lỗi kết nối đến server. Hãy chắc chắn Backend đang chạy.')
          setDocumentUploadState({
            status: 'error',
            message: 'Không thể kết nối tới máy chủ phân tích.',
          })
          clearStatusSoon()
        }
      }
    }
    input.click()
  }


  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2 sticky top-0 bg-white z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="19"></line><line x1="14" y1="4" x2="5" y2="19"></line></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg transition-all text-[32px] font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-all text-[24px] font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded-lg transition-all text-[16px] font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        H3
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('bulletList') ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('orderedList') ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
      
       <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 ring-1 ring-gray-300 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
      </button>

      <button onClick={addImageUpload} className="p-2 rounded-lg transition-all text-gray-400 hover:bg-gray-50" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      </button>
      <button 
        onClick={handleDocumentUpload}
        className={`p-2 rounded-lg transition-all ${['uploading', 'analyzing'].includes(documentUploadState.status) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-50'}`}
        title="Tải lên PDF/Docx"
        type="button"
        disabled={['uploading', 'analyzing'].includes(documentUploadState.status)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </button>
      {documentUploadState.status !== 'idle' && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm ${
            documentUploadState.status === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : documentUploadState.status === 'error'
              ? 'bg-rose-50 text-rose-700'
              : 'bg-blue-50 text-blue-700'
          }`}
          aria-live="polite"
        >
          {documentUploadState.status === 'success' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : documentUploadState.status === 'error' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          <span>{documentUploadState.message}</span>
        </div>
      )}
    </div>
  )
}

export default function RichTextEditor({ content, onChange, onSEOContent, placeholder }: RichTextEditorProps) {
  const [_, forceUpdate] = useState(0)
  const [documentUploadState, setDocumentUploadState] = useState<DocumentUploadState>({ status: 'idle' })
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Viết nội dung của bạn...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onTransaction: () => {
      forceUpdate(n => n + 1)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-4 py-2 text-black',
      },
    },
    immediatelyRender: false,
  })

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition">
      <MenuBar
        editor={editor}
        onSEOContent={onSEOContent}
        documentUploadState={documentUploadState}
        setDocumentUploadState={setDocumentUploadState}
      />
      <EditorContent editor={editor} />
    </div>
  )
}

