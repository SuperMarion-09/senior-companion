import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shows an email's HTML in a sandboxed frame at desktop or phone width.
 * The frame grows to the email's full height, so the page scrolls instead of
 * the frame. Scripts never run inside (no allow-scripts), and links open in a
 * new tab so the admin page stays put.
 */
export default function EmailPreviewFrame({ html, device = 'desktop', title }) {
  const frameRef = useRef(null);
  const [height, setHeight] = useState(600);

  const srcDoc = html.replace(/<head>/i, '<head><base target="_blank">');

  // Measured on the next frame and only when it really changed, so resizing
  // the frame cannot trigger another resize in the same frame (a ResizeObserver loop).
  const measure = useCallback(() => {
    window.requestAnimationFrame(() => {
      const doc = frameRef.current?.contentDocument;
      if (!doc?.documentElement) return;
      doc.documentElement.style.overflow = 'hidden';
      const next = doc.documentElement.scrollHeight;
      setHeight((current) => (Math.abs(current - next) > 1 ? next : current));
    });
  }, []);

  // Re-measure when the email changes size (images loading, phone width).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    let observer;

    const attach = () => {
      measure();
      const body = frame.contentDocument?.body;
      if (body && typeof ResizeObserver !== 'undefined') {
        observer?.disconnect();
        observer = new ResizeObserver(measure);
        observer.observe(body);
      }
    };

    frame.addEventListener('load', attach);
    attach();
    return () => {
      frame.removeEventListener('load', attach);
      observer?.disconnect();
    };
  }, [measure, srcDoc]);

  return (
    <div className={`email-frame email-frame--${device}`}>
      <div className="email-frame__device">
        {device === 'mobile' && <div className="email-frame__notch" aria-hidden="true" />}
        <iframe
          ref={frameRef}
          title={title}
          srcDoc={srcDoc}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          style={{ height }}
          className="email-frame__iframe"
        />
      </div>
    </div>
  );
}
