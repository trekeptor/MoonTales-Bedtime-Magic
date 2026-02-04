
import React, { useEffect, useRef, useState } from 'react';
import { StoryState, ChildProfile } from '../types';
import { geminiService } from '../services/gemini';

interface Props {
  story: StoryState;
  profile: ChildProfile;
  onChoice: (choice: string) => void;
  onReset: () => void;
}

const StoryViewer: React.FC<Props> = ({ story, profile, onChoice, onReset }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [playbackState, setPlaybackState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [ttsEngine, setTtsEngine] = useState<'gemini' | 'browser' | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    setAudioBuffer(null);
    handleStop();
  }, [story.content]);

  // Update Gemini playback rate in real-time
  useEffect(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.playbackRate.value = playbackRate;
    }
  }, [playbackRate]);

  const handleStop = () => {
    // Stop Gemini Audio
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    // Stop Browser Speech
    window.speechSynthesis.cancel();
    
    setPlaybackState('idle');
    setTtsEngine(null);
  };

  const handlePause = async () => {
    if (playbackState !== 'playing') return;

    if (ttsEngine === 'gemini' && audioCtxRef.current) {
      await audioCtxRef.current.suspend();
    } else if (ttsEngine === 'browser') {
      window.speechSynthesis.pause();
    }
    setPlaybackState('paused');
  };

  const handleBrowserSpeech = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(story.content);
    
    // Attempt to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(profile.language.substring(0, 2)));
    if (langVoice) utterance.voice = langVoice;
    
    utterance.pitch = profile.pitch;
    // Bedtime stories are slow by default (0.85), modified by user preference
    utterance.rate = 0.85 * playbackRate; 
    
    utterance.onend = () => {
      setPlaybackState('idle');
      setTtsEngine(null);
    };

    utteranceRef.current = utterance;
    setTtsEngine('browser');
    setPlaybackState('playing');
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = async () => {
    if (playbackState === 'paused') {
      if (ttsEngine === 'gemini' && audioCtxRef.current) {
        await audioCtxRef.current.resume();
      } else if (ttsEngine === 'browser') {
        window.speechSynthesis.resume();
      }
      setPlaybackState('playing');
      return;
    }

    if (playbackState === 'idle') {
      setPlaybackState('loading');
      try {
        const buffer = await geminiService.generateTTS(story.content, profile.voice, profile.pitch);
        if (buffer) {
          setAudioBuffer(buffer);
          setTtsEngine('gemini');
          playBuffer(buffer);
        } else {
          // FALLBACK to browser speech
          console.info("Switching to starlight backup voice...");
          handleBrowserSpeech();
        }
      } catch (e) {
        handleBrowserSpeech();
      }
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    source.connect(audioCtxRef.current.destination);
    
    source.onended = () => {
      if (audioSourceRef.current === source) {
        setPlaybackState('idle');
        setTtsEngine(null);
        audioSourceRef.current = null;
      }
    };
    
    audioSourceRef.current = source;
    source.start(0);
    setPlaybackState('playing');
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 h-full flex flex-col">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh]">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              <h3 className="text-blue-100 font-medium">A story for {profile.name}</h3>
            </div>
            {ttsEngine === 'browser' && (
              <span className="text-[10px] text-blue-300/60 uppercase tracking-widest mt-1">Using Starlight Backup Voice</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3 bg-black/20 p-1 rounded-full border border-white/5">
            {/* Speed Toggle */}
            <button
              onClick={cyclePlaybackRate}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-all text-xs font-bold w-12 text-center"
              title="Change speed"
            >
              {playbackRate}x
            </button>

            <div className="w-px h-6 bg-white/10 mx-0.5" />

            <button
              onClick={handleStop}
              disabled={playbackState === 'idle' || playbackState === 'loading'}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>

            {playbackState === 'playing' ? (
              <button
                onClick={handlePause}
                className="p-2.5 bg-indigo-500 text-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handlePlay}
                disabled={story.isStreaming || playbackState === 'loading'}
                className={`p-2.5 rounded-full transition-all ${playbackState === 'loading' ? 'bg-white/5 text-blue-300' : 'bg-blue-500 text-white hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]'} disabled:opacity-50`}
              >
                {playbackState === 'loading' ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            )}

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={onReset}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          <div className="whitespace-pre-wrap text-blue-50 text-xl leading-relaxed font-light font-serif">
            {story.content}
            {story.isStreaming && (
              <span className="inline-block w-2 h-6 bg-blue-400/50 animate-pulse ml-1 align-middle" />
            )}
          </div>

          {!story.isStreaming && story.choices.length > 0 && (
            <div className="pt-10 border-t border-white/10 animate-fade-in">
              <p className="text-blue-300 italic mb-4">Shhh... what happens next?</p>
              <div className="flex flex-wrap gap-4">
                {story.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => onChoice(choice)}
                    className="bg-indigo-600/30 hover:bg-indigo-500/50 text-white px-6 py-3 rounded-2xl border border-indigo-400/30 transition-all hover:scale-105 active:scale-95 text-left"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
