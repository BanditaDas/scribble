import React from 'react';
import { Header } from './components/header/Header';
import { Toolbar } from './components/toolbar/Toolbar';
import { Canvas } from './components/canvas/Canvas';
import { StylePanel } from './components/panels/StylePanel';
import { GridBackground } from './components/canvas/GridBackground';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  useLocalStorage();
  useKeyboardShortcuts();

  return (
    <div className="relative w-screen h-screen overflow-hidden transition-colors duration-200">
      <GridBackground />
      <Header />
      <Canvas />
      <Toolbar />
      <StylePanel />
    </div>
  );
}
