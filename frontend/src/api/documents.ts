import api from './client'

export interface Document {
  id: number
  filename: string
  original_name: string
  file_size: number
  page_count: number
  uploaded_at: string
}

export interface DocumentDetail extends Document {
  extracted_text: string | null
}

export interface DocumentListResponse {
  documents: Document[]
  total: number
}

export interface AskResponse {
  answer: string
  chunks_used: number
  error: string | null
}

export const documentsApi = {
  list: () => api.get<DocumentListResponse>('/documents/'),

  getById: (id: number) => api.get<DocumentDetail>(`/documents/${id}`),

  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<Document>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
  },

  delete: (id: number) => api.delete(`/documents/${id}`),

  downloadUrl: (id: number) => `/api/v1/documents/${id}/download`,

  ask: (id: number, question: string) =>
    api.post<AskResponse>(`/documents/${id}/ask`, { question }),
}