import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <div className={cn("rounded-xl border border-white/[0.07] bg-[#1a1a1a]", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: Props) {
  return (
    <div className={cn("border-b border-white/[0.07] px-5 py-3.5", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: Props) {
  return (
    <h3 className={cn("text-[13px] font-medium text-white/90", className)}>{children}</h3>
  );
}

export function CardBody({ children, className }: Props) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
