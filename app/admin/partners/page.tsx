'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiEdit2, FiX, FiCheck, FiEye, FiEyeOff,
  FiStar, FiHome, FiSearch, FiFilter, FiExternalLink, FiLink,
  FiArrowUp, FiArrowDown, FiAlertTriangle, FiGlobe,
  FiPackage, FiRefreshCw, FiImage
} from 'react-icons/fi';

interface Partner {
  _id: string;
  name: string;
  logo: string;
  driveFileId?: string;
  sourceType: 'url' | 'drive' | 'upload';
  description?: string;
  websiteUrl?: string;
  partnershipType?: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

interface Stats {
  total: number;
  published: number;
  featured: number;
  homepage: number;
}

type SourceType = 'url' | 'drive' | 'upload';

interface FormData {
  name: string;
  logo: string;
  driveFileId: string;
  sourceType: SourceType;
  description: string;
  websiteUrl: string;
  partnershipType: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  isPublished: boolean;
  displayOrder: number;
}

const EMPTY_FORM: FormData = {
  name: '',
  logo: '',
  driveFileId: '',
  sourceType: 'url',
  description: '',
  websiteUrl: '',
  partnershipType: '',
  isFeatured: false,
  showOnHomepage: true,
  isPublished: false,
  displayOrder: 0,
};

function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)\//,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m?.[1]) return m[1];
  }
  return null;
}

function driveToImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

