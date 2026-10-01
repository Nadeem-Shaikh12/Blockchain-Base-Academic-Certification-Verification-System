import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ShieldAlert, XCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certId, setCertId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      handleVerify(id);
      // Remove the ID from the URL so that a page refresh starts fresh
      navigate('/verify', { replace: true });
    }
  }, [id, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId) {
      handleVerify(certId);
    }
  };

  const handleVerify = async (certificateId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/verify/${certificateId}`);
      setResult(res.data);
      if (res.data.status === 'VERIFIED') {
        toast.success('Certificate Verified successfully!');
      } else {
        toast.error(`Verification returned status: ${res.data.status}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Academic Verifier</h1>
          </div>
          <button 
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-slate-100" 
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={16} /> Portal Access
          </button>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 z-10">
        
        {/* Search Section */}
        <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>
          
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
            <Search size={36} />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Verify Academic Credentials</h2>
          <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto">
            Enter a digital certificate ID to instantly verify its authenticity and integrity against our immutable blockchain ledger.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-slate-400" size={20} />
              </div>
              <input 
                type="text" 
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg" 
                placeholder="e.g. CERT-MGM-2027-000001" 
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="px-8 py-4 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg min-w-[140px] flex items-center justify-center" 
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Verify Now'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className={`bg-white rounded-3xl p-8 md:p-12 shadow-xl border-t-8 animate-fade-in ${
            result.status === 'VERIFIED' ? 'border-t-emerald-500 shadow-emerald-100/50' : 
            result.status === 'REVOKED' ? 'border-t-amber-500 shadow-amber-100/50' : 
            'border-t-red-500 shadow-red-100/50'
          }`}>
            
            <div className="flex flex-col items-center mb-10 text-center">
              {result.status === 'VERIFIED' && (
                <>
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                    <ShieldCheck size={48} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-emerald-600 mb-2">CERTIFICATE VERIFIED</h2>
                  <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-emerald-50 rounded-full text-sm font-semibold text-emerald-700 border border-emerald-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Blockchain Ledger Matched
                  </div>
                </>
              )}
              {result.status === 'TAMPERED' && (
                <>
                  <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-red-100">
                    <ShieldAlert size={48} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-red-600 mb-2">INTEGRITY COMPROMISED</h2>
                  <p className="text-lg mt-2 text-red-700 max-w-lg font-medium">
                    {result.message}
                  </p>
                </>
              )}
              {result.status === 'REVOKED' && (
                <>
                  <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-amber-100">
                    <XCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-amber-600 mb-2">CERTIFICATE REVOKED</h2>
                  <p className="text-lg mt-2 text-amber-700 max-w-lg font-medium">
                    {result.message}
                  </p>
                </>
              )}
            </div>

            {result.certificate && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-4 border-b border-slate-200">
                  Document Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Certificate ID</p>
                    <p className="font-mono text-lg font-bold text-slate-800">{result.certificate.certificate_id}</p>
                  </div>
                  
                  {result.certificate.student_name && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recipient Name</p>
                        <p className="font-semibold text-slate-800 text-lg">{result.certificate.student_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Academic Program</p>
                        <p className="font-semibold text-slate-800 text-lg">{result.certificate.course}</p>
                        <p className="text-sm text-slate-500">{result.certificate.department}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Performance</p>
                        <p className="font-semibold text-slate-800 text-lg">Grade {result.certificate.grade} <span className="text-slate-400 font-normal mx-1">•</span> {result.certificate.cgpa} CGPA</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Issuing Institution</p>
                        <p className="font-semibold text-slate-800 text-lg">{result.certificate.issued_by}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date of Issue</p>
                        <p className="font-semibold text-slate-800 text-lg">{new Date(result.certificate.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  setResult(null);
                  setCertId('');
                  navigate('/verify');
                }}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Search size={18} /> Verify Another Certificate
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
