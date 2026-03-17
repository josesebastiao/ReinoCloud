export function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`w-full px-6 py-6 md:py-4 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 text-[10px] text-gray-400 border-t border-gray-200 bg-white shrink-0 ${className}`}
    >
      <div className="flex gap-4 font-medium">
        <a href="#" className="hover:text-blue-600">
          Privacidade
        </a>
        <a href="#" className="hover:text-blue-600">
          Termos
        </a>
      </div>
      <div className="font-medium text-center md:text-right">
        COPYRIGHT © {new Date().getFullYear()} SEBASTEC SYSTEM - TODOS OS DIREITOS RESERVADOS
      </div>
    </footer>
  );
}
