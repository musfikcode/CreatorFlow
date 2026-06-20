import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className="flex flex-col justify-center items-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 self-center font-medium"
          >
            <Image
              src="/images/appLogo/logo.webp"
              alt="Creatorflow"
              width={60}
              height={60}
            />
            <span className="text-xl">Creatorflow</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
