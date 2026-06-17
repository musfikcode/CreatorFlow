import { AppHeader } from "@/components/app-header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 bg-background">{children}</main>
    </>
  );
};

export default Layout;
