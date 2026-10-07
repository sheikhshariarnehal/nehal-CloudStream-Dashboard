export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer border-t border-border/50 bg-background/50 backdrop-blur-xs mt-10">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-4">
          <div className="flex order-2 md:order-1 items-center gap-2 font-normal text-xs text-muted-foreground">
            <span>{currentYear} &copy;</span>
            <span className="font-semibold text-foreground">
              Nehal CloudStream Analytics
            </span>
            <span>&bull;</span>
            <span>Real-time Scraper & Presence Telemetry</span>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-xs text-muted-foreground">
            <a
              href="https://github.com/nehalDIU/nehal-CloudStream"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub Repository
            </a>
            <a
              href="/api/track"
              target="_blank"
              className="hover:text-primary transition-colors"
            >
              API Status
            </a>
            <a
              href="https://supabase.com/dashboard/project/zxghphjvwjmvrdjouziq"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Supabase Console
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
