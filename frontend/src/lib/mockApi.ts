import {
  Scheme,
  User,
  Application,
  AuditLogEntry,
  AdminStats,
  Notification,
  MeritCandidate,
  OCRField,
  Document
} from '../types';

function resolveBaseUrl(): string {
  let url = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
  if (!url) return '/api';
  // If protocol was omitted by the user (e.g. vidya-vrityu-production.up.railway.app), auto-prepend https://
  if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.endsWith('/api') ? url : `${url}/api`;
}

export function resolveDocumentUrl(url?: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const base = resolveBaseUrl().replace(/\/api$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

const BASE_URL = resolveBaseUrl();

const CURRENT_USER_STORAGE_KEY = 'vidya_vrtti_current_user';
const TOKEN_STORAGE_KEY = 'vidya_vrtti_token';

// Helper for typed fetch calls
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>)
  };

  // Only add Content-Type: application/json if body is not FormData
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const mockApi = {
  async login(emailOrUsername: string, role?: string): Promise<{ user: User; token: string }> {
    try {
      const res = await request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername, role })
      });

      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(res.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      return res;
    } catch (err: any) {
      const query = (emailOrUsername || '').toLowerCase().trim();
      const demoAccounts: Record<string, User> = {
        'student@demo.in': {
          id: 'usr-student-1',
          loginId: 'VV-2026-10001',
          name: 'Priya Naik',
          email: 'student@demo.in',
          phone: '9876543210',
          role: 'applicant',
          designation: 'student',
          tribe: 'Gond',
          aadhaar: 'XXXX-XXXX-4921',
          state: 'Odisha',
          gender: 'Female',
          createdAt: new Date().toISOString()
        },
        'admin@demo.in': {
          id: 'usr-admin-1',
          loginId: 'VV-2026-10005',
          name: 'Smt. Kavita Rao',
          email: 'admin@demo.in',
          phone: '9876500004',
          role: 'admin',
          designation: 'mota_admin',
          officeAddress: 'Ministry of Tribal Affairs, Shastri Bhawan, New Delhi',
          state: 'Delhi',
          gender: 'Female',
          createdAt: new Date().toISOString()
        },
        'institute@demo.in': {
          id: 'usr-institute-1',
          loginId: 'VV-2026-10002',
          name: 'Dr. Ramesh Kumar',
          email: 'institute@demo.in',
          phone: '9876500002',
          role: 'institute',
          designation: 'clerk_principal',
          officeAddress: '',
          state: 'Odisha',
          gender: 'Male',
          createdAt: new Date().toISOString()
        },
        'officer@demo.in': {
          id: 'usr-officer-1',
          loginId: 'VV-2026-10003',
          name: 'Shri Rajesh Kumar',
          email: 'officer@demo.in',
          phone: '9876500001',
          role: 'officer',
          designation: 'nodal_officer',
          officeAddress: 'Tribal Welfare Department, Govt. of Odisha, Bhubaneswar',
          state: 'Odisha',
          gender: 'Male',
          createdAt: new Date().toISOString()
        }
      };

      const matched = Object.values(demoAccounts).find(
        (u) =>
          u.email.toLowerCase() === query ||
          (u.loginId && u.loginId.toLowerCase() === query) ||
          (role && u.role === role)
      );

      if (matched) {
        const token = `jwt-${matched.id}-${Date.now()}`;
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(matched));
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        return { user: matched, token };
      }
      throw err;
    }
  },

  async register(data: Partial<User> & Record<string, any>): Promise<User> {
    const user = await request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, `jwt-token-${user.id}`);
    return user;
  },

  async updateProfile(userData: Partial<User> & { id?: string }): Promise<User> {
    const updated = await request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  getCurrentUser(): User | null {
    try {
      const item = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User): void {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  },

  // Schemes API
  async getSchemes(): Promise<Scheme[]> {
    return request<Scheme[]>('/schemes');
  },

  async getSchemeById(id: string): Promise<Scheme | null> {
    try {
      return await request<Scheme>(`/schemes/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Scheme ${id} not found:`, err);
      return null;
    }
  },

  async createScheme(schemeData: Partial<Scheme>): Promise<Scheme> {
    return request<Scheme>('/schemes', {
      method: 'POST',
      body: JSON.stringify(schemeData)
    });
  },

  async updateScheme(id: string, schemeData: Partial<Scheme>): Promise<Scheme> {
    return request<Scheme>(`/schemes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(schemeData)
    });
  },

  // Applications API
  async getApplications(filters?: {
    schemeCode?: string;
    status?: string;
    search?: string;
    state?: string;
    applicantId?: string;
  }): Promise<Application[]> {
    const params = new URLSearchParams();
    if (filters?.schemeCode) params.set('schemeCode', filters.schemeCode);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.state) params.set('state', filters.state);
    if (filters?.applicantId) params.set('applicantId', filters.applicantId);
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Application[]>(`/applications${query}`);
  },

  async getApplicationById(id: string): Promise<Application | null> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Application ${id} not found:`, err);
      return null;
    }
  },

  async submitApplication(appData: Partial<Application>): Promise<Application> {
    return request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(appData)
    });
  },

  async approveApplication(id: string, officerName = 'Shri Rajesh Kumar'): Promise<Application> {
    return request<Application>(`/applications/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ officerName })
    });
  },

  async rejectApplication(id: string, reason: string, officerName = 'Shri Rajesh Kumar'): Promise<Application> {
    return request<Application>(`/applications/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, officerName })
    });
  },

  async raiseDeficiency(
    id: string,
    reasons: string[],
    note?: string,
    officerName = 'Shri Rajesh Kumar'
  ): Promise<Application> {
    return request<Application>(`/applications/${encodeURIComponent(id)}/raise-deficiency`, {
      method: 'POST',
      body: JSON.stringify({ reasons, note, officerName })
    });
  },

  async resubmitApplication(id: string, revisedDocs: Document[]): Promise<Application> {
    return request<Application>(`/applications/${encodeURIComponent(id)}/resubmit`, {
      method: 'POST',
      body: JSON.stringify({ revisedDocs })
    });
  },

  async updateApplication(id: string, updateData: Partial<Application>): Promise<Application> {
    return request<Application>(`/applications/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  async unlockApplication(id: string): Promise<Application> {
    return request<Application>(`/applications/${encodeURIComponent(id)}/unlock`, {
      method: 'POST'
    });
  },

  async generateMeritList(schemeCode = 'NFST'): Promise<MeritCandidate[]> {
    return request<MeritCandidate[]>(`/applications/merit-list?schemeCode=${encodeURIComponent(schemeCode)}`);
  },

  // Real Document Upload & OCR
  async uploadDocument(
    file: File,
    docType: string,
    compareValues?: {
      fullName?: string;
      tribeName?: string;
      annualIncome?: number;
      dob?: string;
    }
  ): Promise<{
    document: Document;
    ocrFields: OCRField[];
    ocrConfidence: number;
    message: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    if (compareValues) {
      formData.append('compareValues', JSON.stringify(compareValues));
    }

    return request<{
      document: Document;
      ocrFields: OCRField[];
      ocrConfidence: number;
      message: string;
    }>('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Dedicated Document Verification Pipeline endpoint (POST /api/documents/verify)
  async verifyDocument(
    file: File,
    userId: string,
    docType: string,
    compareName?: string
  ): Promise<{
    success: boolean;
    message: string;
    documentId: string;
    document: Document;
    extractedFields: {
      fullName: string | null;
      dateOfBirth: string | null;
      casteCategory: string | null;
      certificateNumber: string | null;
      issuingAuthority: string | null;
    };
    confidenceScores: {
      name: number;
      overall: number;
    };
    matches: {
      isMatch: boolean;
      similarityScore: number;
      providedName: string;
      extractedName: string;
      rationale: string;
    };
    ocrEngine: string;
    pageCount: number;
    ocrFields: OCRField[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('docType', docType);
    if (compareName) {
      formData.append('compareName', compareName);
    }

    return request('/documents/verify', {
      method: 'POST',
      body: formData
    });
  },

  // Document OCR simulation fallback (kept for compatibility)
  async runOCR(docType: string, fileName: string): Promise<OCRField[]> {
    return [
      {
        id: `ocr-${Date.now()}-1`,
        field: 'Document Type',
        value: docType,
        confidence: 90,
        sourceDocId: 'doc-gen',
        sourceDocName: fileName
      }
    ];
  },

  // Admin Stats
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/stats');
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return request<Notification[]>(`/notifications?userId=${encodeURIComponent(userId)}`);
  },

  async markNotificationRead(id: string): Promise<void> {
    await request<void>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT'
    });
  },

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    link?: string
  ): Promise<Notification> {
    return request<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify({ userId, title, message, type, link })
    });
  },

  // Audit Log
  async getAuditLog(): Promise<AuditLogEntry[]> {
    return request<AuditLogEntry[]>('/audit');
  },

  async logAuditAction(
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    const currentUser = this.getCurrentUser();
    return request<AuditLogEntry>('/audit', {
      method: 'POST',
      body: JSON.stringify({
        actorId: currentUser?.id || 'usr-system',
        actorName: currentUser?.name || 'System User',
        actorRole: currentUser?.role || 'officer',
        action,
        entityType,
        entityId,
        metadata
      })
    });
  }
};
