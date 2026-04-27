import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, variant = "light", showText = true, size = "md" }: BrandLogoProps) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  const text = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex items-center justify-center rounded-lg bg-gradient-brand shadow-brand", sizes[size])}>
        <Truck className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.25} />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-bold tracking-tight", text[size], variant === "dark" ? "text-brand-dark-foreground" : "text-foreground")}>
            TGO Dispatch
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operations Tool</span>
        </div>
      )}
    </div>
  );
}
