import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, Building, AlertCircle, CheckCircle2, Eye, EyeOff, AtSign, MapPin, Clock } from 'lucide-react';

// ─── Kerala Districts & Validation Rules ────────────────────────────────────

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod"
];

const VALIDATORS = {
  full_name: (v) => {
    if (!v.trim()) return 'Full name is required.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    if (v.trim().length > 100) return 'Name must be under 100 characters.';
    if (!/^[a-zA-Z\s'.'-]+$/.test(v.trim())) return "Name can only contain letters, spaces, and apostrophes.";
    return '';
  },
  username: (v) => {
    if (!v.trim()) return 'Username is required.';
    if (v.trim().length < 3) return 'Username must be at least 3 characters.';
    if (v.trim().length > 50) return 'Username must be under 50 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(v.trim())) return 'Only letters, numbers and underscores allowed.';
    return '';
  },
  email: (v) => {
    if (!v || !v.trim()) return 'Email is required.';
    if (/[A-Z]/.test(v)) return 'Email address cannot contain uppercase letters (must be strictly lowercase).';
    if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(v.trim())) {
      return 'Enter a valid lowercase email address (e.g. name@gmail.com).';
    }
    return '';
  },
  phone: (v) => {
    if (!v.trim()) return 'Phone number is required.';
    const digits = v.replace(/\D/g, '');
    if (digits.length !== 10) return 'Phone number must be exactly 10 digits.';
    if (!/^[6-9]/.test(digits)) return 'Phone must start with 6, 7, 8, or 9 (Indian mobile).';
    return '';
  },
  password: (v) => {
    if (!v) return 'Password is required.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter.';
    if (!/[a-z]/.test(v)) return 'Must contain at least one lowercase letter.';
    if (!/[0-9]/.test(v)) return 'Must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(v)) return 'Must contain at least one special character.';
    return '';
  },
  confirmPassword: (v, formData) => {
    if (!v) return 'Please confirm your password.';
    if (v !== formData?.password) return 'Passwords do not match.';
    return '';
  },
  business_name: (v) => {
    if (!v.trim()) return 'Business / Turf name is required.';
    if (v.trim().length < 3) return 'Business name must be at least 3 characters.';
    if (v.trim().length > 150) return 'Business name must be under 150 characters.';
    return '';
  },
  city: (v) => {
    if (!v || !v.trim()) return 'Please select a Kerala district.';
    return '';
  },
};

const FIELDS_BY_MODE = {
  register: ['full_name', 'username', 'email', 'phone', 'password', 'confirmPassword'],
  owner_register: ['full_name', 'username', 'email', 'phone', 'password', 'confirmPassword', 'business_name', 'city'],
  login: ['email'],
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) score++;
  if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
};

