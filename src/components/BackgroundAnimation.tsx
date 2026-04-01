import React, { useEffect, useRef, useState } from 'react';

const icons = [
  "https://img.icons8.com/color/96/000000/netflix.png",
  "https://img.icons8.com/color/96/000000/spotify.png",
  "https://img.icons8.com/color/96/000000/instagram-new.png",
  "https://img.icons8.com/color/96/000000/paypal.png",
  "https://img.icons8.com/color/96/000000/linkedin.png",
  "https://img.icons8.com/color/96/000000/amazon.png",
  "https://img.icons8.com/color/96/000000/google-drive.png",
  "https://img.icons8.com/color/96/000000/slack-new.png",
  "https://img.icons8.com/color/96/000000/discord-logo.png",
  "https://img.icons8.com/color/96/000000/youtube-play.png",
  "https://img.icons8.com/color/96/000000/notion.png",
  "https://img.icons8.com/ios-filled/96/ffffff/mac-os.png"
];

const heroIcons = [
  "https://img.icons8.com/color/96/000000/spiderman-head.png",
  "https://img.icons8.com/color/96/000000/iron-man.png",
  "https://img.icons8.com/color/96/000000/batman.png",
  "https://img.icons8.com/color/96/000000/superman.png",
  "https://img.icons8.com/color/96/000000/captain-america.png",
  "https://img.icons8.com/color/96/000000/hulk.png",
  "https://img.icons8.com/color/96/000000/thor.png",
  "https://img.icons8.com/color/96/000000/black-panther.png",
  "https://img.icons8.com/color/96/000000/wonder-woman.png",
  "https://img.icons8.com/color/96/000000/deadpool.png"
];

interface BubbleData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  icon: string;
  isHero: boolean;
  targetOffsetX: number;
  targetOffsetY: number;
  currentOffsetX: number;
  currentOffsetY: number;
  velOffsetX: number;
  velOffsetY: number;
}

