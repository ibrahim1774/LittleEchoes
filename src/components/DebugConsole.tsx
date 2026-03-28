import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  level: 'log' | 'warn' | 'error';
  message: string;
  time: string;
}

const LEVEL_COLORS = {
  log: '#333',
  warn: '#B8860B',
  error: '#D32F2F',
};

let logId = 0;

export function DebugConsole() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Only show if ?debug=1 in URL
  useEffect(() => {
    if (window.location.search.includes('debug=1')) {
      setEnabled(true);
    }
  }, []);

  // Intercept console methods
  useEffect(() => {
    if (!enabled) return;

    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    function addEntry(level: LogEntry['level'], args: unknown[]) {
      const message = args
        .map((a) => {
          if (typeof a === 'string') return a;
          try { return JSON.stringify(a, null, 0); }
          catch { return String(a); }
        })
        .join(' ');

      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setLogs((prev) => [...prev.slice(-49), { id: logId++, level, message, time }]);
    }

    console.log = (...args: unknown[]) => { origLog.apply(console, args); addEntry('log', args); };
    console.warn = (...args: unknown[]) => { origWarn.apply(console, args); addEntry('warn', args); };
    console.error = (...args: unknown[]) => { origError.apply(console, args); addEntry('error', args); };

    return () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    };
  }, [enabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  if (!enabled) return null;

  return (
    <>
      {/* Floating bug button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          zIndex: 99999,
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: logs.some((l) => l.level === 'error') ? '#D32F2F' : '#333',
          color: 'white',
          border: 'none',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        aria-label="Toggle debug console"
      >
        {open ? '✕' : '🐛'}
      </button>

      {/* Log panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 140,
            left: 8,
            right: 8,
            maxHeight: '50vh',
            zIndex: 99998,
            backgroundColor: 'rgba(0,0,0,0.92)',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#aaa', fontSize: 12, fontFamily: 'monospace' }}>Debug Console ({logs.length})</span>
            <button
              onClick={() => setLogs([])}
              style={{ background: 'none', border: '1px solid #555', borderRadius: 6, color: '#aaa', fontSize: 11, padding: '2px 8px', fontFamily: 'monospace' }}
            >
              Clear
            </button>
          </div>

          {/* Logs */}
          <div style={{ overflow: 'auto', padding: '4px 8px', flex: 1, maxHeight: 'calc(50vh - 40px)' }}>
            {logs.length === 0 ? (
              <p style={{ color: '#666', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', padding: 16 }}>
                No logs yet. Interact with the app...
              </p>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '3px 0',
                    borderBottom: '1px solid #1a1a1a',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    lineHeight: 1.4,
                    wordBreak: 'break-all',
                  }}
                >
                  <span style={{ color: '#666', marginRight: 6 }}>{entry.time}</span>
                  <span style={{ color: LEVEL_COLORS[entry.level], fontWeight: entry.level === 'error' ? 700 : 400 }}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </>
  );
}
