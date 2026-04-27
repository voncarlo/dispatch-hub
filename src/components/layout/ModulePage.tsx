import { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useDsp } from "@/context/DspContext";
import { ChevronRight, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleIcon } from "@/components/ModuleIcon";

interface ModulePageProps {
  children: ReactNode;
  description?: string;
}

export function ModulePage({ children, description }: ModulePageProps) {
  const { groupCode, moduleCode } = useParams();
  const { modules, activeDsp } = useDsp();
  const group = modules.find((m) => m.code === groupCode && !m.parent_id);
  const sub = modules.find((m) => m.code === moduleCode && m.parent_id);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/dashboard" className="flex items-center gap-1 hover:text-foreground"><Home className="h-3 w-3" />{activeDsp?.code}</Link>
        <ChevronRight className="h-3 w-3" />
        <span>{group?.name}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{sub?.name}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
            <ModuleIcon name={sub?.icon} className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">{sub?.name}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>

      <Card className="surface-card">
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
