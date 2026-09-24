import { useState, useEffect, useCallback } from 'react'

/* ─── Constants ───────────────────────────────────────────────────── */
// Use the deployed backend URL if provided via environment variable, otherwise fallback to local
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/patients` 
  : '/patients'
const SEX_OPTIONS = ['Male', 'Female', 'Other', 'Decline to Answer']
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '', sex: 'Male',
  phone_number: '', email: '', address_line_1: '', address_line_2: '',
  city: '', state: '', zip_code: '', insurance_provider: '',
  insurance_member_id: '', preferred_language: 'English',
  emergency_contact_name: '', emergency_contact_phone: '',
}

/* ─── Icons (inline SVGs) ─────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
)

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatPhone(p) {
  if (!p || p.length !== 10) return p || '—'
  return `(${p.slice(0,3)}) ${p.slice(3,6)}-${p.slice(6)}`
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ─── Toast Component ─────────────────────────────────────────────── */
function Toasts({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  )
}

/* ─── Patient Form Modal ──────────────────────────────────────────── */
function PatientModal({ open, onClose, onSave, initial, isEdit }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({ ...EMPTY_FORM, ...initial })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [initial, open])

  if (!open) return null

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim()) e.last_name = 'Required'
    if (!form.date_of_birth) e.date_of_birth = 'Required'
    if (!form.phone_number.trim()) e.phone_number = 'Required'
    if (!form.address_line_1.trim()) e.address_line_1 = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.state) e.state = 'Required'
    if (!form.zip_code.trim()) e.zip_code = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    // Strip empty strings to avoid sending them
    const payload = {}
    for (const [k, v] of Object.entries(form)) {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v
    }
    await onSave(payload)
    setSaving(false)
  }

  const inputClass = (field) =>
    `glass-input ${errors[field] ? 'border-red-500/50' : ''}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Patient' : 'Register New Patient'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">First Name *</label>
              <input className={inputClass('first_name')} placeholder="John" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              {errors.first_name && <p className="text-red-400 text-xs mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Last Name *</label>
              <input className={inputClass('last_name')} placeholder="Doe" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              {errors.last_name && <p className="text-red-400 text-xs mt-1">{errors.last_name}</p>}
            </div>
          </div>

          {/* DOB, Sex, Phone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Date of Birth *</label>
              <input type="date" className={inputClass('date_of_birth')} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              {errors.date_of_birth && <p className="text-red-400 text-xs mt-1">{errors.date_of_birth}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Sex *</label>
              <select className={inputClass('sex')} value={form.sex} onChange={e => set('sex', e.target.value)}>
                {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Phone *</label>
              <input className={inputClass('phone_number')} placeholder="2125551234" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
              {errors.phone_number && <p className="text-red-400 text-xs mt-1">{errors.phone_number}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" className="glass-input" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Address Line 1 *</label>
              <input className={inputClass('address_line_1')} placeholder="123 Main St" value={form.address_line_1} onChange={e => set('address_line_1', e.target.value)} />
              {errors.address_line_1 && <p className="text-red-400 text-xs mt-1">{errors.address_line_1}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Address Line 2</label>
              <input className="glass-input" placeholder="Apt 4B" value={form.address_line_2} onChange={e => set('address_line_2', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">City *</label>
              <input className={inputClass('city')} placeholder="New York" value={form.city} onChange={e => set('city', e.target.value)} />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">State *</label>
              <select className={inputClass('state')} value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">ZIP Code *</label>
              <input className={inputClass('zip_code')} placeholder="10001" value={form.zip_code} onChange={e => set('zip_code', e.target.value)} />
              {errors.zip_code && <p className="text-red-400 text-xs mt-1">{errors.zip_code}</p>}
            </div>
          </div>

          {/* Insurance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Insurance Provider</label>
              <input className="glass-input" placeholder="Blue Cross" value={form.insurance_provider} onChange={e => set('insurance_provider', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Member ID</label>
              <input className="glass-input" placeholder="XYZ123456" value={form.insurance_member_id} onChange={e => set('insurance_member_id', e.target.value)} />
            </div>
          </div>

          {/* Language & Emergency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Language</label>
              <input className="glass-input" placeholder="English" value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Contact</label>
              <input className="glass-input" placeholder="Jane Doe" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Phone</label>
              <input className="glass-input" placeholder="2125559876" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {isEdit ? 'Save Changes' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Patient Detail Drawer ───────────────────────────────────────── */
function PatientDetail({ patient, onClose, onEdit, onDelete }) {
  if (!patient) return null

  const Field = ({ label, value }) => (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-200">{value || '—'}</dd>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{patient.first_name} {patient.last_name}</h2>
              <p className="text-xs text-slate-500 font-mono">{patient.patient_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <CloseIcon />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
          <Field label="Date of Birth" value={formatDate(patient.date_of_birth)} />
          <Field label="Sex" value={patient.sex} />
          <Field label="Phone" value={formatPhone(patient.phone_number)} />
          <Field label="Email" value={patient.email} />
          <Field label="Address" value={
            `${patient.address_line_1}${patient.address_line_2 ? ', ' + patient.address_line_2 : ''}`
          } />
          <Field label="City / State / ZIP" value={`${patient.city}, ${patient.state} ${patient.zip_code}`} />
          <Field label="Insurance" value={patient.insurance_provider} />
          <Field label="Member ID" value={patient.insurance_member_id} />
          <Field label="Language" value={patient.preferred_language} />
          <Field label="Emergency Contact" value={
            patient.emergency_contact_name
              ? `${patient.emergency_contact_name} ${patient.emergency_contact_phone ? formatPhone(patient.emergency_contact_phone) : ''}`
              : null
          } />
        </dl>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button onClick={() => onDelete(patient.patient_id)} className="btn-danger flex items-center gap-1.5">
            <TrashIcon /> Delete
          </button>
          <button onClick={() => onEdit(patient)} className="btn-primary flex items-center gap-1.5">
            <EditIcon /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Stat Card ───────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  )
}

/* ─── Main App ────────────────────────────────────────────────────── */
export default function App() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPatient, setEditPatient] = useState(null)
  const [detailPatient, setDetailPatient] = useState(null)
  const [toasts, setToasts] = useState([])

  const toast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_BASE)
      const json = await res.json()
      setPatients(json.data || [])
    } catch (err) {
      toast('Failed to load patients', 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const handleSave = async (payload) => {
    try {
      const isEdit = !!editPatient
      const url = isEdit ? `${API_BASE}/${editPatient.patient_id}` : API_BASE
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.error) {
        toast(json.error, 'error')
        return
      }
      toast(isEdit ? 'Patient updated successfully' : 'Patient registered successfully')
      setModalOpen(false)
      setEditPatient(null)
      fetchPatients()
    } catch (err) {
      toast('Operation failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Soft-delete this patient record?')) return
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) {
        toast(json.error, 'error')
        return
      }
      toast('Patient record deleted')
      setDetailPatient(null)
      fetchPatients()
    } catch (err) {
      toast('Delete failed', 'error')
    }
  }

  const openEdit = (p) => {
    setDetailPatient(null)
    setEditPatient(p)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditPatient(null)
    setModalOpen(true)
  }

  /* Filter by search */
  const filtered = patients.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.phone_number?.includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.patient_id?.toLowerCase().includes(q)
    )
  })

  /* Stats */
  const totalPatients = patients.length
  const todayCount = patients.filter(p => {
    if (!p.created_at) return false
    return new Date(p.created_at).toDateString() === new Date().toDateString()
  }).length

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.06] blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[80px]" />
      </div>

      <Toasts toasts={toasts} />

      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-sm bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">VoiceReg</h1>
              <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest">Patient Registration System</p>
            </div>
          </div>
          <button onClick={openCreate} className="btn-primary" id="btn-add-patient">
            <PlusIcon /> New Patient
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatCard
            label="Total Patients"
            value={totalPatients}
            color="bg-indigo-500/15 text-indigo-400"
            icon={<UserIcon />}
          />
          <StatCard
            label="Registered Today"
            value={todayCount}
            color="bg-emerald-500/15 text-emerald-400"
            icon={<PlusIcon />}
          />
          <StatCard
            label="API Status"
            value="Online"
            color="bg-cyan-500/15 text-cyan-400"
            icon={<RefreshIcon />}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon />
            </span>
            <input
              className="glass-input pl-9"
              placeholder="Search patients by name, phone, email, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-input"
            />
          </div>
          <button onClick={fetchPatients} className="btn-ghost flex items-center gap-1.5" id="btn-refresh">
            <RefreshIcon /> Refresh
          </button>
        </div>

        {/* Patient Table */}
        <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                <UserIcon />
              </div>
              <p className="text-slate-400 font-medium">
                {search ? 'No patients match your search' : 'No patients registered yet'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {search ? 'Try a different search term' : 'Click "New Patient" to register one'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">DOB</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sex</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr
                      key={p.patient_id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setDetailPatient(p)}
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                            {p.first_name?.[0]}{p.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-white">{p.first_name} {p.last_name}</p>
                            <p className="text-[0.7rem] text-slate-600 font-mono">{p.patient_id?.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{formatDate(p.date_of_birth)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                          {p.sex}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <PhoneIcon />
                          {formatPhone(p.phone_number)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{p.city}, {p.state}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(p) }}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(p.patient_id) }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-600">
            VoiceReg Patient Registration System · Powered by FastAPI + Vapi · <a href="/docs" className="text-indigo-500 hover:text-indigo-400 transition-colors">API Docs</a>
          </p>
        </footer>
      </main>

      {/* Modals */}
      <PatientModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPatient(null) }}
        onSave={handleSave}
        initial={editPatient}
        isEdit={!!editPatient}
      />
      <PatientDetail
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
