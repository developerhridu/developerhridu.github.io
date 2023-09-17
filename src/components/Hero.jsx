import { motion } from "framer-motion";
import React from "react";
import { styles } from "../styles";
import ComputersCanvas from "./canvas/Computers";
import profileImage from "../../public/desktop_pc/profile.png";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub } from 'react-icons/fa';


const Hero = () => {
  return (
    <section className="relative w-full h-screen mx-auto">
      <div
        className={`${styles.paddingX} absolute inset-0 top-[120px] max-auto max-w-7xl flex flex-row items-start gap-5`}
      >
        <div className="flex flex-col justify-center items-center mt-5">
          <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
          <div className="w-1 sm:h-80 h-40 violet-gradient" />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            I'm <span className="text-[#915eff]">Hridu</span>{" "}
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-white-100`}>
            I develop <br className="sm:block hidden" />{" "}
            web applications
          </p>
            <br/>
            <div className="flex">
                <a href="https://www.your-facebook-link.com" target="_blank" rel="noopener noreferrer" className="text-secondary mr-3">
                    <FaFacebookF className="text-2xl" />
                </a>
                <a href="https://www.your-twitter-link.com" target="_blank" rel="noopener noreferrer" className="text-secondary mr-3">
                    <FaTwitter className="text-2xl" />
                </a>
                <a href="https://www.your-linkedin-link.com" target="_blank" rel="noopener noreferrer" className="text-secondary mr-3">
                    <FaLinkedinIn className="text-2xl" />
                </a>
                <a href="https://www.your-github-link.com" target="_blank" rel="noopener noreferrer" className="text-secondary mr-3">
                    <FaGithub className="text-2xl" />
                </a>
            </div>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div></div>
              <div className="flex justify-center sm:justify-start">
                  <img src={profileImage} alt="Profile" className="w-400 h-400 rounded-full ml-0 sm:ml-52" />
              </div>
          </div>

      </div>
      {/*<ComputersCanvas />*/}





      <div className="absolute xs:bottom-2 bottom-32 w-full flex justify-center items-center">
        <a href="#about">
          <div className="w-[30px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2">
            <motion.div
              animate={{ y: [0, 24, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-3 h-3 rounded-full bg-secondary mb-1 cursor-pointer"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
