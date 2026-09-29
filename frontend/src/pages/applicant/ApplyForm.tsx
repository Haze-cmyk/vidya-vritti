import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { mockApi } from '../../lib/mockApi';
import { useAuth } from '../../context/AuthContext';
import { Scheme, OCRField, Document, PersonalDetails } from '../../types';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  Download,
  Building2,
  Lock,
  User,
  GraduationCap,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { draftManager } from '../../lib/draftManager';

interface CertificateUploadSlotProps {
  docType: string;
  existing?: Document;
  onUploadSuccess: (doc: Document) => void;
  onFieldChange: (docType: string, fieldId: string, val: string) => void;
  onAutoFillToForm?: (fields: OCRField[]) => void;
  compareValues: {
    fullName?: string;
    tribeName?: string;
    annualIncome?: number;
    dob?: string;
  };
}

const CertificateUploadSlot: React.FC<CertificateUploadSlotProps> = ({
  docType,
  existing,
  onUploadSuccess,
  onFieldChange,
  onAutoFillToForm,
  compareValues
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate it's a PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Only PDF documents are accepted for verification.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setNotice(null);

    try {
      const res = await mockApi.uploadDocument(file, docType, compareValues);
      onUploadSuccess(res.document);
      if (res.message) {
        setNotice(res.message);
      }
      toast.success(`${file.name} uploaded and OCR extracted successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[#f1e0c5] border border-[#c9b79c] space-y-3">
      {/* Real native hidden file input strictly restricted to PDF */}
      <input
        type="file"
        accept=".pdf,application/pdf"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-900">{docType}</span>
          {existing ? (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                {existing.fileName} ({existing.fileSize})
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  (existing.ocrConfidence || 0) < 70
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                OCR Confidence: {existing.ocrConfidence || 0}%
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 mt-0.5">Mandatory PDF Document (Max 15MB)</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`inline-flex items-center px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-[#e8d6ba] text-slate-800 text-xs font-bold shadow-xs transition-colors cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <UploadCloud className="w-4 h-4 mr-1.5 text-orange-500 shrink-0" />
          <span>{uploading ? 'Running OCR...' : existing ? 'Re-upload Certificate' : 'Upload Certificate'}</span>
        </button>
      </div>

      {notice && (
        <div className="text-[11px] text-slate-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          ℹ️ {notice}
        </div>
      )}

      {/* Extracted OCR Verification Summary (Tamper-Proof & Read-Only) */}
      {existing && existing.ocrFields && existing.ocrFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#dfcdb1] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-800 uppercase flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#71816d]" />
              AI Verified Certificate Data (Read-Only):
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Extracted from PDF via OCR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {existing.ocrFields.map((field) => (
              <div
                key={field.id}
                className={`p-2.5 rounded-lg border ${
                  field.isMismatch
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-white border-[#dfcdb1]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                  <span>{field.field}</span>
                  <span
                    className={
                      field.confidence < 70 ? 'text-rose-600 font-extrabold' : 'text-emerald-700'
                    }
                  >
                    {field.confidence}% Match
                  </span>
                </div>
                <div className="px-2.5 py-1.5 bg-[#fbf8f3] border border-[#dfcdb1] rounded text-xs font-semibold text-slate-900 select-all">
                  {field.value || 'Not Detected'}
                </div>
                {field.isMismatch && (
                  <p className="text-[10px] text-rose-700 font-bold mt-1">
                    ⚠️ {field.expectedValue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ApplyFormPage: React.FC = () => {
  const { schemeId } = useParams<{ schemeId: string }>();
  const [searchParams] = useSearchParams();
  const editAppId = searchParams.get('editAppId');
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Auto-save Draft state
  const draftStorageKey = `vidya_vrtti_draft_${user?.id || 'guest'}_${schemeId || 'default'}${editAppId ? `_${editAppId}` : ''}`;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const isInitialMount = useRef(true);

  // Form State initialized from user profile, without fake dummy names
  const [personal, setPersonal] = useState<PersonalDetails>({
    fullName: user?.name || '',
    dob: user?.dob || '',
    gender: (user?.gender as any) || 'Female',
    category: 'ST',
    tribeName: user?.tribe || '',
    fatherName: user?.fatherName || '',
    motherName: user?.motherName || '',
    aadhaarMasked: user?.aadhaar || '',
    phone: user?.phone || '',
    email: user?.email || '',
    physicallyHandicapped: 'No',
    annualIncome: user?.annualIncome || 0
  });

  const [address, setAddress] = useState({
    permanentAddress: user?.permanentAddress || user?.officeAddress || '',
    state: user?.state || 'Odisha',
    district: user?.district || '',
    pincode: user?.pincode || '',
    domicileCertNo: '',
    domicileState: user?.state || 'Odisha'
  });

  const [academic, setAcademic] = useState({
    highestQualification: user?.highestQualification || '',
    institutionName: '',
    courseName: '',
    passingYear: '',
    percentageOrCgpa: 0,
    rollNumber: ''
  });

  const [schemeSpecific, setSchemeSpecific] = useState({
    researchTopic: '',
    guideName: '',
    universityDepartment: '',
    phdRegNo: '',
    foreignUniversity: '',
    country: '',
    greScore: ''
  });

  const [bank, setBank] = useState({
    accountHolderName: user?.name || '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: ''
  });

  // Uploaded Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);

  // Pre-fill / reload details from registration profile
  const handlePrefillFromProfile = (notify = true) => {
    if (!user) return;
    setPersonal((prev) => ({
      ...prev,
      fullName: user.name || prev.fullName,
      dob: user.dob || prev.dob,
      gender: (user.gender as any) || prev.gender || 'Female',
      category: 'ST',
      tribeName: user.tribe || prev.tribeName,
      fatherName: user.fatherName || prev.fatherName,
      motherName: user.motherName || prev.motherName,
      aadhaarMasked: user.aadhaar || prev.aadhaarMasked,
      phone: user.phone || prev.phone,
      email: user.email || prev.email,
      annualIncome: user.annualIncome || prev.annualIncome
    }));

    setAddress((prev) => ({
      ...prev,
      permanentAddress: user.permanentAddress || user.officeAddress || prev.permanentAddress,
      state: user.state || prev.state || 'Odisha',
      district: user.district || prev.district,
      pincode: user.pincode || prev.pincode,
      domicileState: user.state || prev.domicileState || 'Odisha'
    }));

    setBank((prev) => ({
      ...prev,
      accountHolderName: user.name || prev.accountHolderName
    }));

    if (notify) {
      toast.success('Pre-filled details from your registration profile! All fields remain fully editable.');
    }
  };

  useEffect(() => {
    if (schemeId) {
      mockApi.getSchemeById(schemeId).then((data) => {
        setScheme(data);
      });
    }
    if (editAppId) {
      mockApi.getApplicationById(editAppId).then((existingApp) => {
        if (existingApp) {
          if (existingApp.personal) setPersonal((prev) => ({ ...prev, ...existingApp.personal }));
          if (existingApp.address) setAddress((prev) => ({ ...prev, ...existingApp.address }));
          if (existingApp.academic) setAcademic((prev) => ({ ...prev, ...existingApp.academic }));
          if (existingApp.schemeSpecific) setSchemeSpecific((prev) => ({ ...prev, ...existingApp.schemeSpecific }));
          if (existingApp.bank) setBank((prev) => ({ ...prev, ...existingApp.bank }));
          if (existingApp.documents && Array.isArray(existingApp.documents)) setDocuments(existingApp.documents);
          setMaxStepReached(7);
          setCompletedSteps([1, 2, 3, 4, 5, 6, 7]);
          setDeclarationConfirmed(true);
          toast.info(`Editing submitted Application: ${existingApp.id}`);
        }
      });
    } else if (user?.id) {
      mockApi.getApplications({ applicantId: user.id }).then((apps) => {
        if (apps && apps.length > 0) {
          toast.error("You have already applied for a scheme.");
          navigate('/app/schemes');
        }
      }).catch(() => {});
    }
  }, [schemeId, user, navigate, editAppId]);

  // Keep form in sync when user profile loads initially
  useEffect(() => {
    if (user && !editAppId) {
      handlePrefillFromProfile(false);
    }
  }, [user, editAppId]);

  const handleDocUploaded = (newDoc: Document) => {
    setDocuments((prev) => [...prev.filter((d) => d.type !== newDoc.type), newDoc]);
  };

  const handleFieldChange = (docType: string, fieldId: string, val: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.type !== docType) return d;
        const updatedFields = (d.ocrFields || []).map((f) => {
          if (f.id === fieldId) {
            return { ...f, value: val, isMismatch: false };
          }
          return f;
        });
        return { ...d, ocrFields: updatedFields };
      })
    );
  };

  const handleAutoFillFromOCR = (ocrFields: OCRField[]) => {
    ocrFields.forEach((f) => {
      const fieldName = f.field.toLowerCase();
      if (fieldName.includes('candidate name') && f.value) {
        setPersonal((prev) => ({ ...prev, fullName: f.value }));
      }
      if (fieldName.includes('tribe') && f.value) {
        setPersonal((prev) => ({ ...prev, tribeName: f.value }));
      }
      if (fieldName.includes('income') && f.value) {
        const num = parseInt(f.value.replace(/[^\d]/g, ''), 10);
        if (!isNaN(num)) {
          setPersonal((prev) => ({ ...prev, annualIncome: num }));
        }
      }
      if (fieldName.includes('date of birth') && f.value) {
        setPersonal((prev) => ({ ...prev, dob: f.value }));
      }
      if (fieldName.includes('roll') && f.value) {
        setAcademic((prev) => ({ ...prev, rollNumber: f.value }));
      }
    });
    toast.success('Form synchronized with certificate OCR fields!');
  };

  const handleNext = () => {
    setCompletedSteps((prev) => Array.from(new Set([...prev, currentStep])));
    setMaxStepReached((prev) => Math.max(prev, currentStep + 1));
    setCurrentStep((prev) => Math.min(prev + 1, 7));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Restore auto-saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.personal) setPersonal((prev) => ({ ...prev, ...parsed.personal }));
        if (parsed.address) setAddress((prev) => ({ ...prev, ...parsed.address }));
        if (parsed.academic) setAcademic((prev) => ({ ...prev, ...parsed.academic }));
        if (parsed.schemeSpecific) setSchemeSpecific((prev) => ({ ...prev, ...parsed.schemeSpecific }));
        if (parsed.bank) setBank((prev) => ({ ...prev, ...parsed.bank }));
        if (parsed.documents && Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 7) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.maxStepReached) {
          setMaxStepReached(parsed.maxStepReached);
        } else if (parsed.currentStep) {
          setMaxStepReached(parsed.currentStep);
        }
        if (parsed.completedSteps && Array.isArray(parsed.completedSteps)) {
          setCompletedSteps(parsed.completedSteps);
        } else if (parsed.maxStepReached || parsed.currentStep) {
          const highest = parsed.maxStepReached || parsed.currentStep;
          setCompletedSteps(Array.from({ length: highest - 1 }, (_, i) => i + 1));
        }
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt));
        }
        setDraftRestored(true);
        toast.info('Restored your auto-saved application draft');
      }
    } catch (e) {
      console.warn('Could not restore draft:', e);
    }
  }, [draftStorageKey]);

  // 2. Debounced auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (submittedAppId) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        const payload = {
          schemeId: schemeId || 'sch-nfst-01',
          schemeName: scheme?.name || 'National Fellowship for Higher Education of ST Students',
          schemeCode: scheme?.code || 'NFST',
          currentStep,
          maxStepReached,
          completedSteps,
          personal,
          address,
          academic,
          schemeSpecific,
          bank,
          documents,
          savedAt: new Date().toISOString()
        };
        draftManager.saveDraft(draftStorageKey, payload);
        setLastSaved(new Date());
        setDraftRestored(true);
      } catch (err) {
        console.warn('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [personal, address, academic, schemeSpecific, bank, documents, currentStep, maxStepReached, completedSteps, draftStorageKey, submittedAppId, schemeId, scheme]);

  const handleClearDraft = () => {
    draftManager.clearDraft(draftStorageKey);
    setDraftRestored(false);
    setLastSaved(null);
    setCompletedSteps([]);
    setMaxStepReached(1);
    setPersonal({
      fullName: user?.name || '',
      dob: '',
      gender: 'Female',
      category: 'ST',
      tribeName: user?.tribe || '',
      fatherName: '',
      motherName: '',
      aadhaarMasked: user?.aadhaar || '',
      phone: user?.phone || '',
      email: user?.email || '',
      physicallyHandicapped: 'No',
      annualIncome: 0
    });
    setAddress({
      permanentAddress: '',
      state: user?.state || 'Odisha',
      district: '',
      pincode: '',
      domicileCertNo: '',
      domicileState: user?.state || 'Odisha'
    });
    setAcademic({
      highestQualification: '',
      institutionName: '',
      courseName: '',
      passingYear: '',
      percentageOrCgpa: 0,
      rollNumber: ''
    });
    setSchemeSpecific({
      researchTopic: '',
      guideName: '',
      universityDepartment: '',
      phdRegNo: '',
      foreignUniversity: '',
      country: '',
      greScore: ''
    });
    setBank({
      accountHolderName: user?.name || '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    });
    setDocuments([]);
    setCurrentStep(1);
    toast.info('Draft cleared and form reset');
  };

  const handleSubmit = async () => {
    if (!declarationConfirmed) {
      toast.error('Please confirm the self-declaration checkbox');
      return;
    }

    setSubmitting(true);
    try {
      if (editAppId) {
        const updated = await mockApi.updateApplication(editAppId, {
          personal,
          address,
          academic,
          schemeSpecific,
          bank,
          documents,
          status: 'submitted'
        });
        setSubmittedAppId(updated.id);
        localStorage.removeItem(draftStorageKey);
        setDraftRestored(false);
        toast.success(`Application ${updated.id} Corrections Saved & Locked!`);
        return;
      }

      const newApp = await mockApi.submitApplication({
        applicantId: user.id,
        schemeId: scheme?.id || 'scheme-nfst',
        schemeCode: scheme?.code || 'NFST',
        schemeName: scheme?.name || 'National Fellowship for ST Students',
        personal,
        address,
        academic,
        schemeSpecific,
        bank,
        documents
      });

      setSubmittedAppId(newApp.id);
      draftManager.clearDraft(draftStorageKey);
      setDraftRestored(false);
      toast.success(`Application Submitted Successfully! ID: ${newApp.id}`);
    } catch (err) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate PDF Acknowledgment
  const generatePDFReceipt = () => {
    if (!submittedAppId) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MINISTRY OF TRIBAL AFFAIRS (MoTA)', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Vidya-Vrtti Application Submission Acknowledgment', 105, 28, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Application ID: ${submittedAppId}`, 20, 42);
    doc.text(`Submission Date: ${new Date().toLocaleDateString('en-IN')}`, 130, 42);
    doc.text(`Scheme Code: ${scheme?.code || 'NFST'}`, 20, 50);
    doc.text(`Candidate Name: ${personal.fullName}`, 20, 58);
    doc.text(`ST Tribe Community: ${personal.tribeName}`, 20, 66);
    doc.text(`State of Domicile: ${address.state}`, 20, 74);
    doc.text(`Aadhaar Number: ${personal.aadhaarMasked}`, 20, 82);

    doc.setFont('helvetica', 'bold');
    doc.text('Uploaded Mandatory Documents Verified by AI OCR:', 20, 95);
    doc.setFont('helvetica', 'normal');
    documents.forEach((d, idx) => {
      doc.text(`${idx + 1}. ${d.type} - ${d.fileName} (Confidence: ${d.ocrConfidence || 95}%)`, 25, 105 + idx * 8);
    });

    doc.text('This is a computer-generated acknowledgment issued under DBT Portal.', 105, 170, { align: 'center' });
    doc.save(`Vidya-Vrtti_Acknowledgment_${submittedAppId.replace(/\//g, '_')}.pdf`);
  };

  // If already submitted success view:
  if (submittedAppId) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-[#c9b79c] p-8 text-center shadow-lg">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          {editAppId ? 'Corrections Saved & Application Relocked!' : 'Application Submitted to MoTA!'}
        </h2>
        <p className="text-xs text-slate-600 mt-2">
          Your application ID is <span className="font-extrabold text-[#71816d] text-sm">{submittedAppId}</span>
        </p>

        <div className="mt-6 p-4 rounded-xl bg-[#f1e0c5] border border-[#c9b79c] text-xs text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Scheme:</span>
            <span className="font-bold text-slate-900">{scheme?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Applicant Name:</span>
            <span className="font-bold text-slate-900">{personal.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">ST Tribe & Domicile:</span>
            <span className="font-bold text-slate-900">
              {personal.tribeName} ({address.state})
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={generatePDFReceipt}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#71816d] hover:bg-[#8c9c88] text-white font-bold text-xs shadow-md"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Download Official Acknowledgment PDF</span>
          </button>
          <button
            onClick={() => navigate('/app/applications')}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md"
          >
            <span>Track Application Status</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#c9b79c] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            {scheme?.code || 'NFST'} Application Form
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">{scheme?.name}</h1>
        </div>

        {/* Automatic Draft Status Indicator */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            {isSaving ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-700 font-semibold">Auto-saving draft...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {lastSaved
                    ? `Auto-saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Auto-saved as draft'}
                </span>
              </>
            )}
          </div>

          {draftRestored && (
            <button
              type="button"
              onClick={handleClearDraft}
              title="Clear saved draft and reset form"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Step Horizontal Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-[#c9b79c] shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] text-xs font-bold">
          {[
            { num: 1, name: 'Personal' },
            { num: 2, name: 'Address' },
            { num: 3, name: 'Academic' },
            { num: 4, name: 'Scheme Spec' },
            { num: 5, name: 'Bank Details' },
            { num: 6, name: 'Documents' },
            { num: 7, name: 'Review & Submit' }
          ].map((s) => {
            const isCompleted = completedSteps.includes(s.num) || s.num < maxStepReached;
            const isCurrent = currentStep === s.num;
            const isClickable = s.num <= maxStepReached;

            return (
              <div
                key={s.num}
                onClick={() => isClickable && setCurrentStep(s.num)}
                className={`flex items-center space-x-1.5 transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  isCurrent
                    ? 'text-[#71816d] font-extrabold'
                    : isCompleted
                    ? 'text-emerald-700 font-bold hover:text-emerald-800'
                    : 'text-slate-400'
                }`}
                title={isClickable ? `Go to Step ${s.num}: ${s.name}` : undefined}
              >
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    isCurrent && isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-sm scale-110'
                      : isCurrent
                      ? 'bg-[#71816d] text-white ring-4 ring-blue-100 shadow-sm scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="hidden md:inline">{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Form Body */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#c9b79c] shadow-xs">
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Step 1: Personal Information</h3>
              <span className="text-[11px] text-slate-500">Review & edit pre-filled profile details</span>
            </div>

            {/* Registration Profile Pre-fill Notice Banner */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#fbf8f3] border border-[#dfcdb1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#f1e0c5] text-[#71816d] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      Pre-filled from Registration Profile
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                      Auto-loaded
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    Data loaded for {personal.fullName || user?.name || 'Applicant'}. You can freely edit any field below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePrefillFromProfile(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#f1e0c5] hover:bg-[#e8d6ba] text-[#2c352a] text-xs font-bold border border-[#c9b79c] transition-colors cursor-pointer shrink-0"
                title="Reload fields from registration profile"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#71816d]" />
                <span>Reload Profile Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Candidate Name *</label>
                <input
                  type="text"
                  value={personal.fullName}
                  placeholder="Enter full name"
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Date of Birth *</label>
                <input
                  type="date"
                  value={personal.dob}
                  onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Gender *</label>
                <select
                  value={personal.gender}
                  onChange={(e) => setPersonal({ ...personal, gender: e.target.value as any })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Category (ST Auto-Verified)</label>
                <input
                  type="text"
                  disabled
                  value="Scheduled Tribe (ST)"
                  className="mt-1 block w-full px-3 py-2 border border-[#c9b79c] rounded-lg text-xs bg-[#e8d6ba] font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">ST Tribe Community Name *</label>
                <input
                  type="text"
                  value={personal.tribeName}
                  placeholder="e.g. Santhal, Gond, Bodo, Bhil"
                  onChange={(e) => setPersonal({ ...personal, tribeName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Mobile Phone Number *</label>
                <input
                  type="tel"
                  value={personal.phone}
                  placeholder="10 digit mobile"
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  value={personal.email}
                  placeholder="Enter email address"
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Father's Name</label>
                <input
                  type="text"
                  value={personal.fatherName}
                  placeholder="Enter father's name"
                  onChange={(e) => setPersonal({ ...personal, fatherName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Mother's Name</label>
                <input
                  type="text"
                  value={personal.motherName}
                  placeholder="Enter mother's name"
                  onChange={(e) => setPersonal({ ...personal, motherName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Annual Family Income (INR) *</label>
                <input
                  type="number"
                  value={personal.annualIncome}
                  placeholder="Enter annual income"
                  onChange={(e) => setPersonal({ ...personal, annualIncome: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Aadhaar / Photo ID Reference</label>
                <input
                  type="text"
                  value={personal.aadhaarMasked}
                  placeholder="XXXX-XXXX-1234 or ID"
                  onChange={(e) => setPersonal({ ...personal, aadhaarMasked: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#71816d] outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Step 2: Address & Domicile Details</h3>
              <span className="text-[11px] text-slate-500">Review & edit pre-filled address</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Permanent Residential Address</label>
              <textarea
                rows={3}
                value={address.permanentAddress}
                onChange={(e) => setAddress({ ...address, permanentAddress: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">State of Domicile</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">District</label>
                <input
                  type="text"
                  value={address.district}
                  onChange={(e) => setAddress({ ...address, district: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">PIN Code</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Domicile Certificate Reference Number</label>
              <input
                type="text"
                value={address.domicileCertNo}
                onChange={(e) => setAddress({ ...address, domicileCertNo: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* Step 3: Academic Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Step 3: Academic History</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Highest Qualification</label>
                <input
                  type="text"
                  value={academic.highestQualification}
                  onChange={(e) => setAcademic({ ...academic, highestQualification: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Institution / University Name</label>
                <input
                  type="text"
                  value={academic.institutionName}
                  onChange={(e) => setAcademic({ ...academic, institutionName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Aggregate Percentage / CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={academic.percentageOrCgpa}
                  onChange={(e) => setAcademic({ ...academic, percentageOrCgpa: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Year of Passing</label>
                <input
                  type="text"
                  value={academic.passingYear}
                  onChange={(e) => setAcademic({ ...academic, passingYear: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Scheme Specific */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Step 4: Scheme-Specific Research Details</h3>

            {scheme?.code === 'NOS' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Foreign University Name</label>
                  <input
                    type="text"
                    value={schemeSpecific.foreignUniversity}
                    onChange={(e) => setSchemeSpecific({ ...schemeSpecific, foreignUniversity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Destination Country</label>
                  <input
                    type="text"
                    value={schemeSpecific.country}
                    onChange={(e) => setSchemeSpecific({ ...schemeSpecific, country: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Ph.D. / M.Phil Research Synopsis Topic</label>
                  <textarea
                    rows={3}
                    value={schemeSpecific.researchTopic}
                    onChange={(e) => setSchemeSpecific({ ...schemeSpecific, researchTopic: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Research Guide / Supervisor Name</label>
                    <input
                      type="text"
                      value={schemeSpecific.guideName}
                      onChange={(e) => setSchemeSpecific({ ...schemeSpecific, guideName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Ph.D. Registration Number</label>
                    <input
                      type="text"
                      value={schemeSpecific.phdRegNo}
                      onChange={(e) => setSchemeSpecific({ ...schemeSpecific, phdRegNo: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Bank Details */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Step 5: Bank Account & Direct Benefit Transfer (DBT)</h3>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
              <span className="font-bold">Aadhaar Seeded Bank Account:</span> Fellowship funds will be directly credited to this account via PFMS payment gateway.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Account Holder Name</label>
                <input
                  type="text"
                  value={bank.accountHolderName}
                  onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Bank Account Number</label>
                <input
                  type="text"
                  value={bank.accountNumber}
                  onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Bank IFSC Code</label>
                <input
                  type="text"
                  value={bank.ifscCode}
                  onChange={(e) => setBank({ ...bank, ifscCode: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Bank Name & Branch</label>
                <input
                  type="text"
                  disabled
                  value={`${bank.bankName} (${bank.branchName})`}
                  className="mt-1 block w-full px-3 py-2 border border-[#c9b79c] rounded-lg text-xs bg-[#e8d6ba] font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Documents Upload & OCR */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Step 6: Document Upload & AI OCR Extraction</h3>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                iLovePDF AI OCR Enabled
              </span>
            </div>

            <div className="space-y-4">
              {(scheme?.requiredDocs && scheme.requiredDocs.length > 0
                ? scheme.requiredDocs
                : ['ST Caste Certificate', 'Income Certificate', 'Post-Graduation Marksheet', 'Institute Admission Letter']
              ).map((docType) => {
                const existing = documents.find((d) => d.type === docType);
                return (
                  <CertificateUploadSlot
                    key={docType}
                    docType={docType}
                    existing={existing}
                    onUploadSuccess={handleDocUploaded}
                    onFieldChange={handleFieldChange}
                    onAutoFillToForm={handleAutoFillFromOCR}
                    compareValues={{
                      fullName: personal.fullName,
                      tribeName: personal.tribeName,
                      annualIncome: personal.annualIncome,
                      dob: personal.dob
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step 7: Review & Submit */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Step 7: Final Review & Submission</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#f1e0c5] border border-[#c9b79c]">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Personal & ST Details</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {personal.fullName} | Tribe: <span className="font-bold text-slate-900">{personal.tribeName}</span> | Income: ₹{personal.annualIncome.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#f1e0c5] border border-[#c9b79c]">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Academic & Research Synopsis</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {academic.highestQualification} ({academic.institutionName}) - Marks: {academic.percentageOrCgpa}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationConfirmed}
                    onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-slate-800 font-medium">
                    I hereby declare that I belong to the Scheduled Tribe (ST) community and all documents uploaded are authentic.
                    I understand any misrepresentation will lead to immediate cancellation of scholarship under MoTA rules.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Navigation Bar */}
        <div className="mt-8 pt-4 border-t border-[#dfcdb1] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-[#e8d6ba] hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Previous</span>
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-[#71816d] hover:bg-[#8c9c88] text-white font-bold text-xs shadow-md"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md"
            >
              {submitting
                ? (editAppId ? 'Saving Corrections...' : 'Submitting to MoTA...')
                : (editAppId ? 'Save Corrections & Relock Application' : 'Final Submit Application')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
