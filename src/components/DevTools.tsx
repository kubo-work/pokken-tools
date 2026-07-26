import { useEffect } from "react";

export const DevTools = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      import("@locator/runtime")
        .then((mod) => mod.default())
        .catch((error) => {
          console.error(error);
        });
    }
  }, []);

  return null;
};
