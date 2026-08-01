import { useState, useEffect } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export default function useKonamiCode() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === KONAMI_CODE[index]) {
        setIndex(prev => prev + 1);
        if (index === KONAMI_CODE.length - 1) {
          setIsUnlocked(true);
          setIndex(0);
        }
      } else {
        setIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index]);

  return isUnlocked;
}
