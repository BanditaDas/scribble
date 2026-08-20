import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

export const useLocalStorage = () => {
  const shapes = useCanvasStore((state) => state.shapes);
  const loadInitialState = useCanvasStore((state) => state.loadInitialState);
  const theme = useCanvasStore((state) => state.theme);
  const setTheme = useCanvasStore((state) => state.setTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('scribble_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }

    const saved = localStorage.getItem('scribble_shapes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          loadInitialState(parsed);
        }
      } catch (e) {
        console.error('Failed to load shapes from localStorage', e);
      }
    }
  }, [loadInitialState]);

  useEffect(() => {
    localStorage.setItem('scribble_shapes', JSON.stringify(shapes));
  }, [shapes]);

  useEffect(() => {
    localStorage.setItem('scribble_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
};
