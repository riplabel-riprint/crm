import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <div className={cn("rounded-sm border border-stroke bg-white shadow-default", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: Props) {
  return (
    <div className={cn("border-b border-gray-200 px-5 py-4", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: Props) {
  return (
    <h3 className={cn("text-sm font-semibold text-gray-900", className)}>{children}</h3>
  );
}

export function CardBody({ children, className }: Props) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
