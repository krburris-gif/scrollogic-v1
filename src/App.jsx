import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';



gsap.registerPlugin(ScrollTrigger);
const App = () => {
  const contentRef = useRef(null);
  const heroLogicRef = useRef(null);
  const colIdentityRef = useRef(null);
  const imageFrameRef = useRef(null);
  const artifactImgRef = useRef(null);
  const scannerRef = useRef(null);
  const vectorScanLayerRef = useRef(null);
  const glitchRefs = useRef([]);
  const snapTargetRefs = useRef([]);

  const animState = useRef({
    currentY: 0,
    targetY: 0,
    ease: 0.05,
    velocity: 0,
    lastY: 0,
    isScrolling: false,
    scrollTimeout: null,
    contentHeight: 0,
    windowHeight: 0,
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body {
        background-color: #F2F2F2;
        color: #000000;
        overflow-x: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
        font-family: 'Inter Tight', sans-serif;
      }
      body::-webkit-scrollbar { display: none; }

      .b-grid { border: 1px solid #000000; }
      .b-grid-b { border-bottom: 1px solid #000000; }
      .b-grid-r { border-right: 1px solid #000000; }
      .b-grid-t { border-top: 1px solid #000000; }

      .meta-text {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-family: 'JetBrains Mono', monospace;
      }

      .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: #FF3500;
        border-radius: 50%;
        animation: blink 2s infinite;
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      .glitch-target {
        position: relative;
        display: inline-block;
        transition: color 0.1s;
      }
      .glitch-active {
        color: transparent !important;
      }
      .glitch-active::before, .glitch-active::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        color: #FF3500;
        background: #F2F2F2;
      }
      .glitch-active::before {
        animation: glitch-anim-1 0.15s infinite linear alternate-reverse;
        clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
      }
      .glitch-active::after {
        animation: glitch-anim-2 0.2s infinite linear alternate-reverse;
        clip-path: polygon(0 66%, 100% 66%, 100% 100%, 0 100%);
      }
      @keyframes glitch-anim-1 {
        0% { transform: translate(0) skew(0deg); }
        20% { transform: translate(-2px, 1px) skew(2deg); }
        40% { transform: translate(2px, -1px) skew(-2deg); }
        60% { transform: translate(-1px, 2px) skew(1deg); }
        80% { transform: translate(1px, -2px) skew(-1deg); }
        100% { transform: translate(0) skew(0deg); }
      }
      @keyframes glitch-anim-2 {
        0% { transform: translate(0) skew(0deg); }
        20% { transform: translate(2px, -1px) skew(-2deg); }
        40% { transform: translate(-2px, 1px) skew(2deg); }
        60% { transform: translate(1px, -2px) skew(-1deg); }
        80% { transform: translate(-1px, 2px) skew(1deg); }
        100% { transform: translate(0) skew(0deg); }
      }
      .scanner-pulse {
        animation: pulse-glow 1s infinite alternate;
      }
      @keyframes pulse-glow {
        0% { opacity: 0.5; box-shadow: 0 0 0px #FF3500; }
        100% { opacity: 1; box-shadow: 0 0 12px #FF3500, 0 0 4px #FF3500; }
      }
      ::selection {
        background-color: #FF3500;
        color: #F2F2F2;
      }
    `;
    document.head.appendChild(style);

    const link1 = document.createElement('link');
    link1.rel = 'preconnect';
    link1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.crossOrigin = '';
    document.head.appendChild(link2);

    const link3 = document.createElement('link');
    link3.href = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;700;900&family=JetBrains+Mono:wght@700&display=swap';
    link3.rel = 'stylesheet';
    document.head.appendChild(link3);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

   useEffect(() => {
   // 1. Initialize Lenis (Pure Physics & Heavy Lerp)
    const lenis = new Lenis({
      lerp: 0.06, // EXTREME INERTIA: The lower this number, the longer it glides after you let go
      smoothWheel: true,
      wheelMultiplier: 0.7, // Adds physical resistance to the wheel/trackpad
    });
    // 2. The "Pulse on Stop" Detector & GSAP Sync
    let scrollTimeout;
    lenis.on('scroll', () => {
      ScrollTrigger.update(); // Keeps GSAP perfectly synced with Lenis

      // While scrolling: Keep scanner neutral and sharp
      if (scannerRef.current) {
        scannerRef.current.style.backgroundColor = '#000000'; // Default color
        scannerRef.current.style.boxShadow = 'none';
        scannerRef.current.style.transition = 'none'; // Instant response
      }

      clearTimeout(scrollTimeout);

      // When stopped for 150ms: Flare the accent color
      scrollTimeout = setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.style.backgroundColor = '#FF3500';
          scannerRef.current.style.boxShadow = '0 0 15px #FF3500, 0 0 30px #FF3500';
          scannerRef.current.style.transition = 'all 0.3s ease';
        }
      }, 150);
    });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // 3. Hero Parallax (True Pin & Release)
    gsap.to(heroLogicRef.current, {
      y: () => window.innerHeight * 0.5,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: () => `+=${window.innerHeight * 0.5}`,
        scrub: true,
        invalidateOnRefresh: true,
      }
    });

  // 4. Selective Kinetic Snapping (The "Thin Magnet" Entry Snap)
    const snapSections = gsap.utils.toArray(".kinetic-section");
    snapSections.forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: "top top", 
        // THE FIX: The magnet turns off after 200px. 
        // This lets you scroll freely through the rest of the tall section and into the footer!
        end: "+=200", 
        snap: {
          snapTo: 0, 
          duration: { min: 0.2, max: 0.4 }, 
          ease: "back.out(1.1)", 
          delay: 0.1, 
        }
      });
    });

    // 5. Identity Column Parallax (True 0.8x Lag)
    gsap.fromTo(colIdentityRef.current,
      { y: 0 },
      {
        y: () => window.innerHeight * 0.25, // 25vh push-down creates the heavy anchor drag
        ease: "none",
        scrollTrigger: {
          trigger: "#manifesto-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
          invalidateOnRefresh: true,
        }
      }
    );

    // 6. Image Frame (LOCKED FRAME)
    // We have completely removed the dynamic, velocity-based mask that caused the frame to "bounce."
    // We now set a permanent, static mask that defines the edges of the frame once on load.
    // The frame container itself is locked to 1x speed, perfectly matching the text next to it.
    gsap.set(imageFrameRef.current, { clipPath: "inset(2% 0% 2% 0%)" }); 
    
    // 7. Inner Image Parallax (High-Intensity 1.25x Speed)
    // To make the parallax highly noticeable (1.25x), we need an aggressive slide.
    // Over the course of the section, we force the image to slide upward by an extra 50% of the screen height.
    gsap.fromTo(artifactImgRef.current,
      // Starts pushed down inside the frame by 25% of the window height
      { y: () => window.innerHeight * 0.25 }, 
      { 
        // Slides upward to be pushed up 25% of the window height over the scroll distance
        y: () => -window.innerHeight * 0.25, 
        ease: "none",
        scrollTrigger: {
          trigger: "#manifesto-section", // The unified anchor
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true, // Essential so the math scales on window resize
        }
      }
    );
    // 8. Vector Scan Layer (Horizontal Movement)
    gsap.to(vectorScanLayerRef.current, {
      x: -window.innerWidth,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1, 
      }
    });

    // 9. Global Scanner Line (Top to bottom)
    gsap.to(scannerRef.current, {
      top: "100%", 
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      }
    });

    // 10. Glitch Target Activation
    glitchRefs.current.forEach((el) => {
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: "top center", 
        end: "bottom center",
        toggleClass: "glitch-active",
      });
    });

    // 11. Forward-Thinking Cleanup Phase
    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.ticker.remove(lenis.raf);
      clearTimeout(scrollTimeout); // Prevents the pulse timer from leaking into other pages
    };
  }, []);
const addGlitchRef = (el) => {
    if (el && !glitchRefs.current.includes(el)) {
      glitchRefs.current.push(el);
    }
  };

  const addSnapRef = (el) => {
    if (el && !snapTargetRefs.current.includes(el)) {
      snapTargetRefs.current.push(el);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter Tight', sans-serif", backgroundColor: '#F2F2F2', color: '#000000' }}>
      

<div style={{ width: '100%', position: 'relative' }}>
        <div
          ref={vectorScanLayerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '300vw',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
            willChange: 'transform',
            color: '#000000',
            opacity: 0.15,
          }}
        >
          <svg viewBox="0 0 3000 1000" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
            <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
              <path d="M50,500 Q150,300 250,500 T450,500 T650,500 T850,500 T1050,500 T1250,500 T1450,500 T1650,500 T1850,500 T2050,500 T2250,500 T2450,500 T2650,500 T2850,500" />
              <path d="M100,200 L180,350 L120,400 L200,550 L140,650 L220,750 L160,850 L240,900" />
              <path d="M300,150 L380,250 L340,380 L420,450 L360,600 L440,700 L380,800 L460,880" />
              <path d="M500,100 L600,200 L520,350 L620,450 L540,600 L640,700 L560,850 L660,920" />
              <path d="M700,180 L780,300 L720,420 L800,550 L740,680 L820,780 L760,900 L840,950" />
              <path d="M900,120 L1000,280 L920,400 L1020,520 L940,650 L1040,750 L960,880 L1060,940" />
              <path d="M1100,220 L1200,320 L1120,450 L1220,580 L1140,700 L1240,800 L1160,920 L1260,980" />
              <path d="M1300,80 L1380,240 L1320,380 L1400,500 L1340,640 L1420,720 L1360,860 L1440,960" />
              <path d="M1500,160 L1600,300 L1520,420 L1620,560 L1540,680 L1640,780 L1560,900 L1660,940" />
              <path d="M1700,250 L1780,150 L1720,350 L1800,250 L1740,500 L1820,400 L1760,650 L1840,550 L1780,800 L1860,700 L1800,950 L1880,850" />
              <path d="M1900,100 L2020,200 L1940,350 L2060,450 L1980,600 L2100,700 L2020,850 L2140,920" />
              <path d="M2100,300 L2200,180 L2140,400 L2240,280 L2180,520 L2280,400 L2220,640 L2320,520 L2260,760 L2360,640 L2300,880 L2400,760" />
              <path d="M2300,120 L2420,280 L2340,420 L2460,560 L2380,700 L2500,800 L2420,940 L2540,980" />
              <path d="M2500,200 L2620,320 L2540,480 L2660,600 L2580,740 L2700,820 L2620,960 L2740,920" />
              <path d="M2700,80 L2800,240 L2720,400 L2820,520 L2740,680 L2840,760 L2760,920 L2860,980 L2780,880 L2880,940" />
              <path d="M100,500 L200,480 L150,550 L250,530 L200,600 L300,580 L250,650 L350,630 L300,700 L400,680 L350,750 L450,730" />
              <path d="M500,400 L650,380 L550,480 L700,460 L600,560 L750,540 L650,640 L800,620 L700,720 L850,700 L750,800 L900,780" />
              <path d="M1000,350 L1200,330 L1050,480 L1250,460 L1100,610 L1300,590 L1150,740 L1350,720 L1200,870 L1400,850 L1250,1000 L1450,980" />
              <path d="M1600,450 L1800,420 L1650,580 L1850,550 L1700,710 L1900,680 L1750,840 L1950,810 L1800,970 L2000,940 L1850,1100 L2050,1070" />
              <path d="M2200,380 L2450,350 L2250,520 L2500,490 L2300,660 L2550,630 L2350,800 L2600,770 L2400,940 L2650,910 L2450,1080 L2700,1050" />
              <path d="M2800,420 L2950,400 L2850,500 L3000,480 L2900,580 L2950,680 L2850,780 L2900,880 L2800,980 L2850,1080" />
              <path d="M150,800 Q300,750 450,800 Q600,850 750,800 Q900,750 1050,800 Q1200,850 1350,800 Q1500,750 1650,800 Q1800,850 1950,800 Q2100,750 2250,800 Q2400,850 2550,800 Q2700,750 2850,800" />
              <path d="M80,650 L200,630 L140,720 L260,700 L200,790 L320,770 L260,860 L380,840 L320,930 L440,910 L380,1000 L500,980" />
              <path d="M600,600 L750,580 L650,700 L800,680 L700,800 L950,780 L800,920 L1050,900 L900,1040 L1150,1020 L1000,1160 L1200,1140" />
              <path d="M1400,650 L1600,620 L1450,780 L1650,750 L1500,910 L1700,880 L1550,1040 L1750,1010 L1600,1170 L1800,1140 L1650,1300 L1850,1270" />
              <path d="M2000,550 L2250,520 L2050,720 L2300,690 L2100,890 L2350,860 L2150,1060 L2400,1030 L2200,1230 L2450,1200 L2250,1400 L2500,1370" />
              <path d="M2600,620 L2800,590 L2650,770 L2850,740 L2700,920 L2900,890 L2750,1070 L2950,1040 L2800,1220 L3000,1190 L2850,1370 L2950,1350" />
              <path d="M50,350 Q200,300 350,350 Q500,400 650,350 Q800,300 950,350 Q1100,400 1250,350 Q1400,300 1550,350 Q1700,400 1850,350 Q2000,300 2150,350 Q2300,400 2450,350 Q2600,300 2750,350 Q2900,400 2950,350" />
              <path d="M120,180 L280,220 L180,340 L340,380 L240,500 L400,540 L300,660 L460,700 L360,820 L520,860 L420,980 L580,1020" />
              <path d="M700,250 L900,290 L760,430 L960,470 L820,610 L1020,650 L880,790 L1080,830 L940,970 L1140,1010 L1000,1150 L1200,1190" />
              <path d="M1350,180 L1600,230 L1420,390 L1670,440 L1490,600 L1740,650 L1560,810 L1810,860 L1630,1020 L1880,1070 L1700,1230 L1950,1280" />
              <path d="M2100,280 L2350,320 L2170,480 L2420,520 L2240,680 L2490,720 L2310,880 L2560,920 L2380,1080 L2630,1120 L2450,1280 L2700,1320" />
              <path d="M2800,200 L2950,240 L2850,360 L3000,400 L2900,520 L2950,640 L2850,760 L2900,880 L2800,1000 L2850,1120 L2750,1240 L2800,1360" />
            </g>
          </svg>
        </div>

        <div
          ref={scannerRef}
          style={{
            position: 'fixed',
            left: 0,
            width: '100%',
            height: '1px',
            backgroundColor: '#FF3500',
            zIndex: 100,
            pointerEvents: 'none',
            willChange: 'transform, opacity, box-shadow',
            opacity: 0.8,
            transition: 'opacity 0.3s ease',
          }}
        ></div>

        <main
          ref={contentRef}
          style={{
            width: '100%',
            willChange: 'transform',
            pointerEvents: 'auto',
            backgroundColor: '#F2F2F2',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header className="b-grid-b" style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            position: 'fixed',
            top: 0,
            width: '100%',
            backgroundColor: '#F2F2F2',
            zIndex: 50,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.04em', textTransform: 'lowercase' }}>scrollogic</span>
              <span style={{ color: '#FF3500', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1, position: 'relative', top: '-8px' }}>®</span>
            </div>
            <nav style={{ display: 'flex', gap: '32px' }}>
              <a href="#" className="meta-text" style={{ color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FF3500'}
                onMouseLeave={e => e.currentTarget.style.color = '#000'}>
                Work
                <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1 L13 13 M13 1 L13 13 L1 13" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              </a>
              <a href="#" className="meta-text" style={{ color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FF3500'}
                onMouseLeave={e => e.currentTarget.style.color = '#000'}>
                Studio
                <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1 L13 13 M13 1 L13 13 L1 13" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              </a>
            </nav>
          </header>

          <div style={{ height: '64px', width: '100%', flexShrink: 0 }}></div>

          <section id="hero" className="b-grid-b" style={{
            position: 'relative',
            height: '110vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 24px',
            overflow: 'hidden',
            backgroundColor: '#F2F2F2',
            zIndex: 10,
          }}>
            <div
              ref={heroLogicRef}
              style={{
                position: 'absolute',
                width: '100%',
                left: '24px',
                top: '25vh',
                zIndex: 0,
                willChange: 'transform',
              }}
            >
              <h1 style={{
                fontSize: 'clamp(6rem, 14vw, 18rem)',
                fontWeight: 900,
                lineHeight: 0.8,
                letterSpacing: '-0.06em',
                color: '#000000',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Logic In
              </h1>
            </div>

            <div style={{
              position: 'absolute',
              width: '100%',
              left: '24px',
              top: '25vh',
              marginTop: 'clamp(5.5rem, 11.5vw, 14rem)',
              zIndex: 10,
              backgroundColor: '#F2F2F2',
              willChange: 'transform',
              paddingBottom: '128px',
            }}>
              <h1 style={{
                fontSize: 'clamp(6rem, 14vw, 18rem)',
                fontWeight: 900,
                lineHeight: 0.8,
                letterSpacing: '-0.06em',
                color: '#000000',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Motion.
              </h1>
            </div>
          </section>

         <section
            id="manifesto-section" 
            ref={el => addSnapRef(el)} 
            className="kinetic-section"
            style={{
              display: 'flex',
              flexDirection: 'row', 
              minHeight: '100vh',
              width: '100%',
              backgroundColor: '#F2F2F2',
              zIndex: 20,
              position: 'relative',
            }}
          >
            {/* COLUMN 1: IDENTITY */}
            <div
              ref={colIdentityRef}
              className="b-grid-r"
              style={{
                flex: 1, 
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '60vh',
                backgroundColor: '#F2F2F2',
                position: 'relative',
                zIndex: 30,
              }}
            >
              <div className="meta-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '64px' }}>
                <span>Identity</span>
                <span>01</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '48px', marginTop: 'auto', paddingBottom: '48px', listStyle: 'none', margin: 0, padding: 0 }}>
                <li style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span ref={addGlitchRef} className="meta-text glitch-target" data-text="Location" style={{ color: '#FF3500' }}>Location</span>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Global / Remote</span>
                </li>
                <li style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span ref={addGlitchRef} className="meta-text glitch-target" data-text="Focus" style={{ color: '#FF3500' }}>Focus</span>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Digital Products,<br />Landing Pages</span>
                </li>
                <li style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span ref={addGlitchRef} className="meta-text glitch-target" data-text="Status" style={{ color: '#FF3500', display: 'flex', alignItems: 'center', gap: '12px' }}>Status <span className="status-dot"></span></span>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Accepting Projects</span>
                </li>
              </ul>
            </div>

            {/* COLUMN 2 & 3 WRAPPER */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'row', backgroundColor: '#F2F2F2' }}>
              
              {/* COLUMN 2: MANIFESTO */}
              <div className="b-grid-r" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
                <div className="meta-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '64px' }}>
                  <span>Manifesto Preview</span>
                  <span>02</span>
                </div>
                <p style={{ fontWeight: 500, fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)', lineHeight: 1.15, letterSpacing: '-0.02em', textAlign: 'left', marginTop: 'auto', paddingBottom: '48px', maxWidth: '90%' }}>
                  Scrollogic is a boutique design studio. We specialize in one-page websites and landing pages that demand attention, drive conversions, and make bold first impressions.<br /><br />
                  We believe the single page is the purest form of digital storytelling.
                </p>
              </div>

              {/* COLUMN 3: IMAGE */}
              <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '80vh' }}>
                <div
                  ref={imageFrameRef}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    marginTop: 'auto',
                    overflow: 'hidden',
                    backgroundColor: '#000000',
                  }}
                >
                  <img
                    ref={artifactImgRef}
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
                    alt="Structure"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'grayscale(100%)',
                      opacity: 0.85,
                      transform: 'scale(1.3)',
                      transformOrigin: 'center',
                    }}
                  />
                  <svg style={{ position: 'absolute', top: '15%', right: '10%', width: '96px', height: '96px', stroke: 'white', opacity: 0.9, fill: 'none', zIndex: 10 }} viewBox="0 0 100 100">
                    <path d="M10 50 Q 25 30 50 50 Q 75 70 90 50" strokeWidth="2" />
                    <path d="M20 60 Q 35 45 55 60 Q 70 75 80 60" strokeWidth="1.5" />
                  </svg>
                  <div className="meta-text" style={{ position: 'absolute', bottom: '24px', left: '24px', color: 'white', backgroundColor: '#000000', padding: '4px 8px', zIndex: 10 }}>
                    Fig. 00 — Structure
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            ref={el => addSnapRef(el)}
            className="b-grid-t kinetic-section"
            style={{
              height: '150vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              zIndex: 10,
              backgroundColor: '#F2F2F2',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '56rem', padding: '0 24px' }}>
              <div
                ref={addGlitchRef}
                className="meta-text glitch-target"
                data-text="System Architecture"
                style={{ color: '#FF3500', marginBottom: '48px', display: 'inline-block' }}
              >System Architecture</div>
              <h2 style={{
                fontSize: 'clamp(4rem, 8vw, 8rem)',
                fontWeight: 900,
                lineHeight: 0.85,
                letterSpacing: '-0.06em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                No Clutter.<br />
                No Distraction.<br />
                Just Impact.
              </h2>
            </div>
          </section>

          <footer className="b-grid-t" style={{
            height: '256px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px',
            backgroundColor: '#000000',
            color: '#F2F2F2',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.04em', textTransform: 'lowercase' }}>
                scrollogic<span style={{ color: '#FF3500', fontSize: '0.875rem', position: 'relative', top: '-8px' }}>®</span>
              </span>
              <div style={{ display: 'flex', gap: '32px' }}>
                <a href="#" className="meta-text" style={{ color: '#F2F2F2', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FF3500'}
                  onMouseLeave={e => e.currentTarget.style.color = '#F2F2F2'}>Twitter</a>
                <a href="#" className="meta-text" style={{ color: '#F2F2F2', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FF3500'}
                  onMouseLeave={e => e.currentTarget.style.color = '#F2F2F2'}>Instagram</a>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span className="meta-text" style={{ color: '#6b7280' }}>All rights reserved. System Operational.</span>
              <span style={{ fontSize: '3.75rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>2026</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;