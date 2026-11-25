import React, { useRef, useState } from 'react';
import { FileImage, ScanText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

declare global {
  interface Window {
    Tesseract?: {
      recognize: (
        image: File,
        languages: string,
        options?: { logger?: (message: { status?: string; progress?: number }) => void }
      ) => Promise<{ data: { text: string } }>;
    };
  }
}

interface DocumentAutoFillProps {
  onTextRecognized: (text: string) => void;
  language?: 'bn' | 'en';
}

let tesseractLoader: Promise<void> | null = null;

const loadTesseract = () => {
  if (window.Tesseract) return Promise.resolve();
  if (!tesseractLoader) {
    tesseractLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-mysonod-tesseract]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('OCR library could not be loaded.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      script.async = true;
      script.dataset.mysonodTesseract = 'true';
      script.onload = () => resolve();
      script.onerror = () => {
        tesseractLoader = null;
        reject(new Error('OCR library could not be loaded. Check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }
  return tesseractLoader;
};

export const DocumentAutoFill: React.FC<DocumentAutoFillProps> = ({ onTextRecognized, language = 'bn' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [applied, setApplied] = useState(false);

  const scanFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(language === 'en' ? 'Please upload an image file (JPG, PNG or WEBP).' : 'JPG, PNG অথবা WEBP ছবি আপলোড করুন।');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError(language === 'en' ? 'Image size must be under 12 MB.' : 'ছবির সাইজ ১২ MB-এর কম হতে হবে।');
      return;
    }
    setFileName(file.name);
    setBusy(true);
    setError('');
    setProgress(0);
    setRecognizedText('');
    setApplied(false);
    try {
      await loadTesseract();
      if (!window.Tesseract) throw new Error('OCR engine is unavailable. Please refresh and try again.');
      const result = await window.Tesseract.recognize(file, 'ben+eng', {
        logger: (message) => {
          if (typeof message.progress === 'number') setProgress(Math.round(message.progress * 100));
        }
      });
      const text = (result.data.text || '').trim();
      if (!text) throw new Error('ছবিতে পড়ার মতো লেখা পাওয়া যায়নি। পরিষ্কার ছবি দিন।');
      setRecognizedText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ছবি স্ক্যান করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3" aria-label="Document OCR auto fill">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
          <ScanText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-emerald-950">{language === 'en' ? 'Scan application photo and auto-fill' : 'আবেদনের ছবি স্ক্যান করে অটো-ফিল'}</h3>
          <p className="text-[11px] text-emerald-800">{language === 'en' ? 'On-device OCR · Bengali + English · No API key' : 'ব্রাউজারেই স্ক্যান হবে · বাংলা + ইংরেজি · কোনো API Key লাগবে না'}</p>
        </div>
        {recognizedText && <button type="button" onClick={() => { setRecognizedText(''); setApplied(false); setFileName(''); if (inputRef.current) inputRef.current.value = ''; }} className="p-1.5 rounded-md text-slate-500 hover:bg-white" aria-label="Clear scan"><X className="w-4 h-4" /></button>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" capture="environment" onChange={(e) => scanFile(e.target.files?.[0])} className="hidden" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
          {busy ? (language === 'en' ? 'Scanning...' : 'স্ক্যান হচ্ছে...') : (language === 'en' ? 'Upload document photo' : 'সনদের ছবি আপলোড করুন')}
        </button>
        {fileName && <span className="text-xs text-slate-600 truncate max-w-[220px]">{fileName}</span>}
      </div>
      {busy && <div className="space-y-1"><div className="h-2 rounded-full bg-emerald-100 overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{ width: progress + '%' }} /></div><p className="text-[11px] text-emerald-800">{language === 'en' ? 'Recognizing text' : 'লেখা শনাক্ত করা হচ্ছে'} · {progress}%</p></div>}
      {error && <p className="flex items-start gap-2 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
      {recognizedText && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><CheckCircle2 className="w-4 h-4" />{language === 'en' ? 'Text recognized. Review before applying.' : 'লেখা শনাক্ত হয়েছে। প্রয়োগের আগে যাচাই করুন।'}</p>
          <textarea readOnly value={recognizedText} rows={5} className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-xs leading-6 text-slate-800" />
          <button type="button" onClick={() => { onTextRecognized(recognizedText); setApplied(true); }} disabled={applied} className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:bg-emerald-700">
            {applied ? (language === 'en' ? 'Applied to matching fields' : 'মিল পাওয়া তথ্য ফর্মে বসানো হয়েছে') : (language === 'en' ? 'Auto-fill matching fields' : 'মিল পাওয়া তথ্য ফর্মে বসান')}
          </button>
          <p className="text-[10px] text-slate-500">{language === 'en' ? 'OCR can misread names and numbers. Check every field before submitting.' : 'OCR নাম ও নম্বর ভুল পড়তে পারে। Submit করার আগে প্রতিটি ঘর যাচাই করুন।'}</p>
        </div>
      )}
    </section>
  );
};
