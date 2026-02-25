import BottomNav from "@/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto min-h-dvh pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
