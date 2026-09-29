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
const MOCK_SCHEMES_KEY = 'vidya_vrtti_mock_schemes';
const MOCK_APPLICATIONS_KEY = 'vidya_vrtti_mock_applications';
const MOCK_NOTIFICATIONS_KEY = 'vidya_vrtti_mock_notifications';
const MOCK_AUDIT_KEY = 'vidya_vrtti_mock_audit';

// Initial Demo Accounts (5 Official Roles)
const DEMO_ACCOUNTS: Record<string, User> = {
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
  },
  'committee@demo.in': {
    id: 'usr-committee-1',
    loginId: 'VV-2026-10004',
    name: 'Dr. Meera Sharma',
    email: 'committee@demo.in',
    phone: '9876500003',
    role: 'committee',
    designation: 'nodal_officer',
    officeAddress: 'MoTA National Selection Board, New Delhi',
    state: 'Delhi',
    gender: 'Female',
    createdAt: new Date().toISOString()
  }
};

// Initial Schemes
const DEFAULT_SCHEMES: Scheme[] = [
  {
    id: 'scheme-nfst',
    code: 'NFST',
    name: 'National Fellowship for Higher Education of ST Students',
    category: 'Fellowship',
    description:
      'Financial support for Scheduled Tribe (ST) students to pursue higher education leading to M.Phil. and Ph.D. degrees in Indian Universities, Institutes, and Scientific Institutions.',
    window: { start: '2026-07-01', end: '2026-12-31' },
    eligibility: [
      { id: 'e1', field: 'Category', operator: 'eq', value: 'ST' },
      {
        id: 'e2',
        field: 'Qualification',
        operator: 'in',
        value: ['Post Graduate', 'Master of Science', 'Master of Arts', 'M.Tech', 'M.Sc']
      },
      { id: 'e3', field: 'Annual Income', operator: 'lt', value: 600000 },
      { id: 'e4', field: 'Minimum Marks', operator: 'gt', value: 55 }
    ],
    requiredDocs: [
      'ST Caste Certificate',
      'Income Certificate',
      'M.Sc Marksheet',
      'Ph.D. Admission Letter'
    ],
    stages: [
      'Application Submitted',
      'Document Verification',
      'Academic Scrutiny',
      'Selection Committee Merit',
      'Disbursement'
    ],
    selectionCriteria: 'hybrid',
    amount: '₹35,000 / month + HRA + Contingency',
    maxScholarshipAmount: 420000,
    totalSlots: 750,
    active: true
  },
  {
    id: 'scheme-nos',
    code: 'NOS',
    name: 'National Overseas Scholarship for ST Candidates',
    category: 'Scholarship',
    description:
      'Provides financial assistance to selected ST candidates for pursuing Master level courses and Ph.D. abroad in prestigious global universities.',
    window: { start: '2026-06-01', end: '2026-11-30' },
    eligibility: [
      { id: 'e1', field: 'Category', operator: 'eq', value: 'ST' },
      { id: 'e2', field: 'Annual Income', operator: 'lt', value: 800000 },
      { id: 'e3', field: 'Minimum Marks', operator: 'gt', value: 60 }
    ],
    requiredDocs: [
      'ST Caste Certificate',
      'Income Certificate',
      'Foreign University Admission Offer',
      'Passport'
    ],
    stages: [
      'Application Submitted',
      'Document Verification',
      'Embassy Clearance',
      'Selection Board Approval',
      'Disbursement'
    ],
    selectionCriteria: 'merit',
    amount: 'Full Tuition + $15,400 / year stipend',
    maxScholarshipAmount: 2500000,
    totalSlots: 100,
    active: true
  },
  {
    id: 'scheme-tces',
    code: 'TCES',
    name: 'Top Class Education Scheme for ST Students',
    category: 'Scholarship',
    description:
      'Covers entire tuition and living expenses for meritorious Scheduled Tribe students who secure admission in notified premier institutions (IITs, NITs, IIMs, AIIMS, NLUs).',
    window: { start: '2026-08-01', end: '2026-12-31' },
    eligibility: [
      { id: 'e1', field: 'Category', operator: 'eq', value: 'ST' },
      { id: 'e2', field: 'Annual Income', operator: 'lt', value: 600000 }
    ],
    requiredDocs: [
      'ST Caste Certificate',
      'Income Certificate',
      'Institute Fee Receipt / Admission Letter',
      'Class 12 / Degree Marksheet'
    ],
    stages: [
      'Application Submitted',
      'Institute Nodal Verification',
      'State Scrutiny',
      'Direct Benefit Transfer'
    ],
    selectionCriteria: 'need',
    amount: 'Full Tuition Fee + ₹3,000 / month living allowance',
    maxScholarshipAmount: 350000,
    totalSlots: 1000,
    active: true
  }
];

// Initial Demo Applications
const DEFAULT_APPLICATIONS: Application[] = [
  {
    id: 'VV-2026-APP-8901',
    applicantId: 'usr-student-1',
    applicantName: 'Priya Naik',
    schemeId: 'scheme-nfst',
    schemeCode: 'NFST',
    schemeName: 'National Fellowship for Higher Education of ST Students',
    status: 'under_verification',
    currentStage: 2,
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    personal: {
      fullName: 'Priya Naik',
      dob: '2001-05-14',
      gender: 'Female',
      category: 'ST',
      tribeName: 'Gond',
      fatherName: 'Late Birendra Naik',
      motherName: 'Sunita Naik',
      aadhaarMasked: 'XXXX-XXXX-4921',
      phone: '9876543210',
      email: 'student@demo.in',
      physicallyHandicapped: 'No',
      annualIncome: 180000
    },
    address: {
      permanentAddress: 'Village Mahulpali, Post Sargipali, Block Lephripara',
      state: 'Odisha',
      district: 'Sundargarh',
      pincode: '770012',
      domicileCertNo: 'DOM/OD/2023/8821',
      domicileState: 'Odisha'
    },
    academic: {
      highestQualification: 'Post Graduate (M.Sc Biotechnology)',
      institutionName: 'Sambalpur University, Burla',
      courseName: 'M.Phil / Ph.D in Biotechnology',
      passingYear: '2025',
      percentageOrCgpa: 84.5,
      rollNumber: 'PG-BIOTECH-2023-042'
    },
    schemeSpecific: {
      proposedResearchArea: 'Genetic Diversity and Medicinal Flora in Tribal Belts of Eastern Ghats',
      universityRegNo: 'SU-PHD-2026-118'
    },
    bank: {
      accountHolderName: 'Priya Naik',
      accountNumber: '394857201948',
      ifscCode: 'SBIN0001245',
      bankName: 'State Bank of India',
      branchName: 'Sundargarh Main Branch'
    },
    documents: [
      {
        id: 'doc-st-caste',
        type: 'caste_cert',
        fileName: 'ST_Caste_Certificate_Priya_Naik.pdf',
        fileSize: '1.2 MB',
        uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        status: 'verified',
        url: '/docs/sample_caste.pdf',
        ocrConfidence: 98
      },
      {
        id: 'doc-income',
        type: 'income_cert',
        fileName: 'Income_Certificate_2025_26.pdf',
        fileSize: '890 KB',
        uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        status: 'verified',
        url: '/docs/sample_income.pdf',
        ocrConfidence: 96
      }
    ],
    score: 88,
    remarks: 'Profile matches all criteria. Ready for officer verification.'
  },
  {
    id: 'VV-2026-APP-8902',
    applicantId: 'usr-student-2',
    applicantName: 'Amit Soreng',
    schemeId: 'scheme-nfst',
    schemeCode: 'NFST',
    schemeName: 'National Fellowship for Higher Education of ST Students',
    status: 'verified',
    currentStage: 3,
    submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    personal: {
      fullName: 'Amit Soreng',
      dob: '2000-08-22',
      gender: 'Male',
      category: 'ST',
      tribeName: 'Oraon',
      fatherName: 'Mangal Soreng',
      motherName: 'Parvati Soreng',
      aadhaarMasked: 'XXXX-XXXX-6612',
      phone: '9876541122',
      email: 'amit.soreng@demo.in',
      physicallyHandicapped: 'No',
      annualIncome: 240000
    },
    address: {
      permanentAddress: 'Plot 42, Birsa Nagar, Ranchi',
      state: 'Jharkhand',
      district: 'Ranchi',
      pincode: '834001',
      domicileCertNo: 'DOM/JH/2024/1102',
      domicileState: 'Jharkhand'
    },
    academic: {
      highestQualification: 'Post Graduate (M.A. Anthropology)',
      institutionName: 'Ranchi University',
      courseName: 'Ph.D in Tribal Folklore and Customary Laws',
      passingYear: '2024',
      percentageOrCgpa: 78.2,
      rollNumber: 'RU-ANTHRO-2022-019'
    },
    schemeSpecific: {
      proposedResearchArea: 'Preservation of Endangered Tribal Dialects in Chota Nagpur Plateau'
    },
    bank: {
      accountHolderName: 'Amit Soreng',
      accountNumber: '448833992211',
      ifscCode: 'PUNB0123400',
      bankName: 'Punjab National Bank',
      branchName: 'Ranchi Kutchery Road'
    },
    documents: [],
    score: 82,
    verifiedBy: 'Shri Rajesh Kumar',
    verifiedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'VV-2026-APP-8903',
    applicantId: 'usr-student-3',
    applicantName: 'Sunita Marandi',
    schemeId: 'scheme-nfst',
    schemeCode: 'NFST',
    schemeName: 'National Fellowship for Higher Education of ST Students',
    status: 'query_raised',
    currentStage: 2,
    submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    personal: {
      fullName: 'Sunita Marandi',
      dob: '2002-01-19',
      gender: 'Female',
      category: 'ST',
      tribeName: 'Santhal',
      fatherName: 'Somra Marandi',
      motherName: 'Malati Marandi',
      aadhaarMasked: 'XXXX-XXXX-7788',
      phone: '9876543344',
      email: 'sunita.marandi@demo.in',
      physicallyHandicapped: 'No',
      annualIncome: 150000
    },
    address: {
      permanentAddress: 'Ward 5, Baripada',
      state: 'Odisha',
      district: 'Mayurbhanj',
      pincode: '757001',
      domicileCertNo: 'DOM/OD/2024/9912',
      domicileState: 'Odisha'
    },
    academic: {
      highestQualification: 'Post Graduate (M.Sc Physics)',
      institutionName: 'North Orissa University',
      courseName: 'Ph.D Physics',
      passingYear: '2025',
      percentageOrCgpa: 86.0,
      rollNumber: 'NOU-PHY-2023-011'
    },
    schemeSpecific: {},
    bank: {
      accountHolderName: 'Sunita Marandi',
      accountNumber: '998877665544',
      ifscCode: 'SBIN0000055',
      bankName: 'State Bank of India',
      branchName: 'Baripada Town'
    },
    documents: [],
    deficiency: {
      raisedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      raisedBy: 'Shri Rajesh Kumar (Verification Officer)',
      reasons: ['Income Certificate older than 6 months', 'Document stamp unclear'],
      note: 'Please upload a freshly issued Income Certificate from Tahasildar for FY 2026-27.',
      round: 1
    }
  },
  {
    id: 'VV-2026-APP-8904',
    applicantId: 'usr-student-4',
    applicantName: 'Rajesh Munda',
    schemeId: 'scheme-nos',
    schemeCode: 'NOS',
    schemeName: 'National Overseas Scholarship for ST Candidates',
    status: 'selected',
    currentStage: 4,
    submittedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    personal: {
      fullName: 'Rajesh Munda',
      dob: '1999-11-05',
      gender: 'Male',
      category: 'ST',
      tribeName: 'Munda',
      fatherName: 'Birsa Munda',
      motherName: 'Jasoda Munda',
      aadhaarMasked: 'XXXX-XXXX-1122',
      phone: '9876549988',
      email: 'rajesh.munda@demo.in',
      physicallyHandicapped: 'No',
      annualIncome: 320000
    },
    address: {
      permanentAddress: 'Khunti Road, Torpa',
      state: 'Jharkhand',
      district: 'Khunti',
      pincode: '835227',
      domicileCertNo: 'DOM/JH/2023/4412',
      domicileState: 'Jharkhand'
    },
    academic: {
      highestQualification: 'B.Tech Computer Science (88%)',
      institutionName: 'NIT Jamshedpur',
      courseName: 'M.Sc Data Science & Artificial Intelligence',
      passingYear: '2023',
      percentageOrCgpa: 88.0,
      rollNumber: 'NITJ-CSE-2019-094'
    },
    schemeSpecific: {
      universityName: 'University of Edinburgh, UK',
      qsWorldRanking: 22
    },
    bank: {
      accountHolderName: 'Rajesh Munda',
      accountNumber: '112233445566',
      ifscCode: 'HDFC0001824',
      bankName: 'HDFC Bank',
      branchName: 'Ranchi Main'
    },
    documents: [],
    score: 95
  }
];

