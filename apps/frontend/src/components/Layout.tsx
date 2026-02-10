import { Outlet } from "react-router-dom";
import PrimarySidebar from "./PrimarySidebar";
import SecondarySidebar from "./SecondarySidebar";
import TopBar from "./TopBar";

export default function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-sfgray-5">
      {/* Sidebars with gap, full height minus padding */}
      <div className="flex gap-2 p-2 pr-0 shrink-0 h-full">
        <div className="rounded-xl overflow-hidden flex">
          <PrimarySidebar />
        </div>
        <div className="rounded-xl overflow-hidden flex">
          <SecondarySidebar />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-sfgray-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
