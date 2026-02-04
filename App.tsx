
import React, { useState, useCallback, useEffect } from 'react';
import { ChildProfile, StoryState, AppView } from './types';
import { geminiService } from './services/gemini';
import Header from './components/Header';
import Background from './components/Background';
import StoryWizard from './components/StoryWizard';
import StoryViewer from './components/StoryViewer';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.WIZARD);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [story, setStory] = useState<StoryState>({
    content: '',
    isStreaming: false,
    choices: [],
  });
  const [chatSession, setChatSession] = useState<any>(null);

  const startStory = async (p: ChildProfile) => {
    setProfile(p);
    setView(AppView.STORY);
    setStory({ content: '', isStreaming: true, choices: [] });

    const chat = geminiService.createStoryChat(p);
    setChatSession(chat);

    try {
      // Include theme in the prompt
      const prompt = `Begin a gentle bedtime story for ${p.name}, who is ${p.age} years old and loves ${p.favorites}. 
      The theme of this story is "${p.theme}".
      The story must be written COMPLETELY in ${p.language}. 
      Make it magical and calming. At the very end of this part, offer 2 or 3 quiet choices for what ${p.name} should do next, 
      listed as simple numbered or bulleted lines.`;
      
      const result = await chat.sendMessageStream({ message: prompt });
      
      let fullText = '';
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text || '';
        fullText += text;
        setStory(prev => ({ ...prev, content: fullText }));
      }
      
      extractChoices(fullText);
    } catch (error) {
      console.error(error);
      setStory(prev => ({ 
        ...prev, 
        isStreaming: false, 
        content: "Oh, it seems the stars are a bit shy tonight. Let's try again gently..." 
      }));
    }
  };

  const extractChoices = (text: string) => {
    // Improved parsing for choices across different languages and formats
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const lastPart = lines.slice(-5); // Look at the end of the text
    const choicesFound: string[] = [];
    
    // Look for lines that look like choices (numbered 1., 2., or starting with dashes/bullets/stars)
    lastPart.forEach(line => {
      const choiceMatch = line.match(/^([0-9][\.\)]|[-*•])\s*(.+)/);
      if (choiceMatch && choiceMatch[2]) {
         choicesFound.push(choiceMatch[2].trim());
      }
    });

    setStory(prev => ({
      ...prev,
      isStreaming: false,
      choices: choicesFound.length > 0 ? choicesFound : [] 
    }));
  };

  const handleChoice = async (choice: string) => {
    if (!chatSession || !profile) return;
    
    setStory(prev => ({ ...prev, isStreaming: true, choices: [], lastChoice: choice }));
    
    try {
      // Continue ensuring the language is respected in the continuation prompt
      const result = await chatSession.sendMessageStream({ 
        message: `The child chooses: "${choice}". Continue the story gently in ${profile.language}.` 
      });
      
      let currentContent = story.content + "\n\n";
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text || '';
        currentContent += text;
        setStory(prev => ({ ...prev, content: currentContent }));
      }
      extractChoices(currentContent);
    } catch (error) {
      console.error(error);
      setStory(prev => ({ ...prev, isStreaming: false }));
    }
  };

  const reset = () => {
    setView(AppView.WIZARD);
    setProfile(null);
    setStory({ content: '', isStreaming: false, choices: [] });
    setChatSession(null);
  };

  return (
    <div className="min-h-screen text-blue-50 selection:bg-indigo-500/30">
      <Background />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          {view === AppView.WIZARD ? (
            <StoryWizard onStart={startStory} />
          ) : (
            profile && <StoryViewer 
              story={story} 
              profile={profile} 
              onChoice={handleChoice}
              onReset={reset}
            />
          )}
        </main>

        <footer className="py-6 px-4 text-center text-blue-300/40 text-sm">
          Built with love & starlight for peaceful dreams.
        </footer>
      </div>
    </div>
  );
};

export default App;
