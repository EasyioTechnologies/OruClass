"use client";

import { motion } from "framer-motion";
import { CheckCircle, Users, Smartphone, Lock } from "lucide-react";

const features = [
  {
    title: "Real-time Engagement",
    description: "Keep everyone on the same page. When you change a slide or ask a question, it updates instantly for all students.",
    icon: <Users className="w-6 h-6 text-black" />,
  },
  {
    title: "Works Everywhere",
    description: "Students can join from any phone, tablet, or laptop. No apps to download, no complicated setups.",
    icon: <Smartphone className="w-6 h-6 text-black" />,
  },
  {
    title: "Private & Secure",
    description: "Your course materials and student data are kept completely private and secure at all times.",
    icon: <Lock className="w-6 h-6 text-black" />,
  },
];

export function FeaturesSection() {
  return (
    <motion.section 
      id="features" 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.1 }}
      className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 , transition: { duration: 0.2 }} }
            className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gray-50 border border-gray-100 cursor-default"
          >
            <CheckCircle className="w-6 h-6 text-black" />
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] max-w-3xl mx-auto">
            Why choose this platform? <br className="hidden md:block" />
            <span className="text-gray-400 transition-colors duration-500 hover:text-gray-600">Because it simply works.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, margin: "-10%" }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -10, scale: 1.02 , transition: { duration: 0.2 }} }
              className="group relative p-8 rounded-3xl bg-white/50 backdrop-blur-xl border border-gray-100 shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.05)] transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-gray-100">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
