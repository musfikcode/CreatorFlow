import AuthLayout from "@/features/auth/components/auth-layout";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="
        min-h-screen w-screen
        flex flex-col items-center justify-center
        bg-[#FFF7D6]
        bg-[radial-gradient(#E6C97A_1px,transparent_1px)]
        bg-size-[24px_24px]
      "
    >
      <AuthLayout>{children}</AuthLayout>
    </div>
  );
};

export default Layout;