const AuthModal = ({ isOpen, initialMode = 'login', onClose }) => {
  const { login, register, registerOwner } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', full_name: '', username: '',
    phone: '', business_name: '', city: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingOwnerApp, setPendingOwnerApp] = useState(() => {
    try {
      const saved = localStorage.getItem('playsport_pending_owner_app');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const resetForm = () => {
    setFormData({
      email: '', password: '', confirmPassword: '', full_name: '', username: '',
      phone: '', business_name: '', city: '',
    });
    setFieldErrors({});
    setTouched({});
    setError('');
    setSuccessMsg('');
  };

  // Synchronize mode whenever modal opens or initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('playsport_pending_owner_app');
        setPendingOwnerApp(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setPendingOwnerApp(null);
      }
      setMode(initialMode);
      resetForm();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateField = (name, value, currentData = formData) => {
    const validator = VALIDATORS[name];
    return validator ? validator(value, currentData) : '';
  };

  const validateAll = () => {
    const fields = FIELDS_BY_MODE[mode] || [];
    const errors = {};
    fields.forEach((f) => {
      const err = validateField(f, formData[f], formData);
      if (err) errors[f] = err;
    });
    setFieldErrors(errors);
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'full_name') {
      nextValue = value.toUpperCase();
    } else if (name === 'phone') {
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    }
    const updatedForm = { ...formData, [name]: nextValue };
    setFormData(updatedForm);
    setError('');
    if (touched[name] || name === 'email') {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, nextValue, updatedForm) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value, formData) }));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleFillDemo = (type) => {
    if (type === 'admin') {
      setIsAdminLogin(true);
      setFormData((prev) => ({ ...prev, email: 'admin@playsport.com', password: 'Admin@123' }));
    } else if (type === 'owner') {
      setIsAdminLogin(false);
      setFormData((prev) => ({ ...prev, email: 'owner.kochi@playsport.com', password: 'Owner@123' }));
    } else {
      setIsAdminLogin(false);
      setFormData((prev) => ({ ...prev, email: 'arjun.nair@example.com', password: 'Customer@123' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      setError('Please fix the highlighted validation errors before submitting.');
      return;
    }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const cleanUsername = (formData.username || formData.email.split('@')[0])
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, '_');

      if (mode === 'login') {
        const loggedUser = await login(formData.email.trim(), formData.password, isAdminLogin);
        onClose();
        if (loggedUser?.role === 'ADMIN' || isAdminLogin) {
          navigate('/admin/dashboard');
        } else if (loggedUser?.role === 'OWNER') {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      } else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await register({
          email: formData.email.trim(),
          username: cleanUsername,
          full_name: formData.full_name.trim().toUpperCase(),
          phone: formData.phone.trim(),
          password: formData.password,
        });
        onClose();
        navigate('/');
      } else if (mode === 'owner_register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const resData = await registerOwner({
          email: formData.email.trim(),
          username: cleanUsername,
          full_name: formData.full_name.trim().toUpperCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          business_name: formData.business_name.trim(),
          city: formData.city.trim(),
        });
        
        const pendingData = {
          email: formData.email.trim(),
          business_name: formData.business_name.trim(),
          full_name: formData.full_name.trim().toUpperCase(),
          city: formData.city.trim(),
          submittedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem('playsport_pending_owner_app', JSON.stringify(pendingData));
        } catch (e) {}
        setPendingOwnerApp(pendingData);
        
        alert(`Waiting for Approval: Registration submitted successfully for "${formData.business_name.trim()}"! Your account is pending admin approval.`);
        resetForm();
        onClose(); // Close the registration modal/page immediately
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(d => d.msg.replace('Value error, ', '')).join(', '));
        } else if (typeof detail === 'string' && detail.toLowerCase().includes('pending admin approval')) {
          setError("Waiting for Approval: Your Turf Owner registration application is pending admin approval. You can log in once approved.");
        } else {
          setError(detail);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Inline field feedback
  const FieldFeedback = ({ name }) => {
    if (!touched[name]) return null;
    if (fieldErrors[name]) return (
      <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors[name]}
      </p>
    );
    if (VALIDATORS[name]) return (
      <p className="mt-1 text-[10px] text-emerald-600 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 shrink-0" />Looks good!
      </p>
    );
    return null;
  };

  const inputCls = (name, extraPr = 'pr-3') =>
    `w-full pl-9 ${extraPr} py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-slate-50/50 transition ${
      touched[name] && fieldErrors[name]   ? 'border-rose-400 focus:ring-rose-300'
    : touched[name] && !fieldErrors[name] && VALIDATORS[name] ? 'border-emerald-400 focus:ring-emerald-300'
    : 'border-slate-200 focus:ring-brand-500'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative fade-in max-h-[92vh] overflow-y-auto">

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition z-20">
          <X className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 sticky top-0 z-10 pr-10">
          {[['login','Sign In'],['register','Player Register'],['owner_register','Turf Owner']].map(([m, label]) => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-3 text-xs font-bold transition rounded-lg ${mode === m ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'login' && (isAdminLogin ? 'Super Admin Portal' : 'Welcome to PLAYSPORT')}
              {mode === 'register' && 'Create Player Account'}
              {mode === 'owner_register' && 'Register Turf Facility'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' && 'Enter your credentials to manage your sports schedule.'}
              {mode === 'register' && 'Join open matches, book slots, and rent equipment.'}
              {mode === 'owner_register' && 'Submit application for admin approval to list your turf.'}
            </p>
          </div>

          {/* Demo autofill */}
          {mode === 'login' && (
            <div className="mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Demo Autofill:</span>
              <div className="flex gap-1.5">
                {[['customer','Customer','bg-white hover:bg-slate-100 border-slate-200 text-slate-700'],
                  ['owner','Owner','bg-white hover:bg-slate-100 border-slate-200 text-brand-700'],
                  ['admin','Admin','bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700']].map(([t,lbl,cls]) => (
                  <button key={t} type="button" onClick={() => handleFillDemo(t)}
                    className={`px-2 py-0.5 rounded border font-semibold ${cls}`}>{lbl}</button>
                ))}
              </div>
            </div>
          )}

          {/* Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-brand-200 flex items-start gap-2.5 text-xs text-brand-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" /><span>{successMsg}</span>
            </div>
          )}

          {mode === 'owner_register' && pendingOwnerApp ? (
            <div className="py-2 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                <Clock className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                  Status: Waiting for Admin Approval
                </span>
                <h4 className="text-base font-extrabold text-slate-900 pt-1">
                  Registration Application Submitted
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your application for <strong className="text-slate-800">{pendingOwnerApp.business_name || pendingOwnerApp.email}</strong> has been submitted and is currently waiting for Admin approval.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 text-left space-y-1.5 font-medium">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-400">Applicant:</span>
                  <strong className="text-slate-800">{pendingOwnerApp.full_name || 'N/A'}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-400">Turf / Business:</span>
                  <strong className="text-slate-800">{pendingOwnerApp.business_name || 'N/A'}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-400">District / City:</span>
                  <strong className="text-slate-800">{pendingOwnerApp.city || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Email:</span>
                  <strong className="text-slate-800">{pendingOwnerApp.email}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  The registration form is closed while your application is under review. Once Super Admin approves your business details, you can log in.
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  Close Registration Page
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Sign In as Another User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.removeItem('playsport_pending_owner_app'); } catch (e) {}
                    setPendingOwnerApp(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline pt-1 block mx-auto"
                >
                  Clear & Apply with New Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate autoComplete="off">

            {/* Full Name */}
            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input type="text" name="full_name" value={formData.full_name}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="e.g. Arjun Nair" className={inputCls('full_name')}
                    autoComplete="off" />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <FieldFeedback name="full_name" />
              </div>
            )}

            {/* Username */}
            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input type="text" name="username" value={formData.username}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="e.g. arjun_nair99" className={inputCls('username')}
                    autoComplete="off" />
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <FieldFeedback name="username" />
                {!touched.username && <p className="mt-1 text-[10px] text-slate-400">Letters, numbers, underscores · 3–50 chars</p>}
              </div>
            )}

            {/* Owner-only fields */}
            {mode === 'owner_register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Turf / Business Name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input type="text" name="business_name" value={formData.business_name}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="e.g. Metro Sports Arena" className={inputCls('business_name')}
                      autoComplete="off" />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <FieldFeedback name="business_name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select District / City <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white transition font-medium text-slate-800 cursor-pointer ${
                        touched.city && fieldErrors.city ? 'border-rose-400 focus:ring-rose-300'
                        : touched.city && !fieldErrors.city && formData.city ? 'border-emerald-400 focus:ring-emerald-300'
                        : 'border-slate-200 focus:ring-brand-500'}`}
                    >
                      <option value="">-- Select District in Kerala --</option>
                      {KERALA_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <FieldFeedback name="city" />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="name@gmail.com" className={inputCls('email')}
                  autoComplete={mode === 'login' ? 'email' : 'off'} />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <FieldFeedback name="email" />
            </div>

            {/* Phone */}
            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="10-digit mobile number"
                    maxLength={10} inputMode="numeric"
                    autoComplete="off"
                    className={inputCls('phone', 'pr-14')} />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <span className={`absolute right-3 top-2.5 text-[10px] font-mono font-semibold ${formData.phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.phone.length}/10
                  </span>
                </div>
                <FieldFeedback name="phone" />
                {!touched.phone && <p className="mt-1 text-[10px] text-slate-400">Indian mobile · starts with 6–9 · exactly 10 digits</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-9 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-slate-50/50 transition ${
                    mode !== 'login' && touched.password && fieldErrors.password ? 'border-rose-400 focus:ring-rose-300'
                    : mode !== 'login' && touched.password && !fieldErrors.password ? 'border-emerald-400 focus:ring-emerald-300'
                    : 'border-slate-200 focus:ring-brand-500'}`}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {mode !== 'login' && formData.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-[10px] font-medium ${
                    passwordStrength.score <= 2 ? 'text-rose-500'
                    : passwordStrength.score === 3 ? 'text-amber-500'
                    : passwordStrength.score === 4 ? 'text-blue-500'
                    : 'text-emerald-600'}`}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
              {mode !== 'login' && <FieldFeedback name="password" />}
              {mode !== 'login' && !touched.password && (
                <p className="mt-1 text-[10px] text-slate-400">Min 8 chars · uppercase · lowercase · number · special char</p>
              )}
            </div>

            {/* Confirm Password */}
            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-slate-50/50 transition ${
                      touched.confirmPassword && fieldErrors.confirmPassword ? 'border-rose-400 focus:ring-rose-300'
                      : touched.confirmPassword && !fieldErrors.confirmPassword ? 'border-emerald-400 focus:ring-emerald-300'
                      : 'border-slate-200 focus:ring-brand-500'}`}
                    autoComplete="new-password"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldFeedback name="confirmPassword" />
              </div>
            )}

            {/* Admin checkbox */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" checked={isAdminLogin}
                    onChange={(e) => setIsAdminLogin(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500" />
                  Sign in as Super Admin
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please use demo passwords: 'Admin@123', 'Owner@123', or 'Customer@123'."); }}
                  className="text-brand-600 hover:text-brand-700 font-medium">Forgot Password?</a>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-700/20 transition disabled:opacity-50">
              {loading ? 'Processing...' : (
                mode === 'login' ? 'Sign In to Account'
                : mode === 'register' ? 'Create Account & Start Playing'
                : 'Submit Application for Admin Approval'
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="text-brand-600 font-bold hover:underline">
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="text-brand-600 font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
