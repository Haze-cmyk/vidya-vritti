import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockApi } from '../../lib/mockApi';
import { Application, Document, OCRField } from '../../types';
import { StatusBadge } from '../../components/shared/StatusBadge';
import {
  ArrowLeft,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileText,
  Clock,
  Download,
  ShieldCheck,
  User,
  Building2,
  Lock,
  Unlock,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  MapPin,
  GraduationCap,
  Landmark,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export const ApplicationDetailPage: React.FC = () => {
  const { user } = useAuth();
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showAccountDigits, setShowAccountDigits] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'address' | 'academic' | 'scheme' | 'bank' | 'documents' | 'timeline'>('all');

  // Edit form states
  const [editPersonal, setEditPersonal] = useState<any>({});
  const [editAddress, setEditAddress] = useState<any>({});
  const [editAcademic, setEditAcademic] = useState<any>({});
  const [editSchemeSpecific, setEditSchemeSpecific] = useState<any>({});
  const [editBank, setEditBank] = useState<any>({});
  const [editDocuments, setEditDocuments] = useState<Document[]>([]);

  // Deficiency Modal State
  const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);
  const [reuploading, setReuploading] = useState(false);
  const [revisedDocs, setRevisedDocs] = useState<Document[]>([]);
  const deficiencyFileInputRef = useRef<HTMLInputElement>(null);

  // Document replacement ref for edit mode
  const replaceDocInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocType, setReplacingDocType] = useState<string | null>(null);
  const [isDocUploading, setIsDocUploading] = useState(false);

  const fetchApplication = async () => {
    if (!appId) return;
    try {
      const data = await mockApi.getApplicationById(appId);
      if (data) {
        setApp(data);
        initEditState(data);
        if (data.status === 'draft') {
          setIsEditing(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const initEditState = (data: Application) => {
    setEditPersonal(data.personal ? { ...data.personal } : {});
    setEditAddress(data.address ? { ...data.address } : {});
    setEditAcademic(data.academic ? { ...data.academic } : {});
    setEditSchemeSpecific(data.schemeSpecific ? { ...data.schemeSpecific } : {});
    setEditBank(data.bank ? { ...data.bank } : {});
    setEditDocuments(data.documents ? [...data.documents] : []);
  };

  useEffect(() => {
    fetchApplication();
  }, [appId]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading || !app) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#71816d] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading comprehensive application records...</p>
      </div>
    );
  }

  const isLocked = app.status !== 'draft' && !isEditing;

  // Handle Copy Application ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(app.id);
    setCopiedId(true);
    toast.success('Application ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handle Unlock confirmation
  const handleConfirmUnlock = async () => {
    try {
      const unlockedApp = await mockApi.unlockApplication(app.id);
      setApp(unlockedApp);
      initEditState(unlockedApp);
      setIsEditing(true);
      setShowUnlockModal(false);
      toast.success('Application unlocked! You can now make corrections and relock it.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlock application');
    }
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    initEditState(app);
    setIsEditing(false);
    toast.info('Editing canceled. Reverted to previous state.');
  };

  // Handle Save Corrections & Relock Application
  const handleSaveAndRelock = async () => {
    setIsSaving(true);
    try {
      const updated = await mockApi.updateApplication(app.id, {
        personal: editPersonal,
        address: editAddress,
        academic: editAcademic,
        schemeSpecific: editSchemeSpecific,
        bank: editBank,
        documents: editDocuments,
        status: 'submitted'
      });
      setApp(updated);
      initEditState(updated);
      setIsEditing(false);
      toast.success(`Corrections saved! Application ${updated.id} has been locked and resubmitted to MoTA.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save application corrections');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Document Replacement in Edit Mode
  const triggerReplaceDocument = (docType: string) => {
    setReplacingDocType(docType);
    replaceDocInputRef.current?.click();
  };

  const handleDocumentFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDocType) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Only PDF documents are accepted for verification.');
      if (replaceDocInputRef.current) replaceDocInputRef.current.value = '';
      return;
    }

    setIsDocUploading(true);
    try {
      const res = await mockApi.uploadDocument(file, replacingDocType, {
        fullName: editPersonal.fullName,
        tribeName: editPersonal.tribeName,
        annualIncome: editPersonal.annualIncome,
        dob: editPersonal.dob
      });

      setEditDocuments((prev) => {
        const filtered = prev.filter((d) => d.type !== replacingDocType);
        return [...filtered, res.document];
      });

      toast.success(`${replacingDocType} replaced and AI OCR verified successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setIsDocUploading(false);
      setReplacingDocType(null);
      if (replaceDocInputRef.current) replaceDocInputRef.current.value = '';
    }
  };

  // Handle Deficiency Document Upload
  const handleDeficiencyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file.');
      if (deficiencyFileInputRef.current) deficiencyFileInputRef.current.value = '';
      return;
    }

    setReuploading(true);
    try {
      const res = await mockApi.uploadDocument(file, 'Revised Certificate');
      setRevisedDocs([res.document]);
      toast.success(`${file.name} uploaded and verified via OCR`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setReuploading(false);
      if (deficiencyFileInputRef.current) deficiencyFileInputRef.current.value = '';
    }
  };

  const handleResubmitDeficiency = async () => {
    if (revisedDocs.length === 0) {
      toast.error('Please upload at least one revised document');
      return;
    }

    const updated = await mockApi.resubmitApplication(app.id, revisedDocs);
    setApp(updated);
    initEditState(updated);
    setShowDeficiencyModal(false);
    toast.success('Application Resubmitted to Verification Officer!');
  };

  // Comprehensive Official PDF Receipt Generator
  const downloadReceipt = () => {
    const pdf = new jsPDF();
    const primaryColor = [22, 60, 48]; // MoTA dark green

    // Header
    pdf.setFillColor(22, 60, 48);
    pdf.rect(0, 0, 210, 24, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('MINISTRY OF TRIBAL AFFAIRS (MoTA)', 105, 12, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('GOVERNMENT OF INDIA • Vidya-Vrtti SCHOLARSHIP PORTAL', 105, 18, { align: 'center' });

    // Application Title
    pdf.setTextColor(20, 20, 20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('OFFICIAL APPLICATION ACKNOWLEDGMENT RECEIPT', 105, 33, { align: 'center' });

    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 36, 195, 36);

    // Meta box
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Application ID: ${app.id}`, 15, 43);
    pdf.text(`Scheme Code: ${app.schemeCode}`, 15, 49);
    pdf.text(`Current Status: ${app.status.toUpperCase()}`, 15, 55);

    pdf.text(`Submission Date: ${new Date(app.submittedAt).toLocaleString('en-IN')}`, 120, 43);
    pdf.text(`Last Updated: ${new Date(app.lastUpdatedAt).toLocaleString('en-IN')}`, 120, 49);
    pdf.text(`Applicant ID: ${app.applicantId}`, 120, 55);

    // Section 1: Personal
    pdf.setFillColor(245, 242, 235);
    pdf.rect(15, 61, 180, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. APPLICANT & COMMUNITY PARTICULARS', 18, 65);

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Full Name: ${app.personal?.fullName || 'N/A'}`, 18, 73);
    pdf.text(`Date of Birth: ${app.personal?.dob || 'N/A'}`, 18, 79);
    pdf.text(`Gender: ${app.personal?.gender || 'N/A'}`, 18, 85);
    pdf.text(`ST Sub-Tribe: ${app.personal?.tribeName || 'N/A'}`, 18, 91);
    pdf.text(`Father's Name: ${app.personal?.fatherName || 'N/A'}`, 18, 97);
    pdf.text(`Mother's Name: ${app.personal?.motherName || 'N/A'}`, 18, 103);

    pdf.text(`Aadhaar (Masked): ${app.personal?.aadhaarMasked || 'N/A'}`, 115, 73);
    pdf.text(`Mobile: ${app.personal?.phone || 'N/A'}`, 115, 79);
    pdf.text(`Email: ${app.personal?.email || 'N/A'}`, 115, 85);
    pdf.text(`Category: ${app.personal?.category || 'ST'}`, 115, 91);
    pdf.text(`Person with Disability: ${app.personal?.physicallyHandicapped || 'No'}`, 115, 97);
    pdf.text(`Annual Family Income: Rs. ${(app.personal?.annualIncome || 0).toLocaleString('en-IN')}`, 115, 103);

    // Section 2: Address
    pdf.setFillColor(245, 242, 235);
    pdf.rect(15, 109, 180, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. ADDRESS & DOMICILE INFORMATION', 18, 113);

    pdf.setFont('helvetica', 'normal');
    pdf.text(`State: ${app.address?.state || 'N/A'}`, 18, 121);
    pdf.text(`District: ${app.address?.district || 'N/A'}`, 18, 127);
    pdf.text(`PIN Code: ${app.address?.pincode || 'N/A'}`, 18, 133);
    pdf.text(`Permanent Address: ${app.address?.permanentAddress || 'N/A'}`, 18, 139);

    pdf.text(`Domicile State: ${app.address?.domicileState || app.address?.state || 'N/A'}`, 115, 121);
    pdf.text(`Domicile Cert No: ${app.address?.domicileCertNo || 'Validated'}`, 115, 127);

    // Section 3: Academic & Bank
    pdf.setFillColor(245, 242, 235);
    pdf.rect(15, 145, 180, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. ACADEMIC & BANK DISBURSEMENT PARTICULARS', 18, 149);

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Institution: ${app.academic?.institutionName || 'N/A'}`, 18, 157);
    pdf.text(`Course: ${app.academic?.courseName || 'N/A'}`, 18, 163);
    pdf.text(`Roll / Reg No: ${app.academic?.rollNumber || 'N/A'}`, 18, 169);
    pdf.text(`Aggregate Marks: ${app.academic?.percentageOrCgpa || 0}%`, 18, 175);

    pdf.text(`Bank Name: ${app.bank?.bankName || 'N/A'}`, 115, 157);
    pdf.text(`Branch: ${app.bank?.branchName || 'N/A'}`, 115, 163);
    pdf.text(`A/C Number: ${app.bank?.accountNumber || 'N/A'}`, 115, 169);
    pdf.text(`IFSC Code: ${app.bank?.ifscCode || 'N/A'}`, 115, 175);

    // Section 4: Documents
    pdf.setFillColor(245, 242, 235);
    pdf.rect(15, 181, 180, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('4. UPLOADED SUPPORTING DOCUMENTS & OCR STATUS', 18, 185);

    pdf.setFont('helvetica', 'normal');
    (app.documents || []).forEach((doc, i) => {
      const y = 193 + i * 6;
      if (y < 265) {
        pdf.text(`• ${doc.type}: ${doc.fileName} (${doc.fileSize || 'PDF'}) - OCR Match: ${doc.ocrConfidence || 95}% [Status: ${doc.status.toUpperCase()}]`, 18, y);
      }
    });

    // Footer
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 275, 195, 275);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is an authenticated computer-generated receipt issued by the Ministry of Tribal Affairs (MoTA).', 105, 281, { align: 'center' });
    pdf.text('Direct Benefit Transfer (DBT) Tribal Scholarship Portal • All rights reserved.', 105, 286, { align: 'center' });

    pdf.save(`MoTA_Receipt_${app.id.replace(/\//g, '_')}.pdf`);
    toast.success('Official PDF Receipt downloaded successfully!');
  };

  // 5-Stage LifeCycle Stages
  const stages = [
    { stage: 1, label: 'Submitted', desc: 'Application Received by MoTA' },
    { stage: 2, label: 'Verification', desc: 'Officer Document Check' },
    { stage: 3, label: 'Scrutiny', desc: 'Selection Committee Review' },
    { stage: 4, label: 'Approval', desc: 'Merit Ranking & Sanction' },
    { stage: 5, label: 'Disbursed', desc: 'DBT Direct Bank Credit' }
  ];

  const currentStageNum = app.currentStage || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* Hidden PDF file input for document replacement in edit mode */}
      <input
        type="file"
        accept=".pdf,application/pdf"
        hidden
        ref={replaceDocInputRef}
        onChange={handleDocumentFilePick}
      />

      {/* Top Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#c9b79c] shadow-xs">
        <Link
          to="/app/applications"
          className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
          <span>Back to Applications List</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Receipt */}
          <button
            type="button"
            onClick={downloadReceipt}
            className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#f1e0c5] hover:bg-[#e8d6ba] text-slate-800 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            <span>Official Receipt (PDF)</span>
          </button>

          {/* If Locked, show Unlock Button */}
          {isLocked && (
            <>
              <button
                type="button"
                onClick={() => setShowUnlockModal(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                <span>Unlock Form to Edit</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/app/apply/${app.schemeId}?editAppId=${encodeURIComponent(app.id)}`)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#71816d] hover:bg-[#5b6a57] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                <span>Open in Multi-Step Wizard</span>
              </button>
            </>
          )}

          {/* If Editing, show Cancel and Save buttons in header */}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndRelock}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    <span>Saving & Relocking...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    <span>Save Corrections & Relock</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Application Header Card */}
      <div className="bg-white rounded-2xl border border-[#c9b79c] p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dfcdb1] pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#f1e0c5] text-[#71816d] border border-[#dfcdb1]">
                ID: {app.id}
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="ml-1.5 text-slate-500 hover:text-slate-800 focus:outline-none"
                  title="Copy Application ID"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Scheme Code: {app.schemeCode}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">{app.schemeName}</h1>
            <p className="text-xs text-slate-500">
              Submitted on: <span className="font-semibold text-slate-700">{new Date(app.submittedAt).toLocaleString('en-IN')}</span> • Last Updated: <span className="font-semibold text-slate-700">{new Date(app.lastUpdatedAt).toLocaleString('en-IN')}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <StatusBadge status={app.status} size="lg" />
            <div className="text-[11px] font-semibold text-slate-600 flex items-center">
              {isLocked ? (
                <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                  <Lock className="w-3 h-3 mr-1" /> Locked for Verification
                </span>
              ) : (
                <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                  <Unlock className="w-3 h-3 mr-1" /> Unlocked for Editing
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5-Stage LifeCycle Stepper */}
        <div className="p-4 rounded-xl bg-[#fbf8f3] border border-[#dfcdb1]">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#71816d]" />
            Application Lifecycle & Milestone Tracker
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            {stages.map((s) => {
              const isPassed = currentStageNum > s.stage;
              const isCurrent = currentStageNum === s.stage;
              return (
                <div
                  key={s.stage}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isPassed
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                      : isCurrent
                      ? 'bg-amber-50/80 border-amber-400 text-amber-950 ring-2 ring-amber-200 shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide">
                      Stage {s.stage}
                    </span>
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isCurrent && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                  </div>
                  <div className="font-bold text-xs truncate">{s.label}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Unlocked / Editing Banner */}
        {isEditing && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start space-x-3">
              <Unlock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <h4 className="font-extrabold text-amber-950 text-sm">Application Currently Unlocked for Editing</h4>
                <p className="text-amber-800 mt-0.5">
                  You can edit your submitted information across Personal, Address, Academic, Scheme-Specific, and Bank records, or replace uploaded PDF documents.
                  When finished, click <strong>"Save Corrections & Relock"</strong> to submit the corrected version to MoTA.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Locked Information Banner */}
        {isLocked && app.status !== 'query_raised' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#71816d] shrink-0" />
              <span>
                <strong>Application Securely Locked:</strong> All submitted details are preserved. If you noticed an error or want to change details, click <strong>"Unlock Form to Edit"</strong> above.
              </span>
            </div>
          </div>
        )}

        {/* Deficiency Action Banner (if query raised) */}
        {app.status === 'query_raised' && app.deficiency && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-extrabold text-rose-900 text-sm">Action Required: Verification Query Raised</h4>
                <p className="text-xs text-rose-800 mt-1">
                  Raised by: <span className="font-bold">{app.deficiency.raisedBy}</span> on{' '}
                  {new Date(app.deficiency.raisedAt).toLocaleDateString('en-IN')}
                </p>

                <div className="mt-2 bg-white/80 rounded-xl p-3 border border-rose-200 text-xs text-slate-800">
                  <p className="font-bold text-rose-900">Deficiency Items:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-700">
                    {app.deficiency.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {app.deficiency.note && (
                    <p className="mt-2 text-slate-600 italic">Officer Note: "{app.deficiency.note}"</p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeficiencyModal(true)}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    <span>Upload Corrected Documents & Resubmit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section Filter Tabs */}
        <div className="border-b border-[#dfcdb1] pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Information' },
              { id: 'personal', label: '1. Personal & Tribe' },
              { id: 'address', label: '2. Address & Domicile' },
              { id: 'academic', label: '3. Academic Records' },
              { id: 'scheme', label: '4. Scheme Details' },
              { id: 'bank', label: '5. Bank & DBT' },
              { id: 'documents', label: `6. Documents (${(app.documents || []).length})` },
              { id: 'timeline', label: '7. Audit History' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#71816d] text-white shadow-2xs'
                    : 'bg-[#f1e0c5] text-slate-700 hover:bg-[#e8d6ba]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: PERSONAL & COMMUNITY PARTICULARS */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'personal') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfcdb1] pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                <User className="w-4 h-4 mr-1.5 text-[#71816d]" />
                1. Personal & ST Community Particulars
              </h3>
              {isEditing && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                  Editable Mode Active
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Candidate Name</label>
                  <input
                    type="text"
                    value={editPersonal.fullName || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editPersonal.dob || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editPersonal.gender || 'Female'}
                    onChange={(e) => setEditPersonal({ ...editPersonal, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Social Category</label>
                  <input
                    type="text"
                    value={editPersonal.category || 'ST'}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ST Sub-Tribe Community</label>
                  <input
                    type="text"
                    value={editPersonal.tribeName || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, tribeName: e.target.value })}
                    placeholder="e.g. Gond, Santhal, Bhil, Munda"
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Annual Family Income (₹)</label>
                  <input
                    type="number"
                    value={editPersonal.annualIncome || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, annualIncome: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Father's / Guardian's Name</label>
                  <input
                    type="text"
                    value={editPersonal.fatherName || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, fatherName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={editPersonal.motherName || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, motherName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Contact Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editPersonal.phone || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    value={editPersonal.email || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Person with Disability (PwD)</label>
                  <select
                    value={editPersonal.physicallyHandicapped || 'No'}
                    onChange={(e) => setEditPersonal({ ...editPersonal, physicallyHandicapped: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Aadhaar (Masked)</label>
                  <input
                    type="text"
                    value={editPersonal.aadhaarMasked || ''}
                    onChange={(e) => setEditPersonal({ ...editPersonal, aadhaarMasked: e.target.value })}
                    placeholder="XXXX-XXXX-1234"
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Candidate Full Name</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{app.personal?.fullName || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Social Category & Community</span>
                  <span className="font-bold text-slate-900 mt-0.5 block flex items-center">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm mr-1">ST</span>
                    {app.personal?.tribeName || 'Scheduled Tribe'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Date of Birth</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.personal?.dob || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Gender</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.personal?.gender || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Annual Family Income</span>
                  <span className="font-extrabold text-emerald-700 mt-0.5 block text-sm">
                    ₹{(app.personal?.annualIncome || 0).toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-slate-500 ml-1">/ annum</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Aadhaar (e-KYC Verified)</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block flex items-center">
                    {app.personal?.aadhaarMasked || 'XXXX-XXXX-XXXX'}
                    <ShieldCheck className="w-3.5 h-3.5 ml-1.5 text-emerald-600" />
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Father's / Guardian Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.personal?.fatherName || 'Not Specified'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Mother's Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.personal?.motherName || 'Not Specified'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Mobile Phone</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.personal?.phone || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Email Address</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate" title={app.personal?.email}>
                    {app.personal?.email || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Person with Disability</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.personal?.physicallyHandicapped || 'No'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Applicant User ID</span>
                  <span className="font-mono text-slate-700 text-[11px] mt-0.5 block">{app.applicantId}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: ADDRESS & DOMICILE DETAILS */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'address') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfcdb1] pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-[#71816d]" />
                2. Address & Domicile Information
              </h3>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Permanent Residential Address</label>
                  <textarea
                    rows={2}
                    value={editAddress.permanentAddress || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, permanentAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State of Domicile</label>
                  <input
                    type="text"
                    value={editAddress.state || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value, domicileState: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={editAddress.district || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, district: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editAddress.pincode || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Domicile Certificate No.</label>
                  <input
                    type="text"
                    value={editAddress.domicileCertNo || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, domicileCertNo: e.target.value })}
                    placeholder="OD-DOM-2025-..."
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Permanent Residential Address</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.address?.permanentAddress || 'Address recorded on file'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">State of Domicile</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.address?.state || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">District</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.address?.district || 'Not Specified'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">PIN Code</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">{app.address?.pincode || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Domicile Certificate</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {app.address?.domicileCertNo || 'Validated via State Records'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: ACADEMIC & EDUCATION RECORDS */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'academic') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfcdb1] pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                <GraduationCap className="w-4 h-4 mr-1.5 text-[#71816d]" />
                3. Academic & Educational Background
              </h3>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Highest Qualification</label>
                  <input
                    type="text"
                    value={editAcademic.highestQualification || ''}
                    onChange={(e) => setEditAcademic({ ...editAcademic, highestQualification: e.target.value })}
                    placeholder="e.g. Master of Science, Post Graduation"
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Institution / University Name</label>
                  <input
                    type="text"
                    value={editAcademic.institutionName || ''}
                    onChange={(e) => setEditAcademic({ ...editAcademic, institutionName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Enrolled Course / Degree</label>
                  <input
                    type="text"
                    value={editAcademic.courseName || ''}
                    onChange={(e) => setEditAcademic({ ...editAcademic, courseName: e.target.value })}
                    placeholder="e.g. Ph.D. in Tribal Folklore, M.Tech"
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Roll Number / Student Reg ID</label>
                  <input
                    type="text"
                    value={editAcademic.rollNumber || ''}
                    onChange={(e) => setEditAcademic({ ...editAcademic, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Passing Year</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editAcademic.passingYear || ''}
                    onChange={(e) => setEditAcademic({ ...editAcademic, passingYear: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Aggregate Marks / Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editAcademic.percentageOrCgpa || ''}
                    onChange={(e) => setEditAcademic({ ...editAcademic, percentageOrCgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Highest Qualification</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{app.academic?.highestQualification || 'Post Graduation'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Enrolled Institution / University</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.academic?.institutionName || 'Not Specified'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Course / Degree Program</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.academic?.courseName || 'Ph.D. Research Scholar'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Roll / Registration Number</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">{app.academic?.rollNumber || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Year of Passing / Completion</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{app.academic?.passingYear || '2024'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Aggregate Marks Score</span>
                  <span className="font-extrabold text-indigo-700 text-sm mt-0.5 block">
                    {app.academic?.percentageOrCgpa || 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: SCHEME-SPECIFIC FELLOWSHIP DETAILS */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'scheme') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfcdb1] pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                4. Scheme-Specific Fellowship & Research Details
              </h3>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Research Topic / Title</label>
                  <input
                    type="text"
                    value={editSchemeSpecific.researchTopic || ''}
                    onChange={(e) => setEditSchemeSpecific({ ...editSchemeSpecific, researchTopic: e.target.value })}
                    placeholder="e.g. Ethnobotanical Knowledge of Tribal Communities"
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Guide / Supervisor Name</label>
                  <input
                    type="text"
                    value={editSchemeSpecific.guideName || ''}
                    onChange={(e) => setEditSchemeSpecific({ ...editSchemeSpecific, guideName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">University Department</label>
                  <input
                    type="text"
                    value={editSchemeSpecific.universityDepartment || ''}
                    onChange={(e) => setEditSchemeSpecific({ ...editSchemeSpecific, universityDepartment: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">PhD Registration Number</label>
                  <input
                    type="text"
                    value={editSchemeSpecific.phdRegNo || ''}
                    onChange={(e) => setEditSchemeSpecific({ ...editSchemeSpecific, phdRegNo: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                {app.schemeCode === 'NFST' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Fellowship Category</label>
                    <input
                      type="text"
                      disabled
                      value="JRF / SRF Full Fellowship"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Research Synopsis / Topic</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {app.schemeSpecific?.researchTopic || 'Research fellowship proposal submitted'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Guide / Supervisor</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {app.schemeSpecific?.guideName || 'Supervisory Committee Assigned'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Department</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {app.schemeSpecific?.universityDepartment || 'Post-Graduate Studies'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">PhD Registration No</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {app.schemeSpecific?.phdRegNo || 'PHD/2026/SETU'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">MoTA Selection Category</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {app.schemeCode} National ST Quota
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: BANK & DBT PARTICULARS */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'bank') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfcdb1] pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                <Landmark className="w-4 h-4 mr-1.5 text-[#71816d]" />
                5. Bank & Direct Benefit Transfer (DBT) Particulars
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> DBT Enabled (PFMS Ready)
                </span>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowAccountDigits(!showAccountDigits)}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center px-2 py-1 rounded-md bg-white border border-slate-200"
                  >
                    {showAccountDigits ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                    <span>{showAccountDigits ? 'Hide Digits' : 'Reveal Digits'}</span>
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={editBank.accountHolderName || ''}
                    onChange={(e) => setEditBank({ ...editBank, accountHolderName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editBank.bankName || ''}
                    onChange={(e) => setEditBank({ ...editBank, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editBank.branchName || ''}
                    onChange={(e) => setEditBank({ ...editBank, branchName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={editBank.accountNumber || ''}
                    onChange={(e) => setEditBank({ ...editBank, accountNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={editBank.ifscCode || ''}
                    onChange={(e) => setEditBank({ ...editBank, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#c9b79c] rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Account Holder</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{app.bank?.accountHolderName || app.applicantName}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Bank & Branch</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {app.bank?.bankName || 'State Bank of India'} ({app.bank?.branchName || 'Main Branch'})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Account Number</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {showAccountDigits
                      ? app.bank?.accountNumber
                      : (app.bank?.accountNumber || '1234567890').replace(/\d(?=\d{4})/g, '•')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">IFSC Code</span>
                  <span className="font-mono font-extrabold text-[#71816d] text-sm mt-0.5 block">{app.bank?.ifscCode || 'SBIN0000001'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                  <span className="text-slate-500 text-[11px] block">Disbursement Route</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aadhaar Payment Bridge (APB)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 6: UPLOADED DOCUMENTS & AI-OCR VERIFICATION */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'documents') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dfcdb1] pb-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-[#71816d]" />
                  6. Uploaded Supporting Documents & AI-OCR Extraction
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Extracted via iLovePDF OCR Pipeline & validated against MoTA database records
                </p>
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                {(app.documents || []).length} Verified Files
              </span>
            </div>

            {/* List of Documents */}
            <div className="space-y-4">
              {((isEditing ? editDocuments : app.documents) || []).map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="p-4 rounded-xl bg-white border border-[#dfcdb1] shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">{doc.type}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              (doc.ocrConfidence || 0) < 70
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            AI OCR Match: {doc.ocrConfidence || 95}%
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase">
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Filename: <span className="font-semibold text-slate-700">{doc.fileName}</span> ({doc.fileSize || 'PDF'}) • Uploaded: {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => triggerReplaceDocument(doc.type)}
                          disabled={isDocUploading}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <UploadCloud className="w-3 h-3 mr-1" />
                          <span>Replace Certificate</span>
                        </button>
                      )}

                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#f1e0c5] hover:bg-[#e8d6ba] text-slate-800 text-[11px] font-bold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 mr-1 text-slate-600" />
                        <span>Preview PDF</span>
                      </a>
                    </div>
                  </div>

                  {/* Extracted OCR Fields breakdown */}
                  {doc.ocrFields && doc.ocrFields.length > 0 && (
                    <div className="rounded-lg bg-[#fbf8f3] border border-[#dfcdb1] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center">
                          <Sparkles className="w-3 h-3 mr-1 text-orange-500" />
                          OCR Extracted Key Fields
                        </span>
                        <span className="text-[10px] text-slate-400">Confidence per attribute</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {doc.ocrFields.map((field) => (
                          <div
                            key={field.id}
                            className={`p-2 rounded-lg bg-white border text-xs ${
                              field.isMismatch ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                            }`}
                          >
                            <span className="text-[10px] text-slate-500 block truncate">{field.field}</span>
                            <span className="font-extrabold text-slate-900 block truncate">{field.value}</span>
                            <div className="flex items-center justify-between mt-1 text-[9px]">
                              <span className="text-emerald-700 font-bold">{field.confidence}% match</span>
                              {field.isMismatch && (
                                <span className="text-rose-600 font-bold flex items-center">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Mismatch
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 7: OFFICIAL SCRUTINY & AUDIT TRAIL */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'timeline') && (
          <div className="rounded-2xl bg-[#fcf9f5] border border-[#dfcdb1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfcdb1] pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-[#71816d]" />
                7. Official Verification Details & Audit Log
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                <span className="text-slate-500 text-[11px] block">Assigned Verification Officer</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {app.verifiedBy || 'MoTA Verification Cell (Shri Rajesh Kumar)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                <span className="text-slate-500 text-[11px] block">Verification Timestamp</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {app.verifiedAt ? new Date(app.verifiedAt).toLocaleString('en-IN') : 'Scheduled in current batch'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#dfcdb1]">
                <span className="text-slate-500 text-[11px] block">Official Remarks</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {app.remarks || 'Standard automated validation passed.'}
                </span>
              </div>
            </div>

            {/* Anomaly flags if any */}
            {app.anomalyFlags && app.anomalyFlags.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs">
                <p className="font-bold text-amber-900 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Flags Logged During Verification:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                  {app.anomalyFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FLOATING ACTION BAR (When In Edit Mode) */}
      {/* ========================================================= */}
      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-[94%] bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-40 border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white">Form Unlocked For Editing</p>
              <p className="text-[10px] text-slate-300">Make corrections and save to relock</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndRelock}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save & Relock Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UNLOCK CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#dfcdb1]">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Unlock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Unlock Application for Corrections?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlocking this application will allow you to edit your submitted personal details, address, academic background, bank particulars, or re-upload documents.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              ℹ️ <strong>Note:</strong> Once you finish updating, remember to click <strong>"Save Corrections & Relock Application"</strong> so your application is returned to the MoTA verification queue.
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Keep Locked
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md transition-colors cursor-pointer"
              >
                Yes, Unlock Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESUBMIT DEFICIENCY MODAL */}
      {/* ========================================================= */}
      {showDeficiencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Respond to Deficiency Query
            </h3>

            <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-900">
              <span className="font-bold">Required Fixes:</span> {app.deficiency?.reasons.join(', ')}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Upload Corrected Document (.PDF only)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                hidden
                ref={deficiencyFileInputRef}
                onChange={handleDeficiencyFileChange}
              />
              <button
                type="button"
                onClick={() => deficiencyFileInputRef.current?.click()}
                disabled={reuploading}
                className="w-full py-4 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50/50 hover:bg-orange-50 text-center text-xs font-bold text-orange-900 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-6 h-6 mx-auto mb-1 text-orange-500" />
                <span>{reuploading ? 'Processing OCR...' : 'Click to Pick & Upload Revised Certificate (PDF)'}</span>
              </button>

              {revisedDocs.length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-bold">{revisedDocs[0].fileName} ({revisedDocs[0].fileSize})</span>
                  <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md font-bold text-[10px]">
                    Ready to Resubmit
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#dfcdb1]">
              <button
                type="button"
                onClick={() => setShowDeficiencyModal(false)}
                className="px-4 py-2 rounded-xl bg-[#e8d6ba] text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResubmitDeficiency}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Resubmit to Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
