import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
        onClick={onClose}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition cursor-pointer z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <motion.img 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          src={src} 
          alt="Fullscreen View" 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" 
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </AnimatePresence>
  );
};

export default ImageViewer;
