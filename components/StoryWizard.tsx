
import React, { useState } from 'react';
import { ChildProfile } from '../types';

interface Props {
  onStart: (profile: ChildProfile) => void;
}

const StoryWizard: React.FC<Props> = ({ onStart }) => {
  const [profile, setProfile] = useState<ChildProfile>({
    name: '',
    age: 5,
    favorites: '',
    language: 'English',
    voice: 'Kore',
    theme: 'Magic',
    pitch: 1.0,
  });

  const languages = ['English', 'Spanish', 'Hindi', 'French', 'German', 'Portuguese', 'Japanese', 'Chinese'];
  const voices = ['Kore', 'Puck', 'Alice', 'Charon', 'Fenrir', 'Zephyr'];
  const themes = ['Adventure', 'Friendship', 'Nature', 'Magic', 'Dreams', 'Animals'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name && profile.favorites) {
      onStart(profile);
    }
  };

  const getPitchLabel = (pitch: number) => {
    if (pitch < 0.8) return "Deep & Warm";
    if (pitch > 1.2) return "Light & Cheerful";
    return "Natural";
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-serif text-blue-100 mb-6 text-center">Let's create a story...</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Child's Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Leo"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors placeholder:text-blue-200/30"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                min="3"
                max="10"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Language</label>
              <select
                className="w-full bg-[#0c142e] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              >
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Story Theme</label>
              <select
                className="w-full bg-[#0c142e] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                value={profile.theme}
                onChange={(e) => setProfile({ ...profile, theme: e.target.value })}
              >
                {themes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Narrator Voice</label>
              <select
                className="w-full bg-[#0c142e] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                value={profile.voice}
                onChange={(e) => setProfile({ ...profile, voice: e.target.value })}
              >
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-blue-200 text-sm font-medium">Voice Pitch</label>
              <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-1 rounded">
                {getPitchLabel(profile.pitch)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              className="w-full h-2 bg-blue-900/50 rounded-lg appearance-none cursor-pointer accent-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
              value={profile.pitch}
              onChange={(e) => setProfile({ ...profile, pitch: parseFloat(e.target.value) })}
            />
            <div className="flex justify-between mt-1 px-1">
              <span className="text-[10px] text-blue-200/40 uppercase tracking-widest">Deep</span>
              <span className="text-[10px] text-blue-200/40 uppercase tracking-widest">High</span>
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">What does {profile.name || 'the little one'} love?</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. pandas, twinkling stars, and strawberry ice cream"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors placeholder:text-blue-200/30"
              value={profile.favorites}
              onChange={(e) => setProfile({ ...profile, favorites: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 group"
          >
            <span>Begin the Magic</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoryWizard;
