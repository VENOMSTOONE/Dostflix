import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Details from './pages/Details';
import Search from './pages/Search';
import Stats from './pages/Stats';
import Profiles from './pages/Profiles';
import Timeline from './pages/Timeline';
import MapView from './pages/MapView';
import Developer from './pages/Developer';
import Keepsakes from './pages/Keepsakes';
import Jukebox from './pages/Jukebox';
import MemoryStudio from './pages/MemoryStudio';
import ScrollToTop from './components/layout/ScrollToTop';
import useKonamiCode from './hooks/useKonamiCode';
import DeveloperBanner from './components/ui/DeveloperBanner';
import IntroLoader from './components/ui/IntroLoader';
import { AudioProvider } from './context/AudioContext';
import MusicPlayer from './components/ui/MusicPlayer';
import LoungeMode from './components/ui/LoungeMode';
import { MemoryProvider } from './context/MemoryContext';
import { ThemeProvider } from './context/ThemeContext';

function AppLayout() {
  const isUnlocked = useKonamiCode();
  const [showBanner, setShowBanner] = React.useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const location = useLocation();

  const isProfilePage = location.pathname === '/';

  const handleFinishIntro = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <IntroLoader onFinish={handleFinishIntro} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {isUnlocked && showBanner && <DeveloperBanner onDismiss={() => setShowBanner(false)} />}

      {!isProfilePage && <Navbar onOpenLounge={() => setIsLoungeOpen(true)} />}

      <MusicPlayer />

      <LoungeMode isOpen={isLoungeOpen} onClose={() => setIsLoungeOpen(false)} />

      <main className={`flex-grow flex flex-col ${!isProfilePage ? 'pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<Profiles />} />
          <Route path="/home" element={<Home />} />
          <Route path="/memory/:id" element={<Details />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/search" element={<Search />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/keepsakes" element={<Keepsakes />} />
          <Route path="/jukebox" element={<Jukebox />} />
          <Route path="/studio" element={<MemoryStudio />} />
        </Routes>
      </main>

      {!isProfilePage && <Footer onOpenLounge={() => setIsLoungeOpen(true)} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <MemoryProvider>
        <AudioProvider>
          <Router>
            <AppLayout />
          </Router>
        </AudioProvider>
      </MemoryProvider>
    </ThemeProvider>
  );
}

export default App;
