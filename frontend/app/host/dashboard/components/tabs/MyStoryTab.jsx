// app/host/dashboard/components/tabs/MyStoryTab.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useHostStory } from '@/hooks/useStory';
import { useAuth } from '../../../../../contexts/AuthContext';
import { api } from '@/utils/api';
import { toast } from 'react-hot-toast';
import { 
  FileText, Send, Save, AlertCircle, CheckCircle, Clock, XCircle,
  Plus, Trash2, Link as LinkIcon, Video, Sparkles, Building2, ChevronDown,
  ChevronUp, Upload, X, Globe, Instagram, Facebook, Loader2, Award, Eye,
  Calendar, ExternalLink, Quote, Star, MessageCircle
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const config = {
    DRAFT: { icon: FileText, label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    PENDING: { icon: Clock, label: 'In Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    PUBLISHED: { icon: CheckCircle, label: 'Published', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { icon: XCircle, label: 'Needs Revision', className: 'bg-red-50 text-red-700 border-red-200' },
  }[status] || { icon: FileText, label: 'New', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />{config.label}
    </span>
  );
};

const ImageUpload = ({ value, onChange, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'story');
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      onChange(result.data.url, result.data.publicId);
      toast.success('Uploaded!');
    } catch (e) { toast.error(e.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Cover Photo</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[3/1]">
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <button type="button" onClick={onRemove} className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer aspect-[3/1] flex flex-col items-center justify-center ${dragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400'} ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? <Loader2 className="w-8 h-8 text-teal-500 animate-spin" /> : <><Upload className="w-8 h-8 text-gray-400 mb-2" /><p className="text-sm text-gray-600">Drop or click</p></>}
          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files[0])} className="hidden" />
        </div>
      )}
    </div>
  );
};

const CollapsibleSection = ({ title, description, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg"><Icon className="w-5 h-5 text-teal-600" /></div>
          <div className="text-left"><span className="font-semibold text-gray-900 block">{title}</span>{description && <span className="text-xs text-gray-500">{description}</span>}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
};

const ArrayInput = ({ label, description, items, onChange, placeholder, maxItems = 5 }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div><label className="text-sm font-medium text-gray-700">{label}</label>{description && <p className="text-xs text-gray-500">{description}</p>}</div>
      <span className="text-xs text-gray-400">{items.length}/{maxItems}</span>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input type="text" value={item} onChange={(e) => { const n=[...items]; n[i]=e.target.value; onChange(n); }} placeholder={placeholder} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <button type="button" onClick={() => onChange(items.filter((_,idx)=>idx!==i))} className="p-2.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {items.length < maxItems && <button type="button" onClick={() => onChange([...items,''])} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg"><Plus className="w-4 h-4" />Add</button>}
    </div>
  </div>
);

const YearPicker = ({ value, onChange, label, description }) => {
  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <select value={value||''} onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
        <option value="">Select year</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
};

