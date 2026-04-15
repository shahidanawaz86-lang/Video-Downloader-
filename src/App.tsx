import React, { useState } from 'react';
import { Download, Music, Youtube, Loader2, AlertCircle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'fetching' | 'converting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string; author: string } | null>(null);

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setStatus('fetching');
    setErrorMsg('');
    setVideoInfo(null);

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video info');
      }

      setVideoInfo(data);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const handleDownload = async () => {
    setStatus('converting');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/convert?url=${encodeURIComponent(url)}`);
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to convert video');
      }

      // Get filename from header
      const disposition = res.headers.get('Content-Disposition');
      let filename = 'audio.mp3';
      if (disposition && disposition.includes('filename="')) {
        filename = disposition.split('filename="')[1].split('"')[0];
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setUrl('');
        setVideoInfo(null);
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 flex flex-col max-w-[1100px] mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[#1f2937]">
          <div className="w-8 h-8 bg-[#ff4b2b] rounded-lg flex items-center justify-center text-white">
            <Play size={18} fill="currentColor" />
          </div>
          SonicConvert
        </div>
        <div className="text-[#6b7280] text-sm font-medium hidden sm:block">
          Premium Account: <span className="text-[#1f2937]">active_user_82</span>
        </div>
      </header>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-3 gap-6 flex-grow">
        
        {/* Main Convert Card */}
        <div className="bg-white rounded-[24px] border border-[#e5e7eb] p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] lg:col-span-2 lg:row-span-2 flex flex-col justify-center">
          <h1 className="text-4xl md:text-[42px] leading-[1.1] mb-6 font-bold tracking-[-1.5px] text-[#1f2937]">
            High-fidelity audio extraction. <span className="text-[#ff4b2b]">Instant.</span>
          </h1>
          <p className="text-[#6b7280] mb-8 text-lg">
            Paste your YouTube URL below to begin the high-bitrate conversion process.
          </p>

          <form onSubmit={handleFetchInfo} className="mb-5">
            <div className="relative">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'fetching' || status === 'converting'}
                className="w-full p-5 px-6 rounded-2xl border-2 border-[#e5e7eb] text-base transition-colors focus:outline-none focus:border-[#ff4b2b] disabled:opacity-50 text-[#1f2937]"
                required
              />
              {!videoInfo && (
                <button
                  type="submit"
                  disabled={!url || status === 'fetching'}
                  className="absolute right-2 top-2 bottom-2 bg-[#1f2937] text-white px-6 rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {status === 'fetching' ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="px-5 py-2.5 rounded-full bg-[#1f2937] text-white border border-[#1f2937] text-sm font-medium cursor-pointer">MP3 320kbps</div>
            <div className="px-5 py-2.5 rounded-full bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb] text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">MP3 256kbps</div>
            <div className="px-5 py-2.5 rounded-full bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb] text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">WAV (Lossless)</div>
            <div className="px-5 py-2.5 rounded-full bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb] text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">M4A</div>
          </div>

          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <p>{errorMsg}</p>
              </motion.div>
            )}

            {videoInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-center gap-4 p-4 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb]"
              >
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-24 h-16 object-cover rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1f2937] truncate" title={videoInfo.title}>
                    {videoInfo.title}
                  </h3>
                  <p className="text-[#6b7280] text-sm truncate">
                    {videoInfo.author}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={videoInfo ? handleDownload : handleFetchInfo}
            disabled={!url || status === 'fetching' || status === 'converting'}
            className="w-full p-5 rounded-2xl border-none bg-[#ff4b2b] text-white text-lg font-semibold cursor-pointer flex items-center justify-center gap-3 hover:bg-[#e03e22] transition-colors disabled:opacity-70"
          >
            {status === 'fetching' ? (
              <><Loader2 size={20} className="animate-spin" /> Fetching Info...</>
            ) : status === 'converting' ? (
              <><Loader2 size={20} className="animate-spin" /> Converting...</>
            ) : status === 'success' ? (
              <><Music size={20} /> Downloaded!</>
            ) : videoInfo ? (
              <><Download size={20} /> Start Conversion</>
            ) : (
              <><Youtube size={20} /> Prepare Video</>
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-[24px] border border-[#e5e7eb] p-6 md:p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] lg:col-start-3 lg:row-span-3 flex flex-col">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-5">Recent Conversions</h3>
          <ul className="list-none flex-grow">
            {[
              { title: "Midnight City - M83 (Official Video)", meta: "9.4 MB • 320kbps • 2m ago", color: "#ffe4e0" },
              { title: "Lofi Hip Hop Radio - Beats to Sleep", meta: "156 MB • 320kbps • 15m ago", color: "#e0f2fe" },
              { title: "Lex Fridman Podcast #412 - Sam Altman", meta: "84.2 MB • 256kbps • 1h ago", color: "#f0fdf4" },
              { title: "Interstellar Main Theme - Hans Zimmer", meta: "12.1 MB • 320kbps • 3h ago", color: "#faf5ff" },
              { title: "Tame Impala - Let It Happen (Full)", meta: "18.5 MB • 320kbps • 5h ago", color: "#fffbeb" }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 py-4 border-b border-[#e5e7eb] last:border-0">
                <div className="w-12 h-12 rounded-lg shrink-0" style={{ background: item.color }}></div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-[#1f2937] whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#6b7280]">{item.meta}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-5 text-[13px] text-[#6b7280] leading-relaxed">
            By using this service, you agree to our Terms of Service and Privacy Policy. All downloads are for personal use only.
          </div>
        </div>

        {/* Stat Card 1 */}
        <div className="bg-white rounded-[24px] border border-[#e5e7eb] p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="text-sm text-[#6b7280] font-medium uppercase tracking-wider">Server Load</div>
          <div className="text-[32px] font-bold text-[#1f2937]">12%</div>
          <div className="text-xs text-[#10b981] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block"></span>
            Optimal Performance
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-[24px] border border-[#e5e7eb] p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="text-sm text-[#6b7280] font-medium uppercase tracking-wider">Avg. Speed</div>
          <div className="text-[32px] font-bold text-[#1f2937]">
            42<span className="text-lg font-medium"> MB/s</span>
          </div>
          <div className="text-xs text-[#6b7280]">
            Location: Frankfurt-DE
          </div>
        </div>

      </div>
    </div>
  );
}
