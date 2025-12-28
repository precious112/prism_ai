import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ResearchState } from '@/types';

interface StatusIndicatorProps {
  status: ResearchState['status'];
  message: string;
}

export function StatusIndicator({ status, message }: StatusIndicatorProps) {
  if (status === 'completed' || status === 'idle') return null;

  const isError = status === 'error';

  return (
    <div className={`flex items-center gap-2 text-sm mb-4 ${isError ? 'text-red-500' : 'text-muted-foreground'}`}>
      {!isError && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-4 h-4" />
        </motion.div>
      )}
      <span className={isError ? "font-bold" : "font-medium animate-pulse"}>
        {message}
      </span>
    </div>
  );
}