const StoryPreview = ({ formData, user, onClose }) => {
  const currentYear = new Date().getFullYear();
  const yearsHosting = formData.establishedYear ? currentYear - formData.establishedYear : null;

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);

  const hasHighlights = formData.highlights.filter(h => h.trim()).length > 0;
  const hasSpecialties = formData.specialties.filter(s => s.trim()).length > 0;
  const hasFunFacts = formData.funFacts.filter(f => f.trim()).length > 0;
  const hasSocial = formData.websiteUrl || formData.instagramUrl || formData.facebookUrl || formData.tiktokUrl;
  const hasContent = formData.storyContent || formData.hostingPhilosophy || hasHighlights || hasSpecialties || hasFunFacts;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-4 sm:inset-6 md:inset-10 flex items-start justify-center">
        <div className="w-full max-w-3xl max-h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex-shrink-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <span className="font-semibold text-gray-900">Preview</span>
              <span className="hidden sm:inline text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Guest view</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {formData.coverImage ? (
              <div className="relative h-40 sm:h-52 bg-gray-200">
                <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ) : (
              <div className="h-24 bg-gradient-to-r from-teal-500 to-emerald-500" />
            )}
            <div className="relative px-4 sm:px-6 -mt-10 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg ring-4 ring-white flex-shrink-0">
                    {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" /> : (user?.name?.charAt(0).toUpperCase() || 'H')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.name || 'Your Name'}</h1>
                    {formData.tagline && <p className="text-teal-600 font-medium mt-1 flex items-start gap-1.5 text-sm"><Quote className="w-4 h-4 flex-shrink-0 mt-0.5" />{formData.tagline}</p>}
                    {formData.establishedYear && (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mt-2">
                        <Calendar className="w-4 h-4 text-gray-400" />Est. {formData.establishedYear}{yearsHosting > 0 && ` • ${yearsHosting}y`}
                      </span>
                    )}
                  </div>
                  {hasSocial && (
                    <div className="flex gap-2">
                      {formData.websiteUrl && <span className="p-2 bg-gray-100 rounded-full text-gray-600"><Globe className="w-4 h-4" /></span>}
                      {formData.instagramUrl && <span className="p-2 bg-gray-100 rounded-full text-gray-600"><Instagram className="w-4 h-4" /></span>}
                      {formData.facebookUrl && <span className="p-2 bg-gray-100 rounded-full text-gray-600"><Facebook className="w-4 h-4" /></span>}
                      {formData.tiktokUrl && <span className="p-2 bg-gray-100 rounded-full text-gray-600"><Video className="w-4 h-4" /></span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 pb-8 space-y-6">
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{formData.storyTitle || 'My Story'}</h2>
                {formData.storyContent ? <p className="text-gray-700 whitespace-pre-line leading-relaxed">{formData.storyContent}</p> : <p className="text-gray-400 italic">Your story will appear here...</p>}
              </section>
              {formData.hostingPhilosophy && (
                <section className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-teal-600" />My Hosting Philosophy</h3>
                  <p className="text-gray-700 italic">"{formData.hostingPhilosophy}"</p>
                </section>
              )}
              {hasHighlights && (
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-teal-600" />Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.highlights.filter(h => h.trim()).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><span className="text-gray-700 text-sm">{h}</span></div>
                    ))}
                  </div>
                </section>
              )}
              {hasSpecialties && (
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-teal-600" />Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.filter(s => s.trim()).map((s, i) => <span key={i} className="px-3 py-1.5 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">{s}</span>)}
                  </div>
                </section>
              )}
              {hasFunFacts && (
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-teal-600" />Fun Facts</h3>
                  <ul className="space-y-2">
                    {formData.funFacts.filter(f => f.trim()).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 text-sm"><span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">{i+1}</span>{f}</li>
                    ))}
                  </ul>
                </section>
              )}
              {formData.videoUrl && (
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Video className="w-5 h-5 text-teal-600" />Video</h3>
                  <div className="bg-gray-900 rounded-xl p-6 text-center">
                    <Video className="w-10 h-10 text-white/50 mx-auto mb-2" />
                    <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-400 text-sm hover:text-teal-300"><ExternalLink className="w-3 h-3" />Open video</a>
                  </div>
                </section>
              )}
              {!hasContent && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Fill in the form to see preview</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 bg-gray-50 border-t px-4 sm:px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">Guest view preview</p>
            <button onClick={onClose} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyStoryTab() {
  const { user } = useAuth();
  const { story, loading, exists, fetchStory, saveStory, submitForReview } = useHostStory();
  
  const [formData, setFormData] = useState({
    storyTitle: '', storyContent: '', tagline: '', establishedYear: null, hostingPhilosophy: '',
    highlights: [], specialties: [], funFacts: [],
    coverImage: '', coverImagePublicId: '',
    videoUrl: '', websiteUrl: '', facebookUrl: '', instagramUrl: '', tiktokUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { fetchStory(); }, [fetchStory]);

  useEffect(() => {
    if (story) {
      setFormData({
        storyTitle: story.storyTitle || '', storyContent: story.storyContent || '', tagline: story.tagline || '',
        establishedYear: story.hostingSince || null, hostingPhilosophy: story.hostMessage || '',
        highlights: story.highlights || [], specialties: story.specialties || [], funFacts: story.funFacts || [],
        coverImage: story.coverImage || '', coverImagePublicId: story.coverImagePublicId || '',
        videoUrl: story.videoUrl || '', websiteUrl: story.websiteUrl || '',
        facebookUrl: story.facebookUrl || '', instagramUrl: story.instagramUrl || '', tiktokUrl: story.tiktokUrl || '',
      });
    }
  }, [story]);

  const updateField = useCallback((field, value) => setFormData(prev => ({ ...prev, [field]: value })), []);
  const isValid = formData.storyTitle.trim().length >= 5 && formData.storyContent.trim().length >= 200;

  // Helper to extract user-friendly error message
  const getErrorMessage = (err) => {
    // If API returned validation details
    if (err.details && Array.isArray(err.details)) {
      return err.details.map(d => d.message).join('. ');
    }
    // If it's a standard message
    if (err.message && err.message !== 'Validation failed') {
      return err.message;
    }
    return 'Failed to save. Please check your inputs.';
  };

  const handleSave = async (asDraft = false) => {
    setSaving(true);
    try {
      await saveStory({
        storyTitle: formData.storyTitle, storyContent: formData.storyContent, tagline: formData.tagline,
        hostingSince: formData.establishedYear, hostMessage: formData.hostingPhilosophy,
        highlights: formData.highlights.filter(h => h.trim()), specialties: formData.specialties.filter(s => s.trim()), funFacts: formData.funFacts.filter(f => f.trim()),
        coverImage: formData.coverImage, coverImagePublicId: formData.coverImagePublicId,
        videoUrl: formData.videoUrl, websiteUrl: formData.websiteUrl, facebookUrl: formData.facebookUrl, instagramUrl: formData.instagramUrl, tiktokUrl: formData.tiktokUrl,
        status: asDraft ? 'DRAFT' : undefined,
      });
      toast.success(asDraft ? 'Saved as draft' : 'Story saved!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!isValid) { 
      toast.error('Story must have a title (5+ chars) and content (200+ chars)'); 
      return; 
    }
    setSubmitting(true);
    try {
      await saveStory({
        storyTitle: formData.storyTitle, storyContent: formData.storyContent, tagline: formData.tagline,
        hostingSince: formData.establishedYear, hostMessage: formData.hostingPhilosophy,
        highlights: formData.highlights.filter(h => h.trim()), specialties: formData.specialties.filter(s => s.trim()), funFacts: formData.funFacts.filter(f => f.trim()),
        coverImage: formData.coverImage, coverImagePublicId: formData.coverImagePublicId,
        videoUrl: formData.videoUrl, websiteUrl: formData.websiteUrl, facebookUrl: formData.facebookUrl, instagramUrl: formData.instagramUrl, tiktokUrl: formData.tiktokUrl,
      });
      await submitForReview();
      toast.success('Story submitted for review!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  const handleImageRemove = async () => {
    if (formData.coverImagePublicId) {
      try { await api.delete('/api/upload', { data: { publicId: formData.coverImagePublicId } }); } catch {}
    }
    setFormData(prev => ({ ...prev, coverImage: '', coverImagePublicId: '' }));
  };

  if (loading && !story && exists === null) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;

  const isPending = story?.status === 'PENDING';
  const isPublished = story?.status === 'PUBLISHED';
  const isRejected = story?.status === 'REJECTED';

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{!story ? 'Tell Your Story' : 'My Story'}</h2>
              <p className="mt-1 text-gray-600">{!story ? 'Help guests connect with you.' : 'Share what makes you special.'}</p>
            </div>
            <div className="flex items-center gap-3">
              {story && <StatusBadge status={story.status} />}
              <button type="button" onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg"><Eye className="w-4 h-4" />Preview</button>
            </div>
          </div>
          {isRejected && story.rejectionReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div><p className="font-medium text-red-800">Please revise</p><p className="text-sm text-red-700 mt-1">{story.rejectionReason}</p></div>
            </div>
          )}
          {isPending && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div><p className="font-medium text-amber-800">Under review</p><p className="text-sm text-amber-700 mt-1">You'll be notified once approved.</p></div>
            </div>
          )}
          {isPublished && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div><p className="font-medium text-emerald-800">Your story is live!</p></div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <ImageUpload value={formData.coverImage} onChange={(url, publicId) => setFormData(prev => ({ ...prev, coverImage: url, coverImagePublicId: publicId }))} onRemove={handleImageRemove} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg"><FileText className="w-5 h-5 text-teal-600" /></div>
              <div><h3 className="font-semibold text-gray-900">Your Story</h3><p className="text-sm text-gray-500">Tell guests about yourself</p></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Story Title <span className="text-red-500">*</span></label>
              <input type="text" value={formData.storyTitle} onChange={(e) => updateField('storyTitle', e.target.value)} placeholder="e.g., From Family Garden to Dream Venue" maxLength={150} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
              <p className="mt-1 text-xs text-gray-400 text-right">{formData.storyTitle.length}/150</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Story <span className="text-red-500">*</span></label>
              <textarea value={formData.storyContent} onChange={(e) => updateField('storyContent', e.target.value)} placeholder="Share your journey... How did you start? What makes your space special? What do you love about hosting?" rows={6} maxLength={3000} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" />
              <div className="mt-1 flex justify-between text-xs">
                <span className={formData.storyContent.length < 200 ? 'text-amber-500' : 'text-emerald-500'}>{formData.storyContent.length < 200 ? `${200 - formData.storyContent.length} more characters needed` : '✓ Minimum met'}</span>
                <span className="text-gray-400">{formData.storyContent.length}/3000</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
              <input type="text" value={formData.tagline} onChange={(e) => updateField('tagline', e.target.value)} placeholder="Your motto" maxLength={100} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
            </div>
          </div>

          <CollapsibleSection title="About You & Your Business" description="Background info" icon={Building2}>
            <div className="space-y-5">
              <YearPicker value={formData.establishedYear} onChange={(y) => updateField('establishedYear', y)} label="Established" description="When did you start?" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hosting Philosophy</label>
                <textarea value={formData.hostingPhilosophy} onChange={(e) => updateField('hostingPhilosophy', e.target.value)} placeholder="Your approach..." rows={3} maxLength={500} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Highlights & Expertise" description="Achievements" icon={Award}>
            <div className="space-y-6">
              <ArrayInput label="Highlights" description="Your achievements" items={formData.highlights} onChange={(items) => updateField('highlights', items)} placeholder="e.g., 500+ events" />
              <ArrayInput label="Specialties" description="What you excel at" items={formData.specialties} onChange={(items) => updateField('specialties', items)} placeholder="e.g., Weddings" />
              <ArrayInput label="Fun Facts" items={formData.funFacts} onChange={(items) => updateField('funFacts', items)} placeholder="e.g., Featured in magazines" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Media & Links" description="Video and social" icon={LinkIcon}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="url" value={formData.videoUrl} onChange={(e) => updateField('videoUrl', e.target.value)} placeholder="YouTube or Vimeo" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{icon: Globe, field: 'websiteUrl', ph: 'Website'}, {icon: Instagram, field: 'instagramUrl', ph: 'Instagram'}, {icon: Facebook, field: 'facebookUrl', ph: 'Facebook'}, {icon: Video, field: 'tiktokUrl', ph: 'TikTok'}].map(({icon: I, field, ph}) => (
                  <div key={field} className="relative">
                    <I className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="url" value={formData[field]} onChange={(e) => updateField(field, e.target.value)} placeholder={ph} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="button" onClick={() => setShowPreview(true)} className="sm:hidden flex-1 px-6 py-3 border border-teal-300 text-teal-700 rounded-xl flex items-center justify-center gap-2 font-medium"><Eye className="w-4 h-4" />Preview</button>
            <button type="button" onClick={() => handleSave(true)} disabled={saving || submitting} className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Draft
            </button>
            {!isPending && (
              <button type="button" onClick={isPublished ? () => handleSave(false) : handleSubmit} disabled={saving || submitting || (!isPublished && !isValid)} className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isPublished ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {isPublished ? 'Update' : 'Submit for Review'}
              </button>
            )}
          </div>
          {!isValid && !isPending && <p className="text-sm text-gray-500 text-center">Title (5+ chars) and story (200+ chars) required to submit.</p>}
        </form>
      </div>
      {showPreview && <StoryPreview formData={formData} user={user} onClose={() => setShowPreview(false)} />}
    </>
  );
}