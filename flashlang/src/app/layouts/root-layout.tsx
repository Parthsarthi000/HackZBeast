import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, CreditCard, FileText, User, Menu, Zap } from "lucide-react";
import { useState } from "react";

export function RootLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Zap },
    { path: "/flashcards", label: "Flashcards", icon: CreditCard },
    { path: "/stories", label: "Stories", icon: BookOpen },
    { path: "/quizzes", label: "Quizzes", icon: FileText },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] p-2 rounded-lg">
                <Zap className="size-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">FlashLan</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="size-6 text-gray-600" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