// Initial Demo Notifications
const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'usr-student-1',
    title: 'Welcome to Vidya-Vrtti Unified Portal',
    message: 'Your account is verified. You can browse ST schemes, fill your application, and track progress.',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'notif-2',
    userId: 'usr-student-1',
    title: 'NFST Application Under Scrutiny',
    message: 'Your NFST application (VV-2026-APP-8901) is currently being verified by the Odisha Nodal Officer.',
    type: 'info',
    read: true,
    link: '/app/applications/VV-2026-APP-8901',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'notif-3',
    userId: 'ALL',
    title: 'SIH 2026 Live Portal Demo',
    message: 'Vidya-Vrtti AI-Unified DBT System is operating in high availability mode.',
    type: 'info',
    read: true,
    createdAt: new Date().toISOString()
  }
];

// Initial Audit Logs
const DEFAULT_AUDIT: AuditLogEntry[] = [
  {
    id: 'audit-1',
    actorId: 'usr-officer-1',
    actorName: 'Shri Rajesh Kumar',
    actorRole: 'officer',
    action: 'Verified Document: ST Caste Certificate for Application VV-2026-APP-8901',
    entityType: 'application',
    entityId: 'VV-2026-APP-8901',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'audit-2',
    actorId: 'usr-admin-1',
    actorName: 'Smt. Kavita Rao',
    actorRole: 'admin',
    action: 'Published Scheme Guidelines: NFST 2026-27',
    entityType: 'scheme',
    entityId: 'scheme-nfst',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];

// --- Local Storage Helpers for Offline / Standalone Mock Persistence ---
function getStoredSchemes(): Scheme[] {
  try {
    const raw = localStorage.getItem(MOCK_SCHEMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(MOCK_SCHEMES_KEY, JSON.stringify(DEFAULT_SCHEMES));
  return DEFAULT_SCHEMES;
}

function saveStoredSchemes(schemes: Scheme[]): void {
  try {
    localStorage.setItem(MOCK_SCHEMES_KEY, JSON.stringify(schemes));
  } catch {}
}

function getStoredApplications(): Application[] {
  try {
    const raw = localStorage.getItem(MOCK_APPLICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(DEFAULT_APPLICATIONS));
  return DEFAULT_APPLICATIONS;
}

function saveStoredApplications(apps: Application[]): void {
  try {
    localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(apps));
  } catch {}
}

function getStoredNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(MOCK_NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
  return DEFAULT_NOTIFICATIONS;
}

function saveStoredNotifications(notifs: Notification[]): void {
  try {
    localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(notifs));
  } catch {}
}

function getStoredAudit(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(MOCK_AUDIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(DEFAULT_AUDIT));
  return DEFAULT_AUDIT;
}

function saveStoredAudit(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(logs));
  } catch {}
}

