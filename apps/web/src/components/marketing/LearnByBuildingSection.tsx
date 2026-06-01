"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

const carouselImages = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2787&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2940&auto=format&fit=crop"
];

export function LearnByBuildingSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.1 }}
      className="h-screen w-full snap-start relative flex flex-col md:flex-row items-center justify-center overflow-hidden bg-[#fafafa]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full flex flex-col md:flex-row items-center gap-12">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="md:w-1/2 space-y-6"
        >
          <motion.div 
            whileHover={{ scale: 1.05 , transition: { duration: 0.2 }} }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm cursor-default"
          >
            <BookOpen className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-medium text-gray-900">Active Learning</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            Learn by <br />
            <span className="text-gray-400">Doing.</span>
          </h2>
          
          <p className="text-lg text-gray-600 max-w-md leading-relaxed">
            Move past passive video lectures. Our platform encourages students to engage directly with the material, fostering a deeper understanding through practice.
          </p>
        </motion.div>

        {/* Right Carousel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="md:w-1/2 w-full mt-12 md:mt-0 relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-gray-100"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              src={carouselImages[currentIndex]}
              alt="Learning experience"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
            {carouselImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-8 bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
