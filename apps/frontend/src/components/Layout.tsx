import { Outlet } from "react-router-dom";
import PrimarySidebar from "./PrimarySidebar";
import SecondarySidebar from "./SecondarySidebar";
import TopBar from "./TopBar";

export default function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <PrimarySidebar />
      <SecondarySidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
