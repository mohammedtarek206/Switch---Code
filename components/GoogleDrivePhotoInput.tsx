'use client';

import { useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiImage, FiLoader, FiExternalLink } from 'react-icons/fi';

interface GoogleDrivePhotoInputProps {
    value: string;
    onChange: (url: string, valid: boolean, previewUrl?: string) => void;
    required?: boolean;
}

export default function GoogleDrivePhotoInput({
    value,
    onChange,
    required = false,
}: GoogleDrivePhotoInputProps) {
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    async function verifyUrl(urlToVerify: string) {
        const trimmed = urlToVerify.trim();
        if (!trimmed) {
            setStatus('idle');
            setErrorMsg('');
            setPreviewUrl('');
            onChange('', !required);
            return;
        }

        setChecking(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/media/validate-drive-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: trimmed }),
            });
            const data = await res.json();
            if (res.ok && data.valid) {
                setStatus('valid');
                setPreviewUrl(data.displayUrl);
                onChange(trimmed, true, data.displayUrl);
            } else {
                setStatus('invalid');
                setPreviewUrl('');
                setErrorMsg(data.error || 'رابط الصورة غير صالح.');
                onChange(trimmed, false);
            }
        } catch {
            setStatus('invalid');
            setErrorMsg('تعذر التحقق من الرابط حالياً.');
            onChange(trimmed, false);
        } finally {
            setChecking(false);
        }
    }

    return (
        <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-gray-200">
                Profile Photo – Google Drive Link {!required && <span className="text-xs text-gray-400">(اختياري)</span>}
            </label>
            <p className="text-xs text-blue-300/90 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 leading-relaxed">
                ارفع صورتك على Google Drive، واجعل صلاحية المشاركة{' '}
                <span className="font-bold text-gold">Anyone with the link – Viewer</span>، ثم انسخ الرابط والصقه هنا.
            </p>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiImage className="w-4 h-4" />
                    </div>
                    <input
                        type="url"
                        required={required}
                        placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                        value={value}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStatus('idle');
                            setErrorMsg('');
                            onChange(val, !val.trim() && !required);
                        }}
                        onBlur={(e) => {
                            if (e.target.value.trim()) verifyUrl(e.target.value);
                        }}
                        className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl bg-dark-light text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
                    />
                </div>
                <button
                    type="button"
                    disabled={checking || !value.trim()}
                    onClick={() => verifyUrl(value)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                    {checking ? <FiLoader className="w-4 h-4 animate-spin" /> : 'تحقق'}
                </button>
            </div>

            {status === 'valid' && previewUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <img
                        src={previewUrl}
                        alt="Profile Preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                            <FiCheckCircle className="w-4 h-4 shrink-0" />
                            <span>تم التحقق من الصورة بنجاح</span>
                        </div>
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-gray-400 hover:text-white inline-flex items-center gap-1 mt-0.5 truncate"
                        >
                            معاينة الرابط <FiExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}

            {status === 'invalid' && errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}
        </div>
    );
}
