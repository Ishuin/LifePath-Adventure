import React from 'react';
    import './App.css';

    function App() {
      return (
        <div className="container">
          <div className="background"></div>
          <header>
            <nav>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <section id="features">
              <h1>Lifepath Adventure</h1>
              <div className="feature-cards">
                <div className="card">
                  <h2>Explore</h2>
                  <p>Venture through pixelated worlds filled with mysteries.</p>
                </div>
                <div className="card">
                  <h2>Battle</h2>
                  <p>Engage in thrilling battles with unique enemies.</p>
                </div>
                <div className="card">
                  <h2>Customize</h2>
                  <p>Personalize your character and gear for the ultimate adventure.</p>
                </div>
              </div>
              <button className="cta-button">Sign Up for Updates</button>
            </section>
          </main>
        </div>
      );
    }

    export default App;
