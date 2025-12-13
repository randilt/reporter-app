import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl md:max-w-7xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className={`px-6 pb-6 overflow-y-auto ${className || ""}`}>
          {children}
        </div>
      </div>
    </>
  );
}
