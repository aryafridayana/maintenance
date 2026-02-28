import { useRef, useState, useEffect } from 'react';

export default function SignaturePad({ onSave, onCancel, height = 180 }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(300);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setCanvasWidth(containerRef.current.offsetWidth);
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = height * dpr;
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#101828';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setHasDrawn(false);
    }, [canvasWidth, height]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    };

    const startDraw = (e) => {
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d');
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d');
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const endDraw = (e) => {
        if (e) e.preventDefault();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        setHasDrawn(false);
    };

    const handleSave = () => {
        if (!hasDrawn) return;
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL('image/png');
        onSave(dataURL);
    };

    return (
        <div ref={containerRef}>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '10px' }}>
                Tanda tangani di area di bawah ini:
            </p>
            <div style={{
                border: '2px dashed var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                background: '#fff',
                position: 'relative',
                touchAction: 'none',
                cursor: 'crosshair',
                marginBottom: '16px',
                overflow: 'hidden',
            }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                />
                {!hasDrawn && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gray-400)', fontSize: '14px', pointerEvents: 'none',
                    }}>
                        Tanda tangan di sini
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" type="button" onClick={clearCanvas}>Hapus</button>
                {onCancel && <button className="btn btn-ghost" type="button" onClick={onCancel}>Batal</button>}
                <button className="btn btn-primary" type="button" onClick={handleSave} disabled={!hasDrawn}
                    style={{ opacity: hasDrawn ? 1 : 0.5 }}>
                    Simpan Tanda Tangan
                </button>
            </div>
        </div>
    );
}