// Helper for typed fetch calls with non-JSON guard to prevent JSON.parse syntax errors on HTML responses
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

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // If the server returns HTML (e.g. Netlify SPA rewrite to index.html or 404/502 page), do not attempt response.json()
    throw new Error(
      `Endpoint ${endpoint} returned non-JSON response (${response.status} ${response.statusText || 'OK'}). Server may be offline.`
    );
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.message) errorMsg = errJson.message;
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
      console.info('Backend auth unreachable, falling back to client demonstration accounts:', err.message);

      const query = (emailOrUsername || '').toLowerCase().trim();

      // Find in predefined demo accounts
      const matched = Object.values(DEMO_ACCOUNTS).find(
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

      // If user registered locally
      const storedUser = this.getCurrentUser();
      if (
        storedUser &&
        (storedUser.email.toLowerCase() === query ||
          (storedUser.loginId && storedUser.loginId.toLowerCase() === query))
      ) {
        const token = `jwt-${storedUser.id}-${Date.now()}`;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        return { user: storedUser, token };
      }

      // Default demo fallback: if any role is passed, pick that role's account
      if (role && DEMO_ACCOUNTS[`${role}@demo.in`]) {
        const acc = DEMO_ACCOUNTS[`${role}@demo.in`];
        const token = `jwt-${acc.id}-${Date.now()}`;
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(acc));
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        return { user: acc, token };
      }

      throw new Error('Invalid credentials. Please click one of the 1-Click Quick Login demo buttons above.');
    }
  },

  async register(data: Partial<User> & Record<string, any>): Promise<User> {
    try {
      const user = await request<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, `jwt-token-${user.id}`);
      return user;
    } catch (err: any) {
      console.info('Backend registration unreachable, registering locally:', err.message);

      const id = `usr-${Date.now()}`;
      const loginId = `VV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newUser: User = {
        id,
        loginId,
        name: data.name || 'ST Applicant',
        email: data.email || 'applicant@demo.in',
        phone: data.phone || '9876543210',
        role: data.role || 'applicant',
        designation: data.designation || 'student',
        tribe: data.tribe || 'Gond',
        aadhaar: data.aadhaar || 'XXXX-XXXX-1234',
        state: data.state || 'Odisha',
        gender: data.gender || 'Female',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, `jwt-token-${newUser.id}`);
      return newUser;
    }
  },

  async updateProfile(userData: Partial<User> & { id?: string }): Promise<User> {
    try {
      const updated = await request<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err: any) {
      console.info('Backend profile update unreachable, updating locally:', err.message);
      const current = this.getCurrentUser() || (DEMO_ACCOUNTS['student@demo.in'] as User);
      const merged: User = { ...current, ...userData };
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
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
    try {
      return await request<Scheme[]>('/schemes');
    } catch (err: any) {
      console.info('Using local schemes:', err.message);
      return getStoredSchemes();
    }
  },

  async getSchemeById(id: string): Promise<Scheme | null> {
    try {
      return await request<Scheme>(`/schemes/${encodeURIComponent(id)}`);
    } catch (err: any) {
      const schemes = getStoredSchemes();
      const decodedId = decodeURIComponent(id).toLowerCase();
      const found = schemes.find(
        (s) => s.id.toLowerCase() === decodedId || s.code.toLowerCase() === decodedId
      );
      return found || schemes[0] || null;
    }
  },

  async createScheme(schemeData: Partial<Scheme>): Promise<Scheme> {
    try {
      return await request<Scheme>('/schemes', {
        method: 'POST',
        body: JSON.stringify(schemeData)
      });
    } catch (err: any) {
      console.info('Adding scheme to local storage:', err.message);
      const schemes = getStoredSchemes();
      const newScheme: Scheme = {
        id: schemeData.id || `scheme-${Date.now()}`,
        code: schemeData.code || 'CUSTOM',
        name: schemeData.name || 'New ST Scheme',
        category: schemeData.category || 'Scholarship',
        description: schemeData.description || '',
        window: schemeData.window || { start: '2026-09-01', end: '2026-12-31' },
        eligibility: schemeData.eligibility || [],
        requiredDocs: schemeData.requiredDocs || ['ST Caste Certificate', 'Income Certificate'],
        stages: schemeData.stages || ['Application Submitted', 'Verification', 'Selection', 'Disbursement'],
        selectionCriteria: schemeData.selectionCriteria || 'merit',
        amount: schemeData.amount || '₹50,000 / year',
        maxScholarshipAmount: schemeData.maxScholarshipAmount || 50000,
        totalSlots: schemeData.totalSlots || 500,
        active: true
      };
      schemes.unshift(newScheme);
      saveStoredSchemes(schemes);
      return newScheme;
    }
  },

  async updateScheme(id: string, schemeData: Partial<Scheme>): Promise<Scheme> {
    try {
      return await request<Scheme>(`/schemes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(schemeData)
      });
    } catch (err: any) {
      const schemes = getStoredSchemes();
      const idx = schemes.findIndex((s) => s.id === id || s.code === id);
      if (idx !== -1) {
        schemes[idx] = { ...schemes[idx], ...schemeData };
        saveStoredSchemes(schemes);
        return schemes[idx];
      }
      return { ...(schemeData as Scheme), id };
    }
  },

  // Applications API
  async getApplications(filters?: {
    schemeCode?: string;
    status?: string;
    search?: string;
    state?: string;
    applicantId?: string;
  }): Promise<Application[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.schemeCode) params.set('schemeCode', filters.schemeCode);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.state) params.set('state', filters.state);
      if (filters?.applicantId) params.set('applicantId', filters.applicantId);
      if (filters?.search) params.set('search', filters.search);

      const query = params.toString() ? `?${params.toString()}` : '';
      return await request<Application[]>(`/applications${query}`);
    } catch (err: any) {
      console.info('Using local applications:', err.message);
      let apps = getStoredApplications();

      if (filters?.applicantId) {
        apps = apps.filter((a) => a.applicantId === filters.applicantId);
      }
      if (filters?.schemeCode && filters.schemeCode !== 'ALL') {
        apps = apps.filter((a) => a.schemeCode === filters.schemeCode);
      }
      if (filters?.status && filters.status !== 'ALL') {
        apps = apps.filter((a) => a.status === filters.status);
      }
      if (filters?.state && filters.state !== 'ALL') {
        apps = apps.filter((a) => a.address?.state === filters.state);
      }
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        apps = apps.filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.applicantName.toLowerCase().includes(q) ||
            (a.personal?.tribeName && a.personal.tribeName.toLowerCase().includes(q))
        );
      }

      return apps;
    }
  },

  async getApplicationById(id: string): Promise<Application | null> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}`);
    } catch (err: any) {
      const apps = getStoredApplications();
      const decodedId = decodeURIComponent(id).toLowerCase();
      const found = apps.find((a) => a.id.toLowerCase() === decodedId);
      return found || null;
    }
  },

  async submitApplication(appData: Partial<Application>): Promise<Application> {
    try {
      return await request<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify(appData)
      });
    } catch (err: any) {
      console.info('Saving application to local storage:', err.message);
      const apps = getStoredApplications();
      const user = this.getCurrentUser();
      const newApp: Application = {
        id: `VV-2026-APP-${Math.floor(1000 + Math.random() * 9000)}`,
        applicantId: user?.id || appData.applicantId || 'usr-student-1',
        applicantName: user?.name || appData.applicantName || 'Priya Naik',
        schemeId: appData.schemeId || 'scheme-nfst',
        schemeCode: appData.schemeCode || 'NFST',
        schemeName: appData.schemeName || 'National Fellowship for ST Students',
        status: 'submitted',
        currentStage: 1,
        submittedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        personal: appData.personal || {
          fullName: user?.name || 'Priya Naik',
          dob: '2001-05-14',
          gender: 'Female',
          category: 'ST',
          tribeName: user?.tribe || 'Gond',
          fatherName: '',
          motherName: '',
          aadhaarMasked: 'XXXX-XXXX-4921',
          phone: user?.phone || '9876543210',
          email: user?.email || 'student@demo.in',
          physicallyHandicapped: 'No',
          annualIncome: 180000
        },
        address: appData.address || {
          permanentAddress: 'Sundargarh, Odisha',
          state: user?.state || 'Odisha',
          district: 'Sundargarh',
          pincode: '770012',
          domicileCertNo: 'DOM/2026/01',
          domicileState: user?.state || 'Odisha'
        },
        academic: appData.academic || {
          highestQualification: 'Post Graduate',
          institutionName: 'Sambalpur University',
          courseName: 'M.Phil / Ph.D',
          passingYear: '2025',
          percentageOrCgpa: 82.5,
          rollNumber: 'PG-2025'
        },
        schemeSpecific: appData.schemeSpecific || {},
        bank: appData.bank || {
          accountHolderName: user?.name || 'Priya Naik',
          accountNumber: '394857201948',
          ifscCode: 'SBIN0001245',
          bankName: 'State Bank of India',
          branchName: 'Main Branch'
        },
        documents: appData.documents || [],
        remarks: 'Application submitted successfully via portal.'
      };

      apps.unshift(newApp);
      saveStoredApplications(apps);
      return newApp;
    }
  },

  async approveApplication(id: string, officerName = 'Shri Rajesh Kumar'): Promise<Application> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        body: JSON.stringify({ officerName })
      });
    } catch (err: any) {
      const apps = getStoredApplications();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx !== -1) {
        apps[idx].status = 'verified';
        apps[idx].currentStage = 3;
        apps[idx].verifiedBy = officerName;
        apps[idx].verifiedAt = new Date().toISOString();
        apps[idx].lastUpdatedAt = new Date().toISOString();
        saveStoredApplications(apps);
        return apps[idx];
      }
      throw new Error(`Application ${id} not found`);
    }
  },

  async rejectApplication(id: string, reason: string, officerName = 'Shri Rajesh Kumar'): Promise<Application> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, officerName })
      });
    } catch (err: any) {
      const apps = getStoredApplications();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx !== -1) {
        apps[idx].status = 'rejected';
        apps[idx].remarks = `Rejected: ${reason}`;
        apps[idx].verifiedBy = officerName;
        apps[idx].lastUpdatedAt = new Date().toISOString();
        saveStoredApplications(apps);
        return apps[idx];
      }
      throw new Error(`Application ${id} not found`);
    }
  },

  async raiseDeficiency(
    id: string,
    reasons: string[],
    note?: string,
    officerName = 'Shri Rajesh Kumar'
  ): Promise<Application> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}/raise-deficiency`, {
        method: 'POST',
        body: JSON.stringify({ reasons, note, officerName })
      });
    } catch (err: any) {
      const apps = getStoredApplications();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx !== -1) {
        apps[idx].status = 'query_raised';
        apps[idx].deficiency = {
          raisedAt: new Date().toISOString(),
          raisedBy: officerName,
          reasons,
          note,
          round: (apps[idx].deficiency?.round || 0) + 1
        };
        apps[idx].lastUpdatedAt = new Date().toISOString();
        saveStoredApplications(apps);
        return apps[idx];
      }
      throw new Error(`Application ${id} not found`);
    }
  },

  async resubmitApplication(id: string, revisedDocs: Document[]): Promise<Application> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}/resubmit`, {
        method: 'POST',
        body: JSON.stringify({ revisedDocs })
      });
    } catch (err: any) {
      const apps = getStoredApplications();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx !== -1) {
        apps[idx].status = 'under_verification';
        apps[idx].documents = revisedDocs;
        apps[idx].lastUpdatedAt = new Date().toISOString();
        saveStoredApplications(apps);
        return apps[idx];
      }
      throw new Error(`Application ${id} not found`);
    }
  },

  async updateApplication(id: string, updateData: Partial<Application>): Promise<Application> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
    } catch (err: any) {
      const apps = getStoredApplications();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx !== -1) {
        apps[idx] = { ...apps[idx], ...updateData, lastUpdatedAt: new Date().toISOString() };
        saveStoredApplications(apps);
        return apps[idx];
      }
      return { ...(updateData as Application), id };
    }
  },

  async unlockApplication(id: string): Promise<Application> {
    try {
      return await request<Application>(`/applications/${encodeURIComponent(id)}/unlock`, {
        method: 'POST'
      });
    } catch (err: any) {
      const apps = getStoredApplications();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx !== -1) {
        apps[idx].status = 'draft';
        apps[idx].lastUpdatedAt = new Date().toISOString();
        saveStoredApplications(apps);
        return apps[idx];
      }
      throw new Error(`Application ${id} not found`);
    }
  },

  async generateMeritList(schemeCode = 'NFST'): Promise<MeritCandidate[]> {
    try {
      return await request<MeritCandidate[]>(`/applications/merit-list?schemeCode=${encodeURIComponent(schemeCode)}`);
    } catch (err: any) {
      console.info('Computing merit list locally:', err.message);
      const apps = getStoredApplications();
      const eligible = apps.filter(
        (a) =>
          a.schemeCode === schemeCode &&
          ['verified', 'scrutinized', 'selected', 'under_verification'].includes(a.status)
      );

      const candidates: MeritCandidate[] = eligible.map((a, i) => {
        const academicScore = a.academic?.percentageOrCgpa || 80;
        const income = a.personal?.annualIncome || 200000;
        const incomeWeightage = income < 250000 ? 20 : income < 450000 ? 15 : 10;
        const totalScore = Math.min(100, Math.round(academicScore * 0.7 + incomeWeightage + 10));

        return {
          applicationId: a.id,
          applicantName: a.applicantName,
          schemeCode: a.schemeCode,
          state: a.address?.state || 'Odisha',
          academicScore,
          incomeWeightage,
          researchProposalScore: 88,
          totalScore,
          rank: i + 1,
          status: i < 2 ? 'Selected' : 'Waitlisted'
        };
      });

      return candidates.sort((a, b) => b.totalScore - a.totalScore).map((c, idx) => ({ ...c, rank: idx + 1 }));
    }
  },

  // Real Document Upload & AI OCR fallback
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
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      if (compareValues) {
        formData.append('compareValues', JSON.stringify(compareValues));
      }

      return await request<{
        document: Document;
        ocrFields: OCRField[];
        ocrConfidence: number;
        message: string;
      }>('/documents/upload', {
        method: 'POST',
        body: formData
      });
    } catch (err: any) {
      console.info('Using client simulated OCR fallback:', err.message);
      const docId = `doc-${Date.now()}`;
      const user = this.getCurrentUser();
      const extractedName = compareValues?.fullName || user?.name || 'Priya Naik';
      const extractedTribe = compareValues?.tribeName || user?.tribe || 'Gond';

      const ocrFields: OCRField[] = [
        {
          id: `ocr-${Date.now()}-1`,
          field: 'Candidate Name',
          value: extractedName,
          confidence: 98,
          sourceDocId: docId,
          sourceDocName: file.name
        },
        {
          id: `ocr-${Date.now()}-2`,
          field: 'Community / Tribe',
          value: `${extractedTribe} (Scheduled Tribe)`,
          confidence: 96,
          sourceDocId: docId,
          sourceDocName: file.name
        },
        {
          id: `ocr-${Date.now()}-3`,
          field: 'Certificate Number',
          value: 'OR/ST/2025/98412',
          confidence: 95,
          sourceDocId: docId,
          sourceDocName: file.name
        },
        {
          id: `ocr-${Date.now()}-4`,
          field: 'Issuing Authority',
          value: 'Tahasildar, Revenue Dept, Govt of Odisha',
          confidence: 94,
          sourceDocId: docId,
          sourceDocName: file.name
        }
      ];

      return {
        document: {
          id: docId,
          type: docType,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString(),
          status: 'verified',
          url: URL.createObjectURL(file),
          ocrConfidence: 96,
          ocrFields
        },
        ocrFields,
        ocrConfidence: 96,
        message: 'Document verified and OCR extracted successfully (AI Engine)'
      };
    }
  },

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
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('docType', docType);
      if (compareName) {
        formData.append('compareName', compareName);
      }

      return await request('/documents/verify', {
        method: 'POST',
        body: formData
      });
    } catch (err: any) {
      console.info('Document verify client fallback active:', err.message);
      const docId = `doc-${Date.now()}`;
      const name = compareName || 'Priya Naik';

      return {
        success: true,
        message: 'Document OCR processed and identity verified',
        documentId: docId,
        document: {
          id: docId,
          type: docType,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString(),
          status: 'verified',
          url: URL.createObjectURL(file),
          ocrConfidence: 97
        },
        extractedFields: {
          fullName: name,
          dateOfBirth: '2001-05-14',
          casteCategory: 'Scheduled Tribe (ST)',
          certificateNumber: 'OR/ST/2025/98412',
          issuingAuthority: 'Tahasildar, Odisha'
        },
        confidenceScores: {
          name: 99,
          overall: 97
        },
        matches: {
          isMatch: true,
          similarityScore: 0.99,
          providedName: name,
          extractedName: name,
          rationale: 'High confidence match between portal profile and verified certificate.'
        },
        ocrEngine: 'Vidya-Vrtti AI Client Pipeline',
        pageCount: 1,
        ocrFields: [
          {
            id: `ocr-${Date.now()}-1`,
            field: 'Full Name',
            value: name,
            confidence: 99,
            sourceDocId: docId,
            sourceDocName: file.name
          }
        ]
      };
    }
  },

  async runOCR(docType: string, fileName: string): Promise<OCRField[]> {
    return [
      {
        id: `ocr-${Date.now()}-1`,
        field: 'Document Type',
        value: docType,
        confidence: 95,
        sourceDocId: 'doc-gen',
        sourceDocName: fileName
      }
    ];
  },

  // Admin Stats
  async getAdminStats(): Promise<AdminStats> {
    try {
      return await request<AdminStats>('/stats');
    } catch (err: any) {
      console.info('Computing admin stats from local applications:', err.message);
      const allApps = getStoredApplications();

      const totalApplications = allApps.length;
      const pendingVerification = allApps.filter(
        (a) => a.status === 'submitted' || a.status === 'under_verification'
      ).length;
      const verified = allApps.filter((a) => a.status === 'verified').length;
      const scrutinized = allApps.filter((a) => a.status === 'scrutinized').length;
      const selected = allApps.filter((a) => a.status === 'selected').length;
      const rejected = allApps.filter((a) => a.status === 'rejected').length;
      const deficient = allApps.filter((a) => a.status === 'query_raised').length;
      const disbursed = allApps.filter((a) => a.status === 'disbursed').length;

      // Group by date
      const dateMap: Record<string, number> = {};
      allApps.forEach((a) => {
        const d = a.submittedAt ? a.submittedAt.split('T')[0] : '2026-09-01';
        dateMap[d] = (dateMap[d] || 0) + 1;
      });
      const applicationsByDate = Object.entries(dateMap).map(([date, count]) => ({ date, count }));

      // Scheme split
      const schemeMap: Record<string, number> = {};
      allApps.forEach((a) => {
        const c = a.schemeCode || 'NFST';
        schemeMap[c] = (schemeMap[c] || 0) + 1;
      });
      const schemeColors: Record<string, string> = {
        NFST: '#71816d',
        NOS: '#c9b79c',
        TCES: '#2A9D8F',
        OTHER: '#6F42A0'
      };
      const schemeSplit = Object.entries(schemeMap).map(([name, value]) => ({
        name,
        value,
        color: schemeColors[name] || '#71816d'
      }));

      // State split
      const stateMap: Record<string, number> = {};
      allApps.forEach((a) => {
        const s = a.address?.state || 'Odisha';
        stateMap[s] = (stateMap[s] || 0) + 1;
      });
      const stateSplit = Object.entries(stateMap).map(([state, count]) => ({ state, count }));

      return {
        totalApplications,
        pendingVerification,
        verified,
        scrutinized,
        selected,
        rejected,
        deficient,
        disbursed,
        totalFundsDisbursed: disbursed * 0.42,
        applicationsByDate,
        schemeSplit,
        stateSplit,
        funnelData: [
          { stage: 'Submitted', count: totalApplications, percentage: 100 },
          {
            stage: 'Verified',
            count: verified + scrutinized + selected + disbursed,
            percentage: totalApplications ? Math.round(((verified + scrutinized + selected + disbursed) / totalApplications) * 100) : 0
          },
          {
            stage: 'Scrutinized',
            count: scrutinized + selected + disbursed,
            percentage: totalApplications ? Math.round(((scrutinized + selected + disbursed) / totalApplications) * 100) : 0
          },
          {
            stage: 'Selected',
            count: selected + disbursed,
            percentage: totalApplications ? Math.round(((selected + disbursed) / totalApplications) * 100) : 0
          },
          {
            stage: 'Disbursed',
            count: disbursed,
            percentage: totalApplications ? Math.round((disbursed / totalApplications) * 100) : 0
          }
        ],
        deficiencyBreakdown: [
          { reason: 'Income Certificate Expired', count: 2 },
          { reason: 'Caste Certificate Unverified', count: 1 }
        ],
        anomalies: []
      };
    }
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      return await request<Notification[]>(`/notifications?userId=${encodeURIComponent(userId)}`);
    } catch (err: any) {
      console.info('Using local notifications:', err.message);
      const all = getStoredNotifications();
      if (!userId || userId === 'ALL') return all;
      return all.filter((n) => n.userId === userId || n.userId === 'ALL');
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await request<void>(`/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PUT'
      });
    } catch (err: any) {
      const all = getStoredNotifications();
      const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveStoredNotifications(updated);
    }
  },

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    link?: string
  ): Promise<Notification> {
    try {
      return await request<Notification>('/notifications', {
        method: 'POST',
        body: JSON.stringify({ userId, title, message, type, link })
      });
    } catch (err: any) {
      const all = getStoredNotifications();
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: userId || 'ALL',
        title,
        message,
        type,
        read: false,
        link,
        createdAt: new Date().toISOString()
      };
      all.unshift(newNotif);
      saveStoredNotifications(all);
      return newNotif;
    }
  },

  // Audit Log
  async getAuditLog(): Promise<AuditLogEntry[]> {
    try {
      return await request<AuditLogEntry[]>('/audit');
    } catch (err: any) {
      console.info('Using local audit logs:', err.message);
      return getStoredAudit();
    }
  },

  async logAuditAction(
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    const currentUser = this.getCurrentUser();
    const payload = {
      actorId: currentUser?.id || 'usr-system',
      actorName: currentUser?.name || 'System User',
      actorRole: currentUser?.role || 'officer',
      action,
      entityType,
      entityId,
      metadata
    };

    try {
      return await request<AuditLogEntry>('/audit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      const logs = getStoredAudit();
      const newLog: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        ...payload,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      saveStoredAudit(logs);
      return newLog;
    }
  }
};