function PartnerLogoCell({ logo, name }: { logo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600">
        <FiImage className="w-5 h-5" />
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={name}
      className="w-full h-full object-contain"
      onError={() => setErr(true)}
    />
  );
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, featured: 0, homepage: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [driveInput, setDriveInput] = useState('');
  const [driveError, setDriveError] = useState('');
  const [logoPreviewErr, setLogoPreviewErr] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchPartners(); }, [filter]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchPartners(), 350);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ search, status: filter, limit: '100' });
      const res = await fetch(`/api/admin/partners?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPartners(data.partners || []);
        setStats(data.stats || { total: 0, published: 0, featured: 0, homepage: 0 });
      }
    } catch {
      showToast('Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingPartner(null);
    setForm({ ...EMPTY_FORM });
    setDriveInput('');
    setDriveError('');
    setLogoPreviewErr(false);
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditingPartner(p);
    setForm({
      name: p.name,
      logo: p.logo,
      driveFileId: p.driveFileId || '',
      sourceType: p.sourceType,
      description: p.description || '',
      websiteUrl: p.websiteUrl || '',
      partnershipType: p.partnershipType || '',
      isFeatured: p.isFeatured,
      showOnHomepage: p.showOnHomepage,
      isPublished: p.isPublished,
      displayOrder: p.displayOrder,
    });
    setDriveInput(p.driveFileId ? `https://drive.google.com/file/d/${p.driveFileId}/view` : '');
    setDriveError('');
    setLogoPreviewErr(false);
    setShowModal(true);
  };

  const handleDriveLink = () => {
    setDriveError('');
    if (!driveInput.trim()) return;
    if (!driveInput.includes('drive.google.com')) {
      setDriveError('Please paste a valid Google Drive link');
      return;
    }
    const fileId = extractDriveFileId(driveInput);
    if (!fileId) {
      setDriveError('Could not extract File ID. Make sure sharing is set to "Anyone with the link".');
      return;
    }
    const imageUrl = driveToImageUrl(fileId);
    setForm(f => ({ ...f, logo: imageUrl, driveFileId: fileId, sourceType: 'drive' as SourceType }));
    setLogoPreviewErr(false);
  };

  const setFormField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.logo.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingPartner ? `/api/admin/partners/${editingPartner._id}` : '/api/admin/partners';
      const method = editingPartner ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast(editingPartner ? 'Partner updated successfully!' : 'Partner added successfully!');
        setShowModal(false);
        fetchPartners();
      } else {
        const err = await res.json();
        showToast(err.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchPartner = async (id: string, patch: Record<string, unknown>, msg: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        showToast(msg);
        setPartners(prev => prev.map(p => p._id === id ? { ...p, ...patch } as Partner : p));
      }
    } catch { showToast('Update failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/partners?id=${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Partner deleted');
        setDeleteTarget(null);
        fetchPartners();
      }
    } catch { showToast('Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const changeOrder = async (p: Partner, dir: 'up' | 'down') => {
    const newOrder = dir === 'up' ? p.displayOrder - 1 : p.displayOrder + 1;
    await patchPartner(p._id, { displayOrder: newOrder }, 'Order updated');
  };

  const statCards = [
    { label: 'Total Partners', value: stats.total, icon: FiPackage, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Published', value: stats.published, icon: FiEye, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Featured', value: stats.featured, icon: FiStar, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'On Homepage', value: stats.homepage, icon: FiHome, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const filterOptions = ['all', 'published', 'unpublished', 'featured', 'homepage'] as const;

  return (
    <div className="space-y-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}
          >
            {toast.type === 'success' ? <FiCheck /> : <FiAlertTriangle />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Manage Partners</h1>
          <p className="text-slate-400 text-sm">Add, edit, and control partner visibility across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPartners} title="Refresh"
            className="p-2.5 rounded-xl bg-slate-800 border border-blue-500/20 text-slate-400 hover:text-white transition-all">
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="btn-primary-blue px-5 py-2.5 text-sm flex items-center gap-2 font-black">
            <FiPlus className="w-4 h-4" /> Add Partner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`glass-card p-5 rounded-2xl border ${s.bg} flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-bold">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text" placeholder="Search partners..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-blue-500/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FiFilter className="text-slate-500 w-4 h-4" />
          {filterOptions.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-blue-500/20'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : partners.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center space-y-3">
          <FiPackage className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold">No partners found</p>
          <p className="text-slate-600 text-sm">Click &quot;Add Partner&quot; to get started.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-500/20 bg-slate-900/50">
                  {['Logo', 'Partner', 'Type', 'Featured', 'Homepage', 'Status', 'Order', 'Added', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {partners.map((p, idx) => (
                    <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-blue-500/10 hover:bg-blue-500/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-blue-500/20 flex items-center justify-center p-1.5 overflow-hidden">
                          <PartnerLogoCell logo={p.logo} name={p.name} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black text-white text-sm">{p.name}</p>
                        {p.description && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[160px]">{p.description}</p>}
                        {p.websiteUrl && (
                          <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs flex items-center gap-1 mt-0.5 hover:text-blue-300">
                            <FiExternalLink className="w-3 h-3" /> Website
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.partnershipType ? (
                          <span className="px-2.5 py-1 bg-blue-900/50 text-blue-300 text-xs font-bold rounded-lg border border-blue-500/20">{p.partnershipType}</span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => patchPartner(p._id, { isFeatured: !p.isFeatured }, p.isFeatured ? 'Removed from featured' : 'Marked as featured')}
                          className={`p-2 rounded-xl transition-all ${p.isFeatured ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-600 border border-slate-700 hover:text-yellow-400'}`}
                          title={p.isFeatured ? 'Remove featured' : 'Mark as featured'}>
                          <FiStar className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => patchPartner(p._id, { showOnHomepage: !p.showOnHomepage }, p.showOnHomepage ? 'Hidden from homepage' : 'Shown on homepage')}
                          className={`p-2 rounded-xl transition-all ${p.showOnHomepage ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-600 border border-slate-700 hover:text-purple-400'}`}
                          title={p.showOnHomepage ? 'Hide from homepage' : 'Show on homepage'}>
                          <FiHome className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => patchPartner(p._id, { isPublished: !p.isPublished }, p.isPublished ? 'Partner unpublished' : 'Partner published')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${p.isPublished ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-green-400'}`}>
                          {p.isPublished ? <><FiEye className="w-3 h-3" /> Published</> : <><FiEyeOff className="w-3 h-3" /> Draft</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => changeOrder(p, 'up')} title="Move up" className="p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all">
                            <FiArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-slate-400 text-xs font-black w-6 text-center">{p.displayOrder}</span>
                          <button onClick={() => changeOrder(p, 'down')} title="Move down" className="p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all">
                            <FiArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-500 text-xs whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} title="Edit" className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)} title="Delete" className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="bg-[#0B1220] w-full max-w-2xl rounded-3xl border border-blue-500/30 my-8 overflow-hidden shadow-2xl shadow-blue-900/20"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-blue-500/20 bg-slate-900/50">
                <div>
                  <h2 className="text-xl font-black text-white">{editingPartner ? 'Edit Partner' : 'Add New Partner'}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{editingPartner ? `Editing: ${editingPartner.name}` : 'Fill in the partner details below'}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Logo Source Toggle */}
                <div>
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">Logo Source</label>
                  <div className="flex gap-2 mb-3">
                    {(['url', 'drive'] as SourceType[]).map(st => (
                      <button key={st} type="button"
                        onClick={() => setFormField('sourceType', st)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${form.sourceType === st ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-blue-500/20 hover:text-white'}`}>
                        {st === 'url' ? '🔗 Direct URL' : '📁 Google Drive'}
                      </button>
                    ))}
                  </div>

                  {form.sourceType === 'drive' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text" placeholder="Paste Google Drive link..." value={driveInput}
                          onChange={e => setDriveInput(e.target.value)}
                          className="flex-1 bg-[#07111F]/70 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button type="button" onClick={handleDriveLink} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2">
                          <FiLink className="w-4 h-4" /> Apply
                        </button>
                      </div>
                      {driveError && <p className="text-red-400 text-xs flex items-center gap-1"><FiAlertTriangle className="w-3 h-3" /> {driveError}</p>}
                      <p className="text-slate-500 text-xs">⚠️ Make sure sharing is &quot;Anyone with the link can view&quot;</p>
                    </div>
                  ) : (
                    <input
                      type="text" placeholder="https://example.com/logo.png" value={form.logo}
                      onChange={e => { setForm(f => ({ ...f, logo: e.target.value, sourceType: 'url', driveFileId: '' })); setLogoPreviewErr(false); }}
                      className="w-full bg-[#07111F]/70 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  )}

                  {/* Preview */}
                  {form.logo && (
                    <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-blue-500/20">
                      <p className="text-xs text-slate-500 mb-2 font-bold">Preview:</p>
                      <div className="w-24 h-24 bg-white/5 rounded-xl border border-blue-500/20 flex items-center justify-center p-2 mx-auto">
                        {!logoPreviewErr ? (
                          <img src={form.logo} alt="preview" className="w-full h-full object-contain" onError={() => setLogoPreviewErr(true)} />
                        ) : (
                          <div className="text-center text-red-400 text-xs">
                            <FiAlertTriangle className="w-5 h-5 mx-auto mb-1" />
                            <span>Cannot load</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1.5">Partner Name *</label>
                  <input
                    type="text" required placeholder="e.g. Google, Cairo University..." value={form.name}
                    onChange={e => setFormField('name', e.target.value)}
                    className="w-full bg-[#07111F]/70 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1.5">Short Description</label>
                  <textarea rows={2} placeholder="Brief description of the partnership..." value={form.description}
                    onChange={e => setFormField('description', e.target.value)}
                    className="w-full bg-[#07111F]/70 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Website & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1.5">Website URL</label>
                    <div className="relative">
                      <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input type="text" placeholder="https://..." value={form.websiteUrl}
                        onChange={e => setFormField('websiteUrl', e.target.value)}
                        className="w-full bg-[#07111F]/70 border border-blue-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1.5">Partnership Type</label>
                    <input type="text" placeholder="e.g. Sponsor, Academic..." value={form.partnershipType}
                      onChange={e => setFormField('partnershipType', e.target.value)}
                      className="w-full bg-[#07111F]/70 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1.5">Display Order (lower = first)</label>
                  <input type="number" value={form.displayOrder} min={0}
                    onChange={e => setFormField('displayOrder', parseInt(e.target.value) || 0)}
                    className="w-full bg-[#07111F]/70 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'isPublished' as keyof FormData, label: 'Published', icon: '🟢' },
                    { key: 'showOnHomepage' as keyof FormData, label: 'Homepage', icon: '🏠' },
                    { key: 'isFeatured' as keyof FormData, label: 'Featured', icon: '⭐' },
                  ].map(({ key, label, icon }) => {
                    const val = form[key] as boolean;
                    return (
                      <button key={key} type="button"
                        onClick={() => setFormField(key, !val as FormData[typeof key])}
                        className={`py-3 rounded-xl text-xs font-black flex flex-col items-center gap-1 transition-all border ${val ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                        <span className="text-lg">{icon}</span>
                        {label}
                        <span className="text-[10px]">{val ? 'ON' : 'OFF'}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-black text-sm border border-slate-700 hover:border-slate-600 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !form.name.trim() || !form.logo.trim()}
                    className="flex-1 btn-primary-blue py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck />}
                    {saving ? 'Saving...' : editingPartner ? 'Update Partner' : 'Add Partner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B1220] rounded-3xl border border-red-500/30 p-8 max-w-sm w-full text-center space-y-5 shadow-2xl shadow-red-900/20">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <FiAlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-1">Delete Partner?</h3>
                <p className="text-slate-400 text-sm">This will permanently delete <strong className="text-white">&quot;{deleteTarget.name}&quot;</strong>. This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-black text-sm border border-slate-700 hover:border-slate-600 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiTrash2 />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
