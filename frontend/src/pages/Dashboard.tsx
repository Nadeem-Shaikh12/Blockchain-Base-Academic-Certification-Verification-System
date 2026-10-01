import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, FileBadge, Database, Activity, FileText, UserPlus, Award } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [certificates, setCertificates] = useState([]);
  const [blockchain, setBlockchain] = useState([]);
  const [integrity, setIntegrity] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);

  // Add Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '', roll_number: '', enrollment_number: '', email: '', phone: '', course: '', department: '', admission_year: '', passing_year: ''
  });

  // Issue Certificate Form State
  const [certForm, setCertForm] = useState({
    student_id: '', certificate_type: 'Degree Certificate', grade: '', cgpa: '', passing_year: '', issue_date: ''
  });
  const [issueLoading, setIssueLoading] = useState(false);


  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchCertificates();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/students', studentForm);
      toast.success('Student registered successfully');
      fetchStudents();
      setStudentForm({ name: '', roll_number: '', enrollment_number: '', email: '', phone: '', course: '', department: '', admission_year: '', passing_year: '' });
      setActiveTab('students');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueLoading(true);
    try {
      const res = await api.post('/certificates', certForm);
      toast.success('Certificate issued successfully on the blockchain!');
      fetchCertificates();
      fetchBlockchain();
      setCertForm({ student_id: '', certificate_type: 'Degree Certificate', grade: '', cgpa: '', passing_year: '', issue_date: '' });
      setActiveTab('certificates');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssueLoading(false);
    }
  };


  const fetchCertificates = async () => {
    try {
      const res = await api.get('/certificates');
      setCertificates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlockchain = async () => {
    try {
      const res = await api.get('/blockchain');
      setBlockchain(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkIntegrity = async () => {
    try {
      const res = await api.get('/blockchain/integrity');
      setIntegrity(res.data);
      if (res.data.isValid) {
        toast.success('Blockchain integrity verified');
      } else {
        toast.error('Blockchain tampering detected!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDownload = async (id: string) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      const res = await api.get(`/certificates/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Downloaded', { id: 'pdf' });
    } catch (err) {
      toast.error('Download failed', { id: 'pdf' });
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this certificate? This action will be permanently recorded on the blockchain.')) return;
    try {
      const reason = window.prompt('Enter reason for revocation:');
      if (!reason) return;
      
      toast.loading('Revoking on blockchain...', { id: 'revoke' });
      await api.post(`/certificates/${id}/revoke`, { reason });
      toast.success('Certificate revoked', { id: 'revoke' });
      fetchCertificates();
      fetchBlockchain();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke', { id: 'revoke' });
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Database className="text-primary" size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">CertBlock</h2>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</p>
          
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Home size={18} className={activeTab === 'overview' ? 'text-white' : 'text-slate-500'} /> 
            <span className="font-medium text-sm">Overview</span>
          </button>
          
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN') && (
            <>
              <button 
                onClick={() => { setActiveTab('students'); fetchStudents(); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === 'students' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <UserPlus size={18} className={activeTab === 'students' ? 'text-white' : 'text-slate-500'} /> 
                <span className="font-medium text-sm">Students</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('issue'); fetchStudents(); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === 'issue' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Award size={18} className={activeTab === 'issue' ? 'text-white' : 'text-slate-500'} /> 
                <span className="font-medium text-sm">Issue Certificate</span>
              </button>
            </>
          )}

          <button 
            onClick={() => { setActiveTab('certificates'); fetchCertificates(); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === 'certificates' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FileBadge size={18} className={activeTab === 'certificates' ? 'text-white' : 'text-slate-500'} /> 
            <span className="font-medium text-sm">Certificates Registry</span>
          </button>
          
          {(user.role === 'SUPER_ADMIN' || user.role === 'COLLEGE_ADMIN') && (
            <button 
              onClick={() => { setActiveTab('blockchain'); fetchBlockchain(); checkIntegrity(); }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === 'blockchain' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Activity size={18} className={activeTab === 'blockchain' ? 'text-white' : 'text-slate-500'} /> 
              <span className="font-medium text-sm">Blockchain Ledger</span>
            </button>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-white shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-bold shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100 text-sm font-medium">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 z-10 sticky top-0">
          <h1 className="text-xl font-semibold text-slate-800 capitalize tracking-tight">{activeTab.replace('_', ' ')}</h1>
        </header>
        
        {/* Background blobs for premium feel */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <main className="flex-1 overflow-y-auto p-8 z-10">
          
          {activeTab === 'overview' && (
            <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome back, {user.name.split(' ')[0]}</h2>
                <p className="text-slate-500 max-w-lg">
                  Manage and verify academic certificates securely using advanced cryptographic blockchain technology.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Total Issued</p>
                      <h3 className="text-4xl font-bold text-slate-800">{certificates.length}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileBadge size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'students' && (
            <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8">
                <h3 className="font-bold text-lg text-slate-800 mb-6">Register New Student</h3>
                <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                    <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number *</label>
                    <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.roll_number} onChange={e => setStudentForm({...studentForm, roll_number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Enrollment Number *</label>
                    <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.enrollment_number} onChange={e => setStudentForm({...studentForm, enrollment_number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input type="email" required placeholder="student@example.com" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Course *</label>
                    <input type="text" required placeholder="e.g. B.Tech CSE" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.course} onChange={e => setStudentForm({...studentForm, course: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                    <input type="text" required placeholder="e.g. Computer Science" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.department} onChange={e => setStudentForm({...studentForm, department: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Admission Year *</label>
                    <input type="number" required placeholder="2023" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.admission_year} onChange={e => setStudentForm({...studentForm, admission_year: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Passing Year *</label>
                    <input type="number" required placeholder="2027" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={studentForm.passing_year} onChange={e => setStudentForm({...studentForm, passing_year: e.target.value})} />
                  </div>
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-4 border-t border-slate-100">
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg shadow hover:bg-indigo-600 transition-colors">
                      Register Student
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-800">Registered Students</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {students.map((student: any) => (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 text-sm font-medium text-slate-800">{student.student_id}</td>
                          <td className="py-4 px-6 text-sm text-slate-700 font-medium">{student.name}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">{student.enrollment_number}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">{student.course}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issue' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-8 md:p-10 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Issue Academic Certificate</h2>
                <p className="text-slate-500 mb-8">Generate a verifiable digital certificate and record its cryptographic hash on the blockchain ledger.</p>
                
                <form onSubmit={handleIssueCertificate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Student *</label>
                      <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-700" value={certForm.student_id} onChange={e => setCertForm({...certForm, student_id: e.target.value})}>
                        <option value="">-- Choose a registered student --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollment_number})</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Certificate Type *</label>
                      <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-700" value={certForm.certificate_type} onChange={e => setCertForm({...certForm, certificate_type: e.target.value})}>
                        <option value="Degree Certificate">Degree Certificate</option>
                        <option value="Diploma Certificate">Diploma Certificate</option>
                        <option value="Marksheet">Marksheet</option>
                        <option value="Course Completion Certificate">Course Completion Certificate</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Issue Date *</label>
                      <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-700" value={certForm.issue_date} onChange={e => setCertForm({...certForm, issue_date: e.target.value})} />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                      <input type="text" placeholder="e.g. A" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={certForm.grade} onChange={e => setCertForm({...certForm, grade: e.target.value})} />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">CGPA</label>
                      <input type="text" placeholder="e.g. 9.40" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={certForm.cgpa} onChange={e => setCertForm({...certForm, cgpa: e.target.value})} />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Passing Year *</label>
                      <input type="number" required placeholder="e.g. 2027" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all" value={certForm.passing_year} onChange={e => setCertForm({...certForm, passing_year: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100">
                    <button type="submit" disabled={issueLoading} className="w-full flex justify-center items-center gap-2 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-600 hover:-translate-y-0.5 transition-all duration-200 text-lg">
                      {issueLoading ? 'Generating Cryptographic Hash & Issuing...' : 'Issue Certificate'}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                      By issuing this certificate, a cryptographic fingerprint will be permanently recorded on the blockchain ledger.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="max-w-6xl mx-auto animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-800">Issued Certificates Registry</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificate ID</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {certificates.map((cert: any) => (
                        <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded-md text-sm">{cert.certificate_id}</span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-700 font-medium">{cert.student?.name}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">{cert.course}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                              cert.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              cert.status === 'REVOKED' ? 'bg-red-50 text-red-700 border-red-200' : 
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {cert.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleDownload(cert.certificate_id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                                <FileText size={14} /> Download
                              </button>
                              {(user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN') && cert.status === 'ACTIVE' && (
                                <button onClick={() => handleRevoke(cert.certificate_id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-all shadow-sm">
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {certificates.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">No certificates found in the registry</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blockchain' && (
             <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
               {integrity && (
                  <div className={`bg-white rounded-2xl p-6 border-l-4 shadow-sm ${integrity.isValid ? 'border-l-emerald-500 border-y-slate-200 border-r-slate-200' : 'border-l-red-500 border-y-slate-200 border-r-slate-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                       <div>
                         <h3 className="text-lg font-bold text-slate-800">Ledger Integrity Status</h3>
                         <p className="text-sm text-slate-500">Cryptographic verification of all linked blocks</p>
                       </div>
                       <button onClick={checkIntegrity} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-200 shadow-sm">
                         Re-verify Chain
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-xl p-6 border border-slate-100">
                       <div>
                         <p className="text-sm font-medium text-slate-500 mb-1">Total Blocks</p>
                         <p className="text-3xl font-bold text-slate-800">{integrity.totalBlocks}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-slate-500 mb-1">Network Consensus</p>
                         <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${integrity.isValid ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                           <p className={`text-xl font-bold ${integrity.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                             {integrity.isValid ? 'SECURE' : 'COMPROMISED'}
                           </p>
                         </div>
                       </div>
                    </div>
                    
                    {!integrity.isValid && (
                      <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">
                        <p className="font-bold flex items-center gap-2"><Activity size={18} /> Tampering Detected!</p>
                        <ul className="mt-2 text-sm space-y-1 ml-6 list-disc">
                          <li>Affected Block Index: <span className="font-mono font-medium">{integrity.affectedBlock}</span></li>
                          <li>Reason: {integrity.reason}</li>
                        </ul>
                      </div>
                    )}
                  </div>
               )}

               <div>
                 <h3 className="font-bold text-lg text-slate-800 mb-6">Blockchain Ledger Explorer</h3>
                 <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {blockchain.map((block: any, index: number) => (
                      <div key={block.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                         <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-primary text-white shadow-md shadow-primary/30 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xs font-bold">
                           {block.block_index}
                         </div>
                         <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                           <div className="flex justify-between items-start mb-3">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                                BLOCK #{block.block_index}
                              </span>
                              <span className="text-xs font-medium text-slate-400">{new Date(block.timestamp).toLocaleString()}</span>
                           </div>
                           
                           <div className="space-y-3 mt-4">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hash</span>
                                <span className="block font-mono text-xs text-primary break-all">{block.current_hash}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Previous Hash</span>
                                  <span className="block font-mono text-[11px] text-slate-500 truncate">{block.previous_hash}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Certificate ID</span>
                                  <span className="block font-medium text-sm text-slate-700">{block.certificate_id}</span>
                                </div>
                              </div>
                           </div>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
             </div>
          )}

        </main>
      </div>
    </div>
  );
}
