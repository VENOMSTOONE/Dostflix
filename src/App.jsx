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
import useKonamiCode from './hooks/useKonamiCode';
import DeveloperBanner from './components/ui/DeveloperBanner';
import IntroLoader from './components/ui/IntroLoader';
import { AudioProvider } from './context/AudioContext';
import MusicPlayer from './components/ui/MusicPlayer';
import { MemoryProvider } from './context/MemoryContext';

function AppLayout() {
  const isUnlocked = useKonamiCode();
  const [showBanner, setShowBanner] = React.useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const isProfilePage = location.pathname === '/';

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', '#e50914');
    root.style.setProperty('--background', '#09090b');
    root.style.setProperty('--surface', '#18181b');
  }, []);

  if (isLoading) {
    return <IntroLoader onFinish={() => setIsLoading(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isUnlocked && showBanner && <DeveloperBanner onDismiss={() => setShowBanner(false)} />}

      {!isProfilePage && <Navbar />}

      <MusicPlayer />

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
        </Routes>
      </main>

      {!isProfilePage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <MemoryProvider>
      <AudioProvider>
        <Router>
          <AppLayout />
        </Router>
      </AudioProvider>
    </MemoryProvider>
  );
}

export default App;
