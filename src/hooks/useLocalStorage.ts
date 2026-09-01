import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

export const useLocalStorage = () => {
  const shapes = useCanvasStore((state) => state.shapes);
  const loadInitialState = useCanvasStore((state) => state.loadInitialState);
  const theme = useCanvasStore((state) => state.theme);
  const setTheme = useCanvasStore((state) => state.setTheme);
  const activeStyle = useCanvasStore((state) => state.activeStyle);
  const setActiveStyle = useCanvasStore((state) => state.setActiveStyle);

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

    const savedActiveStyle = localStorage.getItem('scribble_active_style');
    if (savedActiveStyle) {
      try {
        const parsed = JSON.parse(savedActiveStyle);
        if (parsed && typeof parsed === 'object') {
          setActiveStyle(parsed);
        }
      } catch (e) {
        console.error('Failed to load activeStyle from localStorage', e);
      }
    }
  }, [loadInitialState, setTheme, setActiveStyle]);

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

  useEffect(() => {
    localStorage.setItem('scribble_active_style', JSON.stringify(activeStyle));
  }, [activeStyle]);
};