export default function BackgroundAnimation() {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  
  useEffect(() => {
    // Determine bubble count based on screen width
    const width = window.innerWidth;
    let totalCount = 50;
    let heroCount = 10;
    
    if (width < 768) {
        totalCount = 20;
        heroCount = 4;
    } else if (width < 1024) {
        totalCount = 35;
        heroCount = 7;
    }

    const appCount = totalCount - heroCount;

    const initialBubbles: BubbleData[] = [];
    
    const createBubble = (id: number, isHero: boolean) => {
        const size = isHero ? 45 + Math.random() * 25 : 30 + Math.random() * 30; // Reduced scales 
        
        let x = 0, y = 0;
        let isSafe = false;
        while (!isSafe) {
            x = Math.random() * (window.innerWidth - size);
            y = Math.random() * (window.innerHeight - size);
            
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const safeRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
            
            if (distFromCenter < safeRadius && Math.random() > 0.15) {
                // 85% chance to push bubbles outside the central UI safe zone initially
                continue;
            }
            isSafe = true;
        }

        return {
            id,
            x,
            y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size,
            icon: isHero ? heroIcons[id % heroIcons.length] : icons[id % icons.length],
            isHero,
            targetOffsetX: 0,
            targetOffsetY: 0,
            currentOffsetX: 0,
            currentOffsetY: 0,
            velOffsetX: 0,
            velOffsetY: 0
        };
    };

    // Generate Hero Bubbles
    for (let i = 0; i < heroCount; i++) {
        initialBubbles.push(createBubble(i, true));
    }

    // Generate App Bubbles
    for (let i = 0; i < appCount; i++) {
        initialBubbles.push(createBubble(heroCount + i, false));
    }

    // Shuffle the bubbles so heroes are spread out
    initialBubbles.sort(() => Math.random() - 0.5);
    setBubbles(initialBubbles);

    const updateMousePos = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    // Smooth reset when mouse leaves
    const handleMouseLeave = () => {
        mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', updateMousePos);
    window.addEventListener('mouseleave', handleMouseLeave);

    const repulsionRadius = 180;
    const repulsionForce = 6;
    const spring = 0.05; // Spring force for bounce effect
    const friction = 0.85; // Friction to dampen the bounce

    let animationFrameId: number;
    let currentBubbles = [...initialBubbles];

    const animate = () => {
        currentBubbles.forEach((b, i) => {
            // Update base floating position
            b.x += b.vx;
            b.y += b.vy;

            // Boundary collision
            if (b.x <= 0) {
                b.x = 0;
                b.vx *= -1;
            } else if (b.x >= window.innerWidth - b.size) {
                b.x = window.innerWidth - b.size;
                b.vx *= -1;
            }

            if (b.y <= 0) {
                b.y = 0;
                b.vy *= -1;
            } else if (b.y >= window.innerHeight - b.size) {
                b.y = window.innerHeight - b.size;
                b.vy *= -1;
            }

            // Safe zone continuous repulsion (keeps bubbles mostly away from dead center)
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const cdist = Math.sqrt((b.x - cx)**2 + (b.y - cy)**2);
            const centerSafeRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
            
            if (cdist < centerSafeRadius) {
                b.vx += ((b.x - cx) / cdist) * 0.02;
                b.vy += ((b.y - cy) / cdist) * 0.02;
            }

            // Enforce max velocity to avoid them flying off too fast
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (speed > 1.0) {
                b.vx = (b.vx / speed) * 1.0;
                b.vy = (b.vy / speed) * 1.0;
            }

            // Mouse Repulsion logic
            const dx = (b.x + b.size / 2) - mouseRef.current.x;
            const dy = (b.y + b.size / 2) - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < repulsionRadius && mouseRef.current.x !== -1000) {
                const force = (repulsionRadius - dist) / repulsionRadius;
                b.targetOffsetX = (dx / Math.max(dist, 1)) * force * repulsionForce * 20;
                b.targetOffsetY = (dy / Math.max(dist, 1)) * force * repulsionForce * 20;
            } else {
                b.targetOffsetX = 0;
                b.targetOffsetY = 0;
            }

            // Spring physics for bounce effect
            b.velOffsetX += (b.targetOffsetX - b.currentOffsetX) * spring;
            b.velOffsetY += (b.targetOffsetY - b.currentOffsetY) * spring;
            
            b.velOffsetX *= friction;
            b.velOffsetY *= friction;

            b.currentOffsetX += b.velOffsetX;
            b.currentOffsetY += b.velOffsetY;

            // Apply direct DOM transforms to avoid React state re-renders
            const el = bubbleRefs.current[i];
            if (el) {
                el.style.transform = `translate(${b.x + b.currentOffsetX}px, ${b.y + b.currentOffsetY}px)`;
            }
        });

        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('mousemove', updateMousePos);
        window.removeEventListener('mouseleave', handleMouseLeave);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div 
        ref={containerRef} 
        className="fixed top-0 left-0 w-[100vw] h-[100vh] overflow-hidden pointer-events-none z-0 bg-[#0a0a0f] pointer-events-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,20,120,0.1)_0%,rgba(0,0,0,0.6)_100%)] z-0" />
        
        {bubbles.map((bubble, i) => (
          <div
             key={bubble.id}
             ref={el => bubbleRefs.current[i] = el}
             className={`absolute top-0 left-0 rounded-full flex items-center justify-center p-[2px] transition-opacity duration-300 pointer-events-none will-change-transform ${
                 bubble.isHero 
                  ? 'bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-white/5 border border-purple-400/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
             }`}
             style={{
               width: bubble.size,
               height: bubble.size,
               opacity: 0.5, // Reduced intensity globally 
               zIndex: 0
             }}
          >
              <div className={`w-full h-full rounded-full overflow-hidden flex justify-center items-center p-1.5 ${
                  bubble.isHero ? 'bg-black/20' : 'bg-black/30'
              }`}>
                  <img 
                     src={bubble.icon} 
                     alt="Icon" 
                     className={`w-[85%] h-[85%] blur-[0.5px] opacity-80 ${
                         bubble.isHero ? 'object-cover rounded-full' : 'object-contain'
                     }`} 
                  />
              </div>
          </div>
        ))}
      </div>
      {/* Global Blur Overlay to softly submerge bubbles */}
      <div className="fixed inset-0 backdrop-blur-[4px] z-[1] pointer-events-none" />
    </>
  );
}
