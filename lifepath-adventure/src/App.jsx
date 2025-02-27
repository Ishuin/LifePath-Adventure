import React, { useEffect, useRef } from 'react';
    import './App.css';

    function App() {
      const cursorTrailRef = useRef(null);

      useEffect(() => {
        // Cursor trail effect
        const handleMouseMove = (event) => {
          const trail = cursorTrailRef.current;
          if (!trail) return;

          const trailDot = document.createElement('div');
          trailDot.className = 'cursor-trail-dot';
          trailDot.style.left = `${event.clientX}px`;
          trailDot.style.top = `${event.clientY}px`;
          trail.appendChild(trailDot);

          // Remove dots after a delay
          setTimeout(() => {
            trailDot.remove();
          }, 300);
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
      }, []);

        useEffect(() => {
          const handleScroll = () => {
            const scrollPosition = window.scrollY;

            // Animate feature cards on scroll
            document.querySelectorAll('.card').forEach(card => {
              const cardTop = card.getBoundingClientRect().top;
              const windowHeight = window.innerHeight;
              if (cardTop < windowHeight * 0.8) { // Adjust trigger point as needed
                card.classList.add('card-visible');
              }
            });
          };

          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);

      return (
        <div className="container">
          <div className="background"></div>
          <div className="cursor-trail" ref={cursorTrailRef}></div>
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
              <p>Lifepath Adventure is a pixelated sci-fi RPG that combines exploration, strategic combat, and deep character customization.  Unravel the mysteries of a lost civilization and shape your own destiny.</p>
            </section>
          </main>
          <footer>
            <p>&copy; 2024 Lifepath Adventure. All rights reserved.</p>
          </footer>
        </div>
      );
    }

    export default App;
