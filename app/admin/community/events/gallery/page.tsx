'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiImage, FiTrash2, FiEdit2, FiCheck, FiX, FiFilter, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import Navbar from '@/components/Navbar';

export default function AdminGalleryManagement() {
    const [images, setImages] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEventId, setFilterEventId] = useState('');

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<{ file: File; id: string; status: 'pending' | 'uploading' | 'success' | 'error'; progress: number; url?: string; publicId?: string; error?: string }[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');

    // Modal state for Edit
    const [editingImage, setEditingImage] = useState<any>(null);
    const [editForm, setEditForm] = useState({ title: '', caption: '', altText: '', order: 0, isPublished: true });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [imgRes, evRes] = await Promise.all([
                fetch('/api/admin/events/gallery', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/events', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (imgRes.ok) setImages(await imgRes.json());
            if (evRes.ok) setEvents(await evRes.json());
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(f => ({
            file: f,
            id: Math.random().toString(36).substring(7),
            status: 'pending' as const,
            progress: 0
        }));

        // Validate types and size here:
        const validFiles = newFiles.filter(f => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.file.type)) {
                alert(`Invalid file type: ${f.file.name}`);
                return false;
            }
            if (f.file.size > 10 * 1024 * 1024) {
                alert(`File too large (max 10MB): ${f.file.name}`);
                return false;
            }
            return true;
        });

        setUploadFiles(prev => [...prev, ...validFiles]);
    };

    const startUpload = async () => {
        if (!selectedEventId) {
            alert('Please select an event to assign these images to.');
            return;
        }

        setUploading(true);
        const token = localStorage.getItem('token');
        const pendingFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'error');

        let successfulUploads: any[] = [];

        for (const uf of pendingFiles) {
            setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'uploading', progress: 50 } : f));

            const formData = new FormData();
            formData.append('file', uf.file);
            formData.append('folder', `it-spark/events/${selectedEventId}`);

            try {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'success', progress: 100, url: data.imageUrl, publicId: data.publicId } : f));
                    successfulUploads.push({
                        eventId: selectedEventId,
                        imageUrl: data.imageUrl,
                        publicId: data.publicId,
                        title: uf.file.name,
                        order: images.length + successfulUploads.length,
                        isPublished: true
                    });
                } else {
                    const errorData = await res.json();
                    throw new Error(errorData.error);
                }
            } catch (err: any) {
                setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'error', progress: 0, error: err.message || 'Failed' } : f));
            }
        }

        // Now save the successful uploads to the database as gallery images
        if (successfulUploads.length > 0) {
            try {
                const saveRes = await fetch('/api/admin/events/gallery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ images: successfulUploads })
                });

                if (saveRes.ok) {
                    const savedImages = await saveRes.json();
                    setImages(prev => [...savedImages, ...prev]);
                    alert(`${savedImages.length} images uploaded and assigned successfully.`);
                    // Clear successful
                    setUploadFiles(prev => prev.filter(f => f.status !== 'success'));
                }
            } catch (err) {
                console.error("Failed to save gallery records", err);
                alert("Images uploaded to Cloudinary but failed to save in DB.");
            }
        }

        setUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to completely delete this image? It will be removed from Cloudinary and the database.')) return;
        const token = localStorage.getItem('token');
        setImages(prev => prev.filter(img => img._id !== id)); // Optimistic
        try {
            await fetch(`/api/admin/events/gallery/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            fetchData(); // Rollback
        }
    };

    const handleSaveEdit = async () => {
        if (!editingImage) return;
        const token = localStorage.getItem('token');

        setImages(prev => prev.map(i => i._id === editingImage._id ? { ...i, ...editForm } : i));

        try {
            await fetch(`/api/admin/events/gallery/${editingImage._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
        } catch (err) {
            console.error('Update failed');
            fetchData();
        }
        setEditingImage(null);
    };

    const togglePublish = async (id: string, currentStatus: boolean) => {
        const token = localStorage.getItem('token');
        setImages(prev => prev.map(img => img._id === id ? { ...img, isPublished: !currentStatus } : img));
        try {
            await fetch(`/api/admin/events/gallery/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isPublished: !currentStatus })
            });
        } catch { fetchData(); }
    };

    const filteredImages = useMemo(() => {
        if (!filterEventId) return images;
        return images.filter(img => img.eventId?._id === filterEventId);
    }, [images, filterEventId]);

    // Grouping by event for display
    const groupedImages = useMemo(() => {
        const groups: Record<string, { event: any, images: any[] }> = {};
        filteredImages.forEach(img => {
            const evId = img.eventId?._id || 'unknown';
            if (!groups[evId]) groups[evId] = { event: img.eventId || { title: 'Unknown Event' }, images: [] };
            groups[evId].images.push(img);
        });
        return groups;
    }, [filteredImages]);

    return (
        <div className="space-y-8 pb-12">
            <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold mb-2 block">Content Management</span>
                <h1 className="text-3xl font-black text-white tracking-tight">Event Gallery Management</h1>
                <p className="text-slate-400 text-sm mt-1">Upload and manage promotional photos and memories for your events.</p>
            </div>

            {/* Upload Section */}
            <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center"><FiUploadCloud className="mr-2 text-blue-500" /> Upload New Images</h2>

                <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Assign to Event</label>
                        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full bg-slate-900 border border-blue-500/30 p-3.5 rounded-xl text-white outline-none focus:border-gold">
                            <option value="">-- Choose an Event --</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>{ev.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <input type="file" multiple accept="image/jpeg, image/png, image/webp" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center p-3.5 border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 rounded-xl font-bold uppercase text-xs tracking-widest transition-colors gap-2">
                            <FiImage className="text-lg" /> Choose Files (Max 10MB)
                        </button>
                    </div>
                </div>

                {uploadFiles.length > 0 && (
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-blue-500/10 max-h-60 overflow-y-auto custom-scrollbar-thin">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{uploadFiles.length} files queued</span>
                            {uploadFiles.some(f => f.status === 'pending' || f.status === 'error') && (
                                <button onClick={startUpload} disabled={uploading} className="btn-primary-blue px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                                    {uploading ? 'Uploading...' : 'Start Upload'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {uploadFiles.map(f => (
                                <div key={f.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                    <span className="text-xs text-white truncate max-w-[200px]">{f.file.name}</span>
                                    <div className="flex items-center gap-3">
                                        {f.status === 'uploading' && <span className="text-xs text-blue-400 animate-pulse">Uploading...</span>}
                                        {f.status === 'success' && <span className="text-xs text-green-400 flex items-center"><FiCheck className="mr-1" /> Success</span>}
                                        {f.status === 'error' && <span className="text-[10px] text-red-400">{f.error}</span>}
                                        {f.status === 'pending' && <span className="text-[10px] text-slate-400">Waiting</span>}
                                        <button onClick={() => setUploadFiles(prev => prev.filter(file => file.id !== f.id))} className="text-slate-500 hover:text-red-400"><FiX /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <FiFilter className="text-slate-500" />
                <select value={filterEventId} onChange={e => setFilterEventId(e.target.value)} className="bg-slate-900 border border-blue-500/20 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-gold">
                    <option value="">All Events</option>
                    {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </select>
                <div className="text-xs text-slate-500 ml-auto font-bold uppercase tracking-widest">
                    {filteredImages.length} Images Found
                </div>
            </div>

            {/* Gallery Grid Grouped */}
            {loading ? (
                <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div></div>
            ) : Object.keys(groupedImages).length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 text-slate-500">No images found. Select an event above and upload some!</div>
            ) : (
                Object.values(groupedImages).map(group => (
                    <div key={group.event._id} className="space-y-4">
                        <h3 className="text-lg font-black text-white mt-8 mb-4 border-b border-blue-500/20 pb-2">{group.event.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {group.images.map(img => (
                                <motion.div key={img._id} layout className={`group relative aspect-square rounded-2xl overflow-hidden glass-card border ${img.isPublished ? 'border-blue-500/20' : 'border-red-500/30 grayscale-[50%]'}`}>
                                    <img src={img.imageUrl} alt={img.altText || img.title || 'Event image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />

                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                        <div className="flex justify-between">
                                            <button onClick={() => togglePublish(img._id, img.isPublished)} className={`p-1.5 rounded-lg ${img.isPublished ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {img.isPublished ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleDelete(img._id)} className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button onClick={() => {
                                            setEditingImage(img);
                                            setEditForm({ title: img.title, caption: img.caption, altText: img.altText, order: img.order, isPublished: img.isPublished });
                                        }} className="w-full py-1.5 bg-blue-500/80 text-white text-[10px] uppercase font-black tracking-widest rounded-lg flex justify-center items-center gap-1 hover:bg-blue-600">
                                            <FiEdit2 className="w-3 h-3" /> Edit Info
                                        </button>
                                    </div>
                                    {!img.isPublished && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md">Draft</div>
                                    )}
                                    {img.order > 0 && (
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md">Order: {img.order}</div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel w-full max-w-md rounded-[2rem] border border-blue-500/30 overflow-hidden">
                            <img src={editingImage.imageUrl} alt="Edit preview" className="w-full h-48 object-cover border-b border-blue-500/20" />
                            <div className="p-6 space-y-4">
                                <h3 className="text-lg font-black text-white">Edit Image Metadata</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Title (Optional)</label>
                                        <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-gold outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Caption (Shows in Lightbox)</label>
                                        <textarea value={editForm.caption} onChange={e => setEditForm({ ...editForm, caption: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-gold outline-none resize-none" rows={2}></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Alt Text (SEO)</label>
                                            <input type="text" value={editForm.altText} onChange={e => setEditForm({ ...editForm, altText: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-gold outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Order Index</label>
                                            <input type="number" value={editForm.order} onChange={e => setEditForm({ ...editForm, order: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-gold outline-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                                    <button onClick={() => setEditingImage(null)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
                                    <button onClick={handleSaveEdit} className="flex-1 py-2 btn-primary-blue rounded-xl text-xs font-bold uppercase tracking-widest">Save Changes</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
