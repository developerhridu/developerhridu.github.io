import { BrowserRouter } from "react-router-dom";
import React from 'react'
import {
  About,
  Contact,
  Experience,
  Feedbacks,
  Hero,
  Navbar,
  StarsCanvas,
  Tech,
  Works,
} from "./components";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <>
      <BrowserRouter>
        <div className="relative z-0 bg-primary">
          <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
            <Navbar />
             <Hero />
          </div>
          <About />
          <Experience />
          <Tech />
          <Works />
          {/*<Feedbacks />*/}
          <div className="relative z-0">
            <Contact />
            <StarsCanvas />
          </div>
        </div>
      </BrowserRouter>
      <ToastContainer position="top-center" />
    </>
  );
};

export default App;
