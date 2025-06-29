"use client";

import { useEffect } from "react";

export default function HideSpinnerOnLoad() {
  useEffect(() => {
    window.addEventListener(
      "load",
      function () {
        if (typeof top !== "undefined" && top) {
          top.postMessage({ hideSpinner: true }, "*");
        }
      },
      false
    );
  }, []);

  return null;
}
