import { SidebarTrigger } from "./ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="w-full h-16 bg-white border-b border-gray-200 flex items-center px-4">
      <SidebarTrigger />
    </header>
  );
};
