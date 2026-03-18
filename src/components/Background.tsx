// components/Background.tsx
"use client"; // Critical for Next.js App Router to use hooks

import { useEffect, useRef, useCallback } from "react";

// Define the shape of a trail point
interface TrailPoint {
    x: number;
    y: number;
    timestamp: number;
}

function Background() {
    // 1. Add types to the refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseTrailRef = useRef<TrailPoint[]>([]);
    const animationFrameRef = useRef<number>();
    const lastFrameTimeRef = useRef<number>(0);

    const DOT_SIZE = 13;
    const DOT_RADIUS = 1;
    const MAX_TRAIL_LENGTH = 60;
    const TRAIL_DURATION = 2000;
    const TARGET_FPS = 30;

    // Inside Background function
    const drawDots = useCallback(() => { // Fixed: added ( before the arrow function
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const now = Date.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        mouseTrailRef.current = mouseTrailRef.current.filter(
            pos => now - pos.timestamp < TRAIL_DURATION
        );

        ctx.fillStyle = '#7a8089'; // Changed to slate-300 for subtler dots
        ctx.globalCompositeOperation = 'source-over';

        for (let x = 0; x < canvas.width; x += DOT_SIZE) {
            for (let y = 0; y < canvas.height; y += DOT_SIZE) {
                let shouldDraw = false;
                let maxOpacity = 0;

                for (const pos of mouseTrailRef.current) {
                    const age = now - pos.timestamp;
                    const opacity = Math.max(0, 1 - age / TRAIL_DURATION);
                    const radius = 150 * opacity;

                    const distance = Math.sqrt(
                        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                    );

                    if (distance < radius) {
                        const distanceOpacity = Math.max(0, 1 - (distance / radius) * 0.3);
                        const combinedOpacity = opacity * distanceOpacity * 0.3;
                        maxOpacity = Math.max(maxOpacity, combinedOpacity);
                        shouldDraw = true;
                    }
                }

                if (shouldDraw) {
                    ctx.globalAlpha = maxOpacity;
                    ctx.beginPath();
                    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }, []);

    const animate = useCallback((currentTime: number) => {
        if (currentTime - lastFrameTimeRef.current >= 1000 / TARGET_FPS) {
            drawDots();
            lastFrameTimeRef.current = currentTime;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [drawDots]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateCanvasSize();

        const handleMouseMove = (e: MouseEvent) => { // 3. Add MouseEvent type
            const newPos: TrailPoint = {
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            };
            mouseTrailRef.current = [newPos, ...mouseTrailRef.current].slice(0, MAX_TRAIL_LENGTH);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        window.addEventListener('resize', updateCanvasSize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', updateCanvasSize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [animate]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0" // 4. Changed 'absolute' to 'fixed' for scrolling
            style={{ opacity: 1 }}
        />
    );
}

export default Background;