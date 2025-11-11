import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, show, onClose }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="px-4 py-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 shadow-soft text-[var(--text)]">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}