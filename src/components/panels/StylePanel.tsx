import React, { useState, useEffect, useRef } from 'react';
import { 
  Minus, 
  Plus, 
  Copy, 
  Trash2, 
  X, 
  BringToFront, 
  SendToBack, 
  ArrowUp, 
  ArrowDown, 
  Pipette, 
  Square, 
  Circle as CircleIcon, 
  Minus as MinusIcon, 
  ArrowRight, 
  PenTool, 
  Type as TypeIcon,
  Check
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { COLORS, TOOLS } from '../../lib/constants';

export const StylePanel = () => {
  const shapes = useCanvasStore((state) => state.shapes);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const activeStyle = useCanvasStore((state) => state.activeStyle);
  const setActiveStyle = useCanvasStore((state) => state.setActiveStyle);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const deleteShape = useCanvasStore((state) => state.deleteShape);
  const duplicateShape = useCanvasStore((state) => state.duplicateShape);
  const bringToFront = useCanvasStore((state) => state.bringToFront);
  const sendToBack = useCanvasStore((state) => state.sendToBack);
  const bringForward = useCanvasStore((state) => state.bringForward);
  const sendBackward = useCanvasStore((state) => state.sendBackward);
  const setSelectedId = useCanvasStore((state) => state.setSelectedId);

  const selectedShape = shapes.find((s) => s.id === selectedId);
  const targetType = selectedShape ? selectedShape.type : activeTool;

  const currentStroke = (selectedShape?.stroke !== undefined ? selectedShape.stroke : activeStyle?.stroke) || '';
  const currentFill = (selectedShape?.fill !== undefined ? selectedShape.fill : activeStyle?.fill) || 'transparent';
  const currentStrokeWidth = selectedShape?.strokeWidth !== undefined ? selectedShape.strokeWidth : (activeStyle?.strokeWidth || 2);
  const currentStrokeStyle = selectedShape?.strokeStyle || activeStyle?.strokeStyle || 'solid';
  const currentOpacity = Math.round((selectedShape?.opacity !== undefined ? selectedShape.opacity : (activeStyle?.opacity ?? 1)) * 100);
  const currentCornerRadius = selectedShape?.cornerRadius !== undefined ? selectedShape.cornerRadius : (activeStyle?.cornerRadius || 0);
  const currentFontSize = selectedShape?.fontSize !== undefined ? selectedShape.fontSize : (activeStyle?.fontSize || 20);
  const currentFontFamily = selectedShape?.fontFamily || activeStyle?.fontFamily || 'Inter, sans-serif';

  const [strokeHexInput, setStrokeHexInput] = useState(currentStroke);
  const [fillHexInput, setFillHexInput] = useState(currentFill);
  const strokeColorInputRef = useRef<HTMLInputElement>(null);
  const fillColorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStrokeHexInput(currentStroke);
    setFillHexInput(currentFill);
  }, [selectedShape?.id, currentStroke, currentFill]);

  // If no shape is selected and the user is in select or eraser mode, hide the panel
  if (!selectedShape && (activeTool === TOOLS.SELECT || activeTool === TOOLS.ERASER)) {
    return null;
  }

  const handleColorChange = (key: 'stroke' | 'fill', color: string) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { [key]: color });
    }
    setActiveStyle({ [key]: color });
    if (key === 'stroke') setStrokeHexInput(color);
    if (key === 'fill') setFillHexInput(color);
  };

  const handleCustomHexSubmit = (key: 'stroke' | 'fill', val: string) => {
    let formatted = val.trim();
    if (!formatted.startsWith('#') && formatted !== 'transparent') {
      formatted = `#${formatted}`;
    }
    if (selectedShape) {
      updateShape(selectedShape.id, { [key]: formatted });
    }
    setActiveStyle({ [key]: formatted });
  };

  const handleWidthChange = (strokeWidth: number) => {
    const width = Math.max(1, Math.min(40, strokeWidth));
    if (selectedShape) {
      updateShape(selectedShape.id, { strokeWidth: width });
    }
    setActiveStyle({ strokeWidth: width });
  };

  const handleStrokeStyleChange = (strokeStyle: 'solid' | 'dashed' | 'dotted') => {
    if (selectedShape) {
      updateShape(selectedShape.id, { strokeStyle });
    }
    setActiveStyle({ strokeStyle });
  };

  const handleOpacityChange = (opacity: number) => {
    const clamped = Math.max(0, Math.min(1, opacity));
    if (selectedShape) {
      updateShape(selectedShape.id, { opacity: clamped });
    }
    setActiveStyle({ opacity: clamped });
  };

  const handleCornerRadiusChange = (cornerRadius: number) => {
    const clamped = Math.max(0, Math.min(60, cornerRadius));
    if (selectedShape) {
      updateShape(selectedShape.id, { cornerRadius: clamped });
    }
    setActiveStyle({ cornerRadius: clamped });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { text: e.target.value });
    }
  };

  const handleFontSizeChange = (fontSize: number) => {
    const size = Math.max(8, Math.min(300, fontSize));
    if (selectedShape) {
      updateShape(selectedShape.id, { fontSize: size });
    }
    setActiveStyle({ fontSize: size });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { fontFamily });
    }
    setActiveStyle({ fontFamily });
  };

  // Curated color swatches
  const strokeColors = [
    COLORS.black,
    COLORS.graphite,
    '#64748B',
    COLORS.white,
    COLORS.accent,
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    'transparent'
  ];

  const fillColors = [
    'transparent',
    COLORS.white,
    '#F1F5F9',
    COLORS.graphite,
    COLORS.accent,
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#FFE4DE',
    '#DBEAFE',
    '#D1FAE5',
    '#FEF3C7',
    '#EDE9FE',
    '#FCE7F3'
  ];

  const textColors = strokeColors.filter(c => c !== 'transparent');

  const strokeWidthPresets = [
    { label: 'S', width: 2, heightClass: 'h-0.5' },
    { label: 'M', width: 4, heightClass: 'h-1' },
    { label: 'L', width: 8, heightClass: 'h-1.5' },
    { label: 'XL', width: 14, heightClass: 'h-2' },
  ];

  const strokeStyles: Array<{ id: 'solid' | 'dashed' | 'dotted'; label: string; dashPattern: string }> = [
    { id: 'solid', label: 'Solid', dashPattern: 'border-solid' },
    { id: 'dashed', label: 'Dashed', dashPattern: 'border-dashed' },
    { id: 'dotted', label: 'Dotted', dashPattern: 'border-dotted' },
  ];

  const opacityPresets = [25, 50, 75, 100];

  const cornerRadiusPresets = [
    { label: 'Sharp', radius: 0 },
    { label: 'Smooth', radius: 10 },
    { label: 'Round', radius: 24 },
  ];

  const fontFamilies = [
    { label: 'Inter (Sans)', value: 'Inter, sans-serif' },
    { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
    { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  ];

  const sizePresets = [
    { label: 'S', size: 16 },
    { label: 'M', size: 24 },
    { label: 'L', size: 36 },
    { label: 'XL', size: 48 },
  ];

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'rectangle': return <Square size={14} className="text-[#FF5A36]" />;
      case 'ellipse': return <CircleIcon size={14} className="text-[#FF5A36]" />;
      case 'line': return <MinusIcon size={14} className="text-[#FF5A36]" />;
      case 'arrow': return <ArrowRight size={14} className="text-[#FF5A36]" />;
      case 'pen': return <PenTool size={14} className="text-[#FF5A36]" />;
      case 'text': return <TypeIcon size={14} className="text-[#FF5A36]" />;
      default: return null;
    }
  };

  const isShapeFilled = targetType === 'rectangle' || targetType === 'ellipse';

  return (
    <div className="absolute right-6 top-20 w-72 max-h-[calc(100vh-100px)] overflow-y-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-200/90 dark:border-zinc-700/90 p-4 pointer-events-auto z-20 transition-all duration-200 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
      
      {/* Header with Shape Badge and Quick Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg border border-gray-200/60 dark:border-zinc-700/60">
          {getShapeIcon(targetType)}
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider jetbrains-mono">
            {targetType}
          </span>
        </div>

        {selectedShape ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => duplicateShape(selectedShape.id)}
              title="Duplicate Shape (Ctrl+D)"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Copy size={15} />
            </button>
            <button
              type="button"
              onClick={() => deleteShape(selectedShape.id)}
              title="Delete Shape"
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              title="Deselect (Esc)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-400">
              Tool Style
            </span>
            <button
              type="button"
              onClick={() => setActiveTool(TOOLS.SELECT)}
              title="Close (V)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Layer Ordering Bar (Only for selected shapes on canvas) */}
      {selectedShape && (
        <div className="flex items-center justify-between mt-3 px-2 py-1 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Layer</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => sendToBack(selectedShape.id)}
              title="Send to Back"
              className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <SendToBack size={14} />
            </button>
            <button
              type="button"
              onClick={() => sendBackward(selectedShape.id)}
              title="Send Backward"
              className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => bringForward(selectedShape.id)}
              title="Bring Forward"
              className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => bringToFront(selectedShape.id)}
              title="Bring to Front"
              className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <BringToFront size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-4">
        
        {/* TEXT SPECIFIC CONTROLS */}
        {targetType === 'text' && (
          <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
            {selectedShape && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5 jetbrains-mono">
                  Content
                </label>
                <textarea
                  value={selectedShape.text || ''}
                  onChange={handleTextChange}
                  rows={2}
                  placeholder="Type text..."
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] dark:bg-zinc-800/80 dark:text-gray-100 transition-all resize-none shadow-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5 jetbrains-mono">
                Font Family
              </label>
              <select
                value={currentFontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] dark:bg-zinc-800/80 dark:text-gray-100 transition-all shadow-xs"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
                  Font Size
                </label>
                <span className="text-xs font-bold text-[#FF5A36] jetbrains-mono">
                  {currentFontSize}px
                </span>
              </div>

              {/* Font Size Preset Pad */}
              <div className="grid grid-cols-4 gap-1.5 mb-2 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-zinc-700/60">
                {sizePresets.map(({ label, size }) => {
                  const isActive = currentFontSize === size;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleFontSizeChange(size)}
                      className={`py-1 text-xs font-semibold rounded-lg transition-all flex flex-col items-center justify-center ${
                        isActive
                          ? 'bg-[#FF5A36] text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-[10px] font-normal opacity-80">{size}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Size Stepper & Numeric Input */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(Math.max(8, currentFontSize - 2))}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
                  title="Decrease font size"
                >
                  <Minus size={14} />
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="8"
                    max="200"
                    value={currentFontSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= 300) {
                        handleFontSizeChange(val);
                      }
                    }}
                    className="w-full text-center py-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-colors shadow-xs"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
                    px
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleFontSizeChange(Math.min(200, currentFontSize + 2))}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
                  title="Increase font size"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STROKE / TEXT COLOR SECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
              {targetType === 'text' ? 'Text Color' : 'Stroke Color'}
            </label>
            <div className="flex items-center gap-1.5">
              <div 
                className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-zinc-600 shadow-xs"
                style={{ backgroundColor: currentStroke === 'transparent' ? '#fff' : currentStroke }}
              />
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                {currentStroke || 'None'}
              </span>
            </div>
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {(targetType === 'text' ? textColors : strokeColors).map((c) => {
              const isSelected = currentStroke.toLowerCase() === c.toLowerCase();
              const isTransparent = c === 'transparent';
              return (
                <button
                  key={`stroke-${c}`}
                  type="button"
                  onClick={() => handleColorChange('stroke', c)}
                  className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 group hover:scale-105 ${
                    isSelected 
                      ? 'ring-2 ring-offset-2 dark:ring-offset-zinc-900 ring-[#FF5A36] border-transparent scale-105' 
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500'
                  }`}
                  style={{
                    backgroundColor: isTransparent ? '#FFFFFF' : c,
                    backgroundImage: isTransparent
                      ? 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd)'
                      : 'none',
                    backgroundPosition: '0 0, 3px 3px',
                    backgroundSize: '6px 6px'
                  }}
                  title={c}
                >
                  {isSelected && (
                    <Check 
                      size={12} 
                      className={c === COLORS.white || c === '#F1F5F9' || isTransparent ? 'text-gray-900' : 'text-white'} 
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Hex / Pipette Row */}
          <div className="flex items-center gap-1.5 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 dark:text-gray-500">
                HEX
              </span>
              <input
                type="text"
                value={strokeHexInput}
                onChange={(e) => {
                  setStrokeHexInput(e.target.value);
                  handleCustomHexSubmit('stroke', e.target.value);
                }}
                placeholder="#000000"
                className="w-full pl-10 pr-2 py-1 text-xs font-mono font-medium border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-colors"
              />
            </div>
            
            <button
              type="button"
              onClick={() => strokeColorInputRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
              title="Pick Custom Color"
            >
              <Pipette size={14} />
              <input
                ref={strokeColorInputRef}
                type="color"
                value={currentStroke.startsWith('#') ? currentStroke : '#000000'}
                onChange={(e) => handleColorChange('stroke', e.target.value)}
                className="sr-only"
              />
            </button>
          </div>
        </div>

        {/* STROKE WIDTH & STYLE SECTION */}
        {targetType !== 'text' && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
                Stroke Width
              </label>
              <span className="text-xs font-bold text-[#FF5A36] jetbrains-mono">
                {currentStrokeWidth}px
              </span>
            </div>

            {/* Width Presets */}
            <div className="grid grid-cols-4 gap-1.5 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-zinc-700/60">
              {strokeWidthPresets.map(({ label, width, heightClass }) => {
                const isActive = currentStrokeWidth === width;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleWidthChange(width)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-[#FF5A36] text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] uppercase">{label}</span>
                    <div className={`w-4 ${heightClass} rounded-full ${isActive ? 'bg-white' : 'bg-gray-400 dark:bg-gray-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Slider & Stepper */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleWidthChange(currentStrokeWidth - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
                title="Decrease stroke width"
              >
                <Minus size={12} />
              </button>

              <input
                type="range"
                min="1"
                max="30"
                value={currentStrokeWidth}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="flex-1 accent-[#FF5A36] h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleWidthChange(currentStrokeWidth + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
                title="Increase stroke width"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Stroke Style: Solid, Dashed, Dotted */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
                Stroke Style
              </label>
              <div className="grid grid-cols-3 gap-1 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-zinc-700/60">
                {strokeStyles.map(({ id, label }) => {
                  const isActive = currentStrokeStyle === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleStrokeStyleChange(id)}
                      className={`py-1 text-xs font-medium rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-[#FF5A36] text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span className="text-[10px]">{label}</span>
                      <div className="w-5 flex items-center justify-center">
                        {id === 'solid' && <div className={`w-full h-0.5 ${isActive ? 'bg-white' : 'bg-gray-500'}`} />}
                        {id === 'dashed' && <div className={`w-full border-t-2 border-dashed ${isActive ? 'border-white' : 'border-gray-500'}`} />}
                        {id === 'dotted' && <div className={`w-full border-t-2 border-dotted ${isActive ? 'border-white' : 'border-gray-500'}`} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FILL COLOR SECTION */}
        {isShapeFilled && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
                Fill Color
              </label>
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-zinc-600 shadow-xs"
                  style={{ backgroundColor: currentFill === 'transparent' ? '#fff' : currentFill }}
                />
                <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                  {currentFill || 'None'}
                </span>
              </div>
            </div>

            {/* Fill Color Grid */}
            <div className="grid grid-cols-6 gap-1.5">
              {fillColors.map((c) => {
                const isSelected = currentFill.toLowerCase() === c.toLowerCase();
                const isTransparent = c === 'transparent';
                return (
                  <button
                    key={`fill-${c}`}
                    type="button"
                    onClick={() => handleColorChange('fill', c)}
                    className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 group hover:scale-105 ${
                      isSelected 
                        ? 'ring-2 ring-offset-2 dark:ring-offset-zinc-900 ring-[#FF5A36] border-transparent scale-105' 
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500'
                    }`}
                    style={{
                      backgroundColor: isTransparent ? '#FFFFFF' : c,
                      backgroundImage: isTransparent
                        ? 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd)'
                        : 'none',
                    backgroundPosition: '0 0, 3px 3px',
                    backgroundSize: '6px 6px'
                  }}
                  title={c}
                >
                  {isSelected && (
                    <Check 
                      size={12} 
                      className={c === COLORS.white || c === '#F1F5F9' || c.startsWith('#F') || isTransparent ? 'text-gray-900' : 'text-white'} 
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Hex / Pipette Row for Fill */}
          <div className="flex items-center gap-1.5 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 dark:text-gray-500">
                HEX
              </span>
              <input
                type="text"
                value={fillHexInput}
                onChange={(e) => {
                  setFillHexInput(e.target.value);
                  handleCustomHexSubmit('fill', e.target.value);
                }}
                placeholder="#FFFFFF"
                className="w-full pl-10 pr-2 py-1 text-xs font-mono font-medium border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-colors"
              />
            </div>
            
            <button
              type="button"
              onClick={() => fillColorInputRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
              title="Pick Custom Fill Color"
            >
              <Pipette size={14} />
              <input
                ref={fillColorInputRef}
                type="color"
                value={currentFill.startsWith('#') ? currentFill : '#FFFFFF'}
                onChange={(e) => handleColorChange('fill', e.target.value)}
                className="sr-only"
              />
            </button>
          </div>
        </div>
      )}

      {/* CORNER RADIUS (RECTANGLE ONLY) */}
      {targetType === 'rectangle' && (
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
              Corner Radius
            </label>
            <span className="text-xs font-bold text-[#FF5A36] jetbrains-mono">
              {currentCornerRadius}px
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-zinc-700/60">
            {cornerRadiusPresets.map(({ label, radius }) => {
              const isActive = currentCornerRadius === radius;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleCornerRadiusChange(radius)}
                  className={`py-1 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#FF5A36] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max="40"
            value={currentCornerRadius}
            onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
            className="w-full accent-[#FF5A36] h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* OPACITY / TRANSPARENCY CONTROLS */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider jetbrains-mono">
            Opacity
          </label>
          <span className="text-xs font-bold text-[#FF5A36] jetbrains-mono">
            {currentOpacity}%
          </span>
        </div>

        {/* Quick Opacity Presets */}
        <div className="grid grid-cols-4 gap-1 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-zinc-700/60">
          {opacityPresets.map((pct) => {
            const isActive = Math.abs(currentOpacity - pct) < 3;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => handleOpacityChange(pct / 100)}
                className={`py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#FF5A36] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700'
                }`}
              >
                {pct}%
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={currentOpacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
          className="w-full accent-[#FF5A36] h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
        />
      </div>

    </div>
  </div>
  );
};
