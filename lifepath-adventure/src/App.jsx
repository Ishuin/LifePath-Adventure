import React, { useEffect, useRef } from 'react';
    import './App.css';

    function App() {
      const canvasRef = useRef(null);

      useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        let points = [];
        const numPoints = 30; // Number of points
        const connectionDistance = 150; // Distance within which points connect

        // Create points with random positions and velocities
        for (let i = 0; i < numPoints; i++) {
          points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
          });
        }

        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event) => {
          mouseX = event.clientX;
          mouseY = event.clientY;
        };

        document.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
          ctx.clearRect(0, 0, width, height); // Clear canvas

          // Update point positions
          for (let i = 0; i < points.length; i++) {
            points[i].x += points[i].vx;
            points[i].y += points[i].vy;

            // Wrap around edges
            if (points[i].x < 0) points[i].x = width;
            if (points[i].x > width) points[i].x = 0;
            if (points[i].y < 0) points[i].y = height;
            if (points[i].y > height) points[i].y = 0;

            // Magnetic attraction to mouse
            const dx = points[i].x - mouseX;
            const dy = points[i].y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200) { // Attraction radius
              const force = (200 - dist) / 200; // Stronger attraction closer
              points[i].x -= dx * force * 0.05; // Adjust attraction strength
              points[i].y -= dy * force * 0.05;
            }
          }

          // Draw lines between points
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)'; // Green lines, semi-transparent
          for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
              const dx = points[i].x - points[j].x;
              const dy = points[i].y - points[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < connectionDistance) {
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
              }
            }
          }
          ctx.stroke();

          requestAnimationFrame(animate); // Call animate() again for next frame
        };

        animate(); // Start the animation

        const handleResize = () => {
          width = window.innerWidth;
          height = window.innerHeight;
          canvas.width = width;
          canvas.height = height;
        };
        window.addEventListener('resize', handleResize);

        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', handleResize);
        };
      }, []);

      return (
        <div className="container">
          <div className="background">
            <canvas ref={canvasRef}></canvas>
          </div>
          <header>
            <nav className="navbar">
              <div className="logo">Lifepath Adventure</div>
              <ul className="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <section id="hero">
              <h1>Embark on Your Lifepath</h1>
              <p className="hero-subtitle">A pixelated sci-fi RPG where your choices matter.</p>
              <button className="cta-button">Explore Now</button>
            </section>
            <section id="features">
              <h2>Key Features</h2>
              <div className="feature-cards">
                <div className="card">
                  <img src="https://via.placeholder.com/150/4CAF50/FFFFFF?text=Explore" alt="Explore" />
                  <h3>Explore</h3>
                  <p>Discover vast and diverse worlds.</p>
                </div>
                <div className="card">
                  <img src="https://via.placeholder.com/150/4CAF50/FFFFFF?text=Battle" alt="Battle" />
                  <h3>Battle</h3>
                  <p>Engage in strategic combat.</p>
                </div>
                <div className="card">
                  <img src="https://via.placeholder.com/150/4CAF50/FFFFFF?text=Customize" alt="Customize" />
                  <h3>Customize</h3>
                  <p>Forge your unique character.</p>
                </div>
              </div>
            </section>
            <section id="about">
              <h2>About the Game</h2>
              <p>Lifepath Adventure is a pixelated sci-fi RPG that combines exploration, strategic combat, and deep character customization. Unravel the mysteries of a lost civilization and shape your own destiny.</p>
            </section>
          </main>
          <footer>
            <p>&copy; 2024 Lifepath Adventure. All rights reserved.</p>
          </footer>
        </div>
      );
    }

    export default App;
