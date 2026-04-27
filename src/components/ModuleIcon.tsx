import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface ModuleIconProps extends Omit<LucideProps, "ref"> {
  name: string | null | undefined;
  fallback?: keyof typeof Icons;
}

export function ModuleIcon({ name, fallback = "Folder", ...props }: ModuleIconProps) {
  const IconComp = (name && (Icons as any)[name]) || Icons[fallback];
  return <IconComp {...props} />;
}
