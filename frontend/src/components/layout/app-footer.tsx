'use client';

const footerText = process.env.NEXT_PUBLIC_APP_FOOTER_TEXT || 'User Management Platform';
const footerVersion = process.env.NEXT_PUBLIC_APP_FOOTER_VERSION || '';
const footerRightText = process.env.NEXT_PUBLIC_APP_FOOTER_RIGHT_TEXT || '';

export function AppFooter() {
  return (
    <footer className="border-t bg-[hsl(var(--footer-background))] px-4 py-3 text-[hsl(var(--footer-foreground))] sm:px-6">
      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{footerText}</span>
          {footerVersion && <span className="text-[hsl(var(--footer-foreground))]/70">v{footerVersion}</span>}
        </div>
        {footerRightText && <span className="text-[hsl(var(--footer-foreground))]/70">{footerRightText}</span>}
      </div>
    </footer>
  );
}
