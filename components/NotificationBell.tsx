'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiBell, FiCheck } from 'react-icons/fi';

interface NotifItem {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotifItem[]>([]);
    const [unread, setUnread] = useState(0);

    async function fetchNotifs() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.notifications || []);
                setUnread(data.unreadCount || 0);
            }
        } catch {}
    }

    useEffect(() => {
        fetchNotifs();
        const timer = setInterval(fetchNotifs, 45000);
        return () => clearInterval(timer);
    }, []);

    async function markAllRead() {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ markAll: true }),
        });
        setItems((prev) => prev.map((i) => ({ ...i, read: true })));
        setUnread(0);
    }

    async function markOneRead(id: string) {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ notificationId: id }),
        });
        setItems((prev) => prev.map((i) => (i._id === id ? { ...i, read: true } : i)));
        setUnread((u) => Math.max(0, u - 1));
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((o) => !o);
                    if (!open) fetchNotifs();
                }}
                className="relative p-2.5 rounded-xl bg-slate-900/70 border border-blue-500/20 hover:border-gold/40 text-slate-200 transition-colors"
                aria-label="Notifications"
            >
                <FiBell className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1220] border border-blue-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="text-sm font-bold text-white">الإشعارات ({unread})</span>
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-xs text-blue-400 hover:text-gold flex items-center gap-1"
                            >
                                <FiCheck /> تحديد الكل كمقروء
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                        {items.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => !item.read && markOneRead(item._id)}
                                    className={`p-3.5 hover:bg-white/5 transition-colors cursor-pointer ${
                                        !item.read ? 'bg-blue-500/10' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-bold text-white">{item.title}</p>
                                        {!item.read && <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1" />}
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                                        </span>
                                        {item.link && (
                                            <Link
                                                href={item.link}
                                                onClick={() => setOpen(false)}
                                                className="text-[11px] text-blue-400 hover:underline"
                                            >
                                                عرض التفاصيل
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
