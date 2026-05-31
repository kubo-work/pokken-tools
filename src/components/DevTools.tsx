"use client";

import { useEffect } from "react";

export const DevTools = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@locator/runtime")
        .then((mod) => mod.default())
        .catch((error) => {
          console.error(error);
        });
    }
  }, []);

  return null;
};
