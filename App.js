import React from 'react';

    function App() {
      return (
        <div className="container">
          <div className="content">
            <h1 className="title">Lifepath Adventure</h1>
            <div className="feature-cards">
              <div className="card">
                <h2 className="card-title">Explore</h2>
                <p className="card-description">Venture through pixelated worlds filled with mysteries.</p>
              </div>
              <div className="card">
                <h2 className="card-title">Battle</h2>
                <p className="card-description">Engage in thrilling battles with unique enemies.</p>
              </div>
              <div className="card">
                <h2 className="card-title">Customize</h2>
                <p className="card-description">Personalize your character and gear for the ultimate adventure.</p>
              </div>
            </div>
            <button className="cta-button">Sign Up for Updates</button>
          </div>
        </div>
      );
    }

    export default App;
