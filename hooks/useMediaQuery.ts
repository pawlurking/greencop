import { useState, useEffect } from "react";

export function useMediaQuery (query: string):boolean {

  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    if(mediaQuery.matches !== matches) {
      setMatches(mediaQuery.matches);
    }

    const listener = () => setMatches(mediaQuery.matches);
    mediaQuery.addListener(listener);

    return () => mediaQuery.removeListener(listener);

  }, [matches, query]);

  return matches;

}