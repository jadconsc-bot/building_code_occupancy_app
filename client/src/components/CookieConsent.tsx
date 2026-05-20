import { useEffect, useState } from 'react';

const CONSENT_KEY = 'cc_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = (choice: 'all' | 'necessary') => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies to improve your experience and remember your preferences. By continuing
          to use CodeComply, you accept our use of cookies.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => accept('necessary')}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Necessary Only
          </button>
          <button
            onClick={() => accept('all')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
