import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { ResearchStep } from '@/types';
import { Button } from '@/components/ui/button';

interface ProgressStepsProps {
  steps: ResearchStep[];
  isComplete: boolean;
}

export function ProgressSteps({ steps, isComplete }: ProgressStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!steps.length) return null;

  return (
    <div className="border rounded-lg p-4 mb-4 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Research Plan</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-2 text-sm">
                <div className="mt-0.5">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : step.status === 'in_progress' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span className={step.status === 'completed' ? 'text-muted-foreground line-through' : ''}>
                  {step.title}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
