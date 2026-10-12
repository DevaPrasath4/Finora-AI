import { useEffect } from 'react';

/**
 * Attaches an IntersectionObserver to all .reveal elements
 * within the given containerRef (or document if null).
 * When an element enters the viewport it gains the .in-view class,
 * which triggers the CSS transition defined in global.css.
 */
export default function useScrollReveal(containerRef = null) {
  useEffect(() => {
    const root = containerRef?.current ?? document;
    const targets = root.querySelectorAll
      ? root.querySelectorAll('.reveal')
      : document.querySelectorAll('.reveal');

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
