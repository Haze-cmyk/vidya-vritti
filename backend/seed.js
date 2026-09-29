import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, MONGO_URI } from './config/db.js';
import { User } from './models/User.js';
import { Scheme } from './models/Scheme.js';
import { Application } from './models/Application.js';
import { Document } from './models/Document.js';
import { Notification } from './models/Notification.js';
import { AuditLog } from './models/AuditLog.js';

dotenv.config();

async function seed() {
  const connected = await connectDB();
  if (!connected) {
    console.error('\x1b[31m%s\x1b[0m', '[SEED ERROR] Cannot seed database without an active MongoDB connection.');
    console.log('[SEED] Please provide a valid MONGO_URI in .env or your deployment environment variables.');
    process.exit(1);
  }

  try {

    // 1. Clear all existing collections to ensure zero leftover mock/dummy data
    console.log('[SEED] Purging existing database collections...');
    await User.deleteMany({});
    await Scheme.deleteMany({});
    await Application.deleteMany({});
    await Document.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    // 2. Insert EXACTLY ONE demo user per role (5 total)
    const seedUsers = [
      {
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
        password: 'demo123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-institute-1',
        loginId: 'VV-2026-10002',
        name: 'Dr. Ramesh Kumar',
        email: 'institute@demo.in',
        phone: '9876500002',
        role: 'institute',
        designation: 'clerk_principal',
        officeAddress: '',
        state: 'Odisha',
        password: 'demo123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-officer-1',
        loginId: 'VV-2026-10003',
        name: 'Shri Rajesh Kumar',
        email: 'officer@demo.in',
        phone: '9876500001',
        role: 'officer',
        designation: 'nodal_officer',
        officeAddress: 'Tribal Welfare Department, Govt. of Odisha, Bhubaneswar',
        state: 'Odisha',
        password: 'demo123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-committee-1',
        loginId: 'VV-2026-10004',
        name: 'Dr. Meera Sharma',
        email: 'committee@demo.in',
        phone: '9876500003',
        role: 'committee',
        designation: 'nodal_officer',
        officeAddress: 'MoTA National Selection Board, New Delhi',
        state: 'Delhi',
        password: 'demo123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-admin-1',
        loginId: 'VV-2026-10005',
        name: 'Smt. Kavita Rao',
        email: 'admin@demo.in',
        phone: '9876500004',
        role: 'admin',
        designation: 'mota_admin',
        officeAddress: 'Ministry of Tribal Affairs, Shastri Bhawan, New Delhi',
        state: 'Delhi',
        password: 'demo123',
        createdAt: new Date().toISOString()
      }
    ];

    console.log(`[SEED] Inserting ${seedUsers.length} seed users (1 applicant, 1 institute, 1 officer, 1 committee, 1 admin)...`);
    await User.insertMany(seedUsers);

    // 3. Insert EXACTLY ONE seed scheme
    const seedScheme = {
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
    };

    console.log('[SEED] Inserting 1 seed scheme (NFST)...');
    await Scheme.create(seedScheme);

    console.log('\x1b[32m%s\x1b[0m', `
═══════════════════════════════════════════════════════════════════════════════
 [SUCCESS] Database Seed Completed Successfully!
 
 Inserted:
   ✓ 1 Applicant User: student@demo.in
   ✓ 1 Institute User: institute@demo.in
   ✓ 1 Officer User:   officer@demo.in
   ✓ 1 Committee User: committee@demo.in
   ✓ 1 Admin User:     admin@demo.in
   ✓ 1 Scheme:         NFST (National Fellowship for Higher Education of ST Students)
 
 Purged:
   ✓ 0 Mock Applications
   ✓ 0 Mock Documents
   ✓ Zero auto-injected runtime data
═══════════════════════════════════════════════════════════════════════════════
`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m[SEED ERROR]\x1b[0m', err.message);
    process.exit(1);
  }
}

seed();
