import { createPortal } from 'react-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Minus, Maximize2, Minimize2, ExternalLink, Download, FileText } from 'lucide-react';
import './ResourceWindowManager.css';

const STORAGE_KEY = 'dte-workspace';
const DEFAULT_W = 640;
const DEFAULT_H = 520;

/* ── URL helpers ─────────────────────────────────── */
function getUrls(url) {
    let embedUrl = url;
    let downloadUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
        const fileId = url.split('/d/')[1]?.split('/')[0];
        if (fileId) {
            embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        }
    } else if (url.includes('drive.google.com/drive/folders/')) {
        const folderId = url.split('/folders/')[1]?.split('?')[0];
        if (folderId) embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
    }
    return { embedUrl, downloadUrl };
}

/* ── Session helpers ─────────────────────────────── */
export function loadWorkspace() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function saveWorkspace(windows) {
    try {
        const toSave = windows.map(({ id, url, title, state, x, y, width, height }) =>
            ({ id, url, title, state: state === 'maximized' ? 'normal' : state, x, y, width, height })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { }
}

/* ── Single Window ───────────────────────────────── */
function ResourceWindow({ win, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, zIndex }) {
    const { embedUrl, downloadUrl } = getUrls(win.url);
    const isMaximized = win.state === 'maximized';
    const dragRef = useRef(null);
    const resizeRef = useRef(null);
    const windowRef = useRef(null);

    // ── Drag titlebar ──────────────────────────────
    const handleTitleMouseDown = useCallback((e) => {
        if (isMaximized) return;
        if (e.button !== 0) return;
        e.preventDefault();
        onFocus(win.id);

        const startX = e.clientX - (win.x || 20);
        const startY = e.clientY - (win.y || 40);

        const handleMouseMove = (me) => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const nx = Math.min(Math.max(0, me.clientX - startX), vw - (win.width || DEFAULT_W));
            const ny = Math.min(Math.max(0, me.clientY - startY), vh - 60);
            onMove(win.id, nx, ny);
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [win, isMaximized, onFocus, onMove]);

    // ── Resize SE corner ───────────────────────────
    const handleResizeMouseDown = useCallback((e) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = win.width || DEFAULT_W;
        const startH = win.height || DEFAULT_H;

        const onMv = (me) => {
            const nw = Math.max(320, startW + (me.clientX - startX));
            const nh = Math.max(200, startH + (me.clientY - startY));
            onResize(win.id, nw, nh);
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMv);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMv);
        document.addEventListener('mouseup', onUp);
    }, [win, isMaximized, onResize]);

    const style = isMaximized ? {} : {
        left: win.x,
        top: win.y,
        width: win.width || DEFAULT_W,
        height: win.height || DEFAULT_H,
        zIndex,
    };

    return (
        <div
            ref={windowRef}
            className={`rwm-window ${isMaximized ? 'mode-maximized' : ''}`}
            style={style}
            onMouseDown={() => onFocus(win.id)}
        >
            {/* Title Bar */}
            <div className="rwm-titlebar" onMouseDown={handleTitleMouseDown}>
                <div className="rwm-titlebar-left">
                    <FileText size={14} />
                    <span className="rwm-title">{win.title || 'Document'}</span>
                </div>
                <div className="rwm-titlebar-actions">
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="rwm-btn" title="Download" onMouseDown={e => e.stopPropagation()}>
                        <Download size={12} />
                    </a>
                    <a href={win.url} target="_blank" rel="noopener noreferrer"
                        className="rwm-btn" title="Open in new tab" onMouseDown={e => e.stopPropagation()}>
                        <ExternalLink size={12} />
                    </a>
                    <button className="rwm-btn minimize" title="Minimize"
                        onMouseDown={e => e.stopPropagation()} onClick={() => onMinimize(win.id)}>
                        <Minus size={12} />
                    </button>
                    <button className="rwm-btn maximize" title={isMaximized ? 'Restore' : 'Maximize'}
                        onMouseDown={e => e.stopPropagation()} onClick={() => onMaximize(win.id)}>
                        {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    </button>
                    <button className="rwm-btn close" title="Close"
                        onMouseDown={e => e.stopPropagation()} onClick={() => onClose(win.id)}>
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Iframe */}
            <div className="rwm-body">
                <iframe src={embedUrl} title={win.title || 'Document'} allow="autoplay" frameBorder="0" />
            </div>

            {/* Resize handle */}
            {!isMaximized && (
                <div className="rwm-resize" onMouseDown={handleResizeMouseDown} />
            )}
        </div>
    );
}

/* ── Manager (exported) ──────────────────────────── */
export default function ResourceWindowManager({ windows, onClose, onMinimize, onMaximize, onFocus, onMove, onResize }) {
    const visible = windows.filter(w => w.state !== 'minimized');
    const minimized = windows.filter(w => w.state === 'minimized');

    if (windows.length === 0) return null;

    return createPortal(
        <>
            {/* Floating windows stage — pointer-events: none, only windows get events */}
            <div className="rwm-stage">
                {visible.map((win, idx) => (
                    <ResourceWindow
                        key={win.id}
                        win={win}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        onMaximize={onMaximize}
                        onFocus={onFocus}
                        onMove={onMove}
                        onResize={onResize}
                        zIndex={4010 + (win.zOrder || idx)}
                    />
                ))}
            </div>

            {/* Minimized Taskbar */}
            {minimized.length > 0 && (
                <div className="rwm-taskbar">
                    {minimized.map(win => (
                        <div key={win.id} className="rwm-pill"
                            onClick={() => { onFocus(win.id); onMinimize(win.id, 'restore'); }} title={win.title}>
                            <FileText size={11} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {win.title || 'Document'}
                            </span>
                            <span className="rwm-pill-close"
                                onClick={e => { e.stopPropagation(); onClose(win.id); }}>
                                <X size={10} />
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>,
        document.body
    );
}
