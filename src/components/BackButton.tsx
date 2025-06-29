'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { IoArrowBack } from 'react-icons/io5'

export default function BackButton() {
  const router = useRouter()

  return (
    <motion.button
      onClick={() => router.back()}
      className="fixed top-4 left-4 z-50 group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        {/* Glowing background */}
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Button container */}
        <div className="relative flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-fuchsia-500/30 shadow-lg">
          <IoArrowBack className="text-fuchsia-300 text-xl" />
          <span className="text-fuchsia-200 font-medium">Back</span>
        </div>
      </div>
    </motion.button>
  )
} 