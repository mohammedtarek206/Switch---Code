'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiFolder, FiCheckSquare, FiCalendar, FiMove } from 'react-icons/fi';

interface Committee {
    _id: string;
    name: string;
    type: string;
}

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'file' | 'cv' | 'linkedin' | 'github' | 'portfolio';
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
}

interface Recruitment {
    _id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'open' | 'closed' | 'draft';
    committees: string[];
    formFields: FormField[];
}

export default function RecruitmentsPage() {
    const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<'open' | 'closed' | 'draft'>('draft');
    const [reqCommittees, setReqCommittees] = useState<string[]>([]);
    const [formFields, setFormFields] = useState<FormField[]>([]);

    // Field constructor helper states
    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldType, setFieldType] = useState<FormField['type']>('text');
    const [fieldPlaceholder, setFieldPlaceholder] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [fieldOptions, setFieldOptions] = useState('');

    async function fetchData() {
        try {
            const token = localStorage.getItem('token');
            const [recRes, comRes] = await Promise.all([
                fetch('/api/community/recruitments', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees')
            ]);

            if (recRes.ok) setRecruitments(await recRes.json());
            if (comRes.ok) setCommittees(await comRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    function handleAddCustomField() {
        if (!fieldLabel.trim()) return;
        const newField: FormField = {
            id: `field_${Date.now()}`,
            label: fieldLabel,
            type: fieldType,
            placeholder: fieldPlaceholder || undefined,
            required: fieldRequired,
            options: ['dropdown', 'checkbox', 'radio'].includes(fieldType) && fieldOptions
                ? fieldOptions.split(',').map(o => o.trim())
                : undefined,
            order: formFields.length + 1
        };

        setFormFields([...formFields, newField]);
        setFieldLabel('');
        setFieldPlaceholder('');
        setFieldRequired(false);
        setFieldOptions('');
    }

    function handleRemoveField(fieldId: string) {
        setFormFields(formFields.filter(f => f.id !== fieldId));
    }

    function handleToggleCommittee(commId: string) {
        if (reqCommittees.includes(commId)) {
            setReqCommittees(reqCommittees.filter(c => c !== commId));
        } else {
            setReqCommittees([...reqCommittees, commId]);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingId ? `/api/community/recruitments/${editingId}` : '/api/community/recruitments';
        const method = editingId ? 'PUT' : 'POST';

        const payload = {
            name,
            description,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            status,
            committees: reqCommittees,
            formFields
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchData();
            } else {
                const error = await res.json();
                alert(error.error || 'Submit failed');
            }
        } catch {
            alert('Error saving recruitment');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this recruitment cycle?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/recruitments/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    function handleEdit(r: Recruitment) {
        setEditingId(r._id);
        setName(r.name);
        setDescription(r.description || '');
        setStartDate(new Date(r.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(r.endDate).toISOString().split('T')[0]);
        setStatus(r.status);
        setReqCommittees(r.committees || []);
        setFormFields(r.formFields || []);
        setShowModal(true);
    }

    function resetForm() {
        setEditingId(null);
        setName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setStatus('draft');
        setReqCommittees([]);
        setFormFields([]);
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Recruitments Setup</h1>
                    <p className="text-gray-400">Launch dynamic application cycles with custom structures & checklists.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center btn-primary-blue px-5 py-3 rounded-xl font-bold transition-all"
                >
                    <FiPlus className="mr-2" /> Start Recruitment
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recruitments.map((r, idx) => (
                        <motion.div
                            key={r._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-6 rounded-2xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${r.status === 'open' ? 'bg-green-500/10 text-green-400' :
                                            r.status === 'closed' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleEdit(r)} className="p-2 hover:bg-slate-900 border border-blue-500/20 rounded-lg text-gray-400 hover:text-white">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(r._id)} className="p-2 hover:bg-slate-900 border border-blue-500/20 rounded-lg text-red-400 hover:text-red-500">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{r.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{r.description || 'No description provided'}</p>

                                <div className="space-y-2 border-t border-blue-500/20 pt-4 text-xs text-gray-400">
                                    <div className="flex items-center">
                                        <FiCalendar className="mr-2 text-gold" />
                                        <span>Start: {new Date(r.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiCalendar className="mr-2 text-gold" />
                                        <span>End: {new Date(r.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiFolder className="mr-2 text-gold" />
                                        <span>Committees: {r.committees?.length || 0} required</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiCheckSquare className="mr-2 text-gold" />
                                        <span>Form Fields: {r.formFields?.length || 0} customized</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Recruitment Modal Creator */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel w-full max-w-3xl rounded-3xl p-8 space-y-6 my-8"
                    >
                        <h2 className="text-2xl font-bold text-white">
                            {editingId ? 'Edit Recruitment' : 'Launch Recruitment Cycle'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-300 font-semibold">Title/Session Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Summer Recruitment 2027"
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-300 font-semibold">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as 'open' | 'closed' | 'draft')}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="open">Open (Publicly visible)</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-gray-300 font-semibold">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Cycle announcements or eligibility guidelines..."
                                    rows={2}
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold resize-none"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-300 font-semibold">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-300 font-semibold">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                    />
                                </div>
                            </div>

                            {/* Committees checklist */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-300 font-semibold block">Committees Open for Applications</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900 border border-blue-500/20 p-4 rounded-xl max-h-32 overflow-y-auto">
                                    {committees.map((c) => (
                                        <label key={c._id} className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={reqCommittees.includes(c._id)}
                                                onChange={() => handleToggleCommittee(c._id)}
                                                className="rounded border-blue-500/30 accent-accent cursor-pointer"
                                            />
                                            <span>{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Field Builder */}
                            <div className="space-y-4 border-t border-blue-500/20 pt-4">
                                <h3 className="font-bold text-white text-md">Dynamic Recruitment Form Fields</h3>

                                {/* Visual Added Fields list */}
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar-thin">
                                    {formFields.length === 0 ? (
                                        <p className="text-gray-500 text-xs italic">No custom fields added yet. Add questions below.</p>
                                    ) : (
                                        formFields.map((f, idx) => (
                                            <div key={f.id} className="bg-slate-900 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2 text-gray-300">
                                                    <FiMove className="text-gray-500 cursor-pointer" />
                                                    <span className="font-bold text-white">{idx + 1}. {f.label}</span>
                                                    <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">{f.type}</span>
                                                    {f.required && <span className="text-red-400">*Required</span>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveField(f.id)}
                                                    className="text-red-400 hover:text-red-500 p-1"
                                                >
                                                    <FiTrash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Subform to append a single field */}
                                <div className="bg-slate-900 border border-blue-500/20 p-4 rounded-xl space-y-3">
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Field Label / Question (e.g. Why Join?)"
                                            value={fieldLabel}
                                            onChange={(e) => setFieldLabel(e.target.value)}
                                            className="p-3 bg-slate-900 text-xs border border-blue-500/20 rounded-lg text-white outline-none focus:border-gold"
                                        />
                                        <select
                                            value={fieldType}
                                            onChange={(e) => setFieldType(e.target.value as FormField['type'])}
                                            className="p-3 bg-slate-900 text-xs border border-blue-500/20 rounded-lg text-white outline-none"
                                        >
                                            <option value="text">Single Text</option>
                                            <option value="textarea">Paragraph Area</option>
                                            <option value="email">Email</option>
                                            <option value="phone">Phone Number</option>
                                            <option value="dropdown">Dropdown Selection</option>
                                            <option value="checkbox">Checkbox Select</option>
                                            <option value="radio">Radio Options</option>
                                            <option value="date">Date picker</option>
                                            <option value="cv">CV File Upload</option>
                                            <option value="linkedin">LinkedIn Profile URL</option>
                                            <option value="github">GitHub Profile URL</option>
                                            <option value="portfolio">Portfolio URL</option>
                                        </select>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Options (For dropdown/checkbox, comma separated)"
                                            value={fieldOptions}
                                            onChange={(e) => setFieldOptions(e.target.value)}
                                            className="p-3 bg-slate-900 text-xs border border-blue-500/20 rounded-lg text-white outline-none"
                                        />
                                        <div className="flex items-center space-x-2 text-xs text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={fieldRequired}
                                                onChange={(e) => setFieldRequired(e.target.checked)}
                                                className="accent-accent cursor-pointer rounded"
                                            />
                                            <span>Mark field as Required?</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomField}
                                        className="w-full py-2 bg-blue-600/25 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
                                    >
                                        + Append Question to Form
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-blue-500/20">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-slate-900 border border-blue-500/20 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary-blue px-6 py-3 rounded-xl font-bold"
                                >
                                    Save Cycle
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
