import { useState, useEffect } from "react";

interface FraudCheckState {
  status: "idle" | "checking" | "ok" | "fraud" | "error";
  message: string | null;
  similarity: number | null;
}

export function useFraudCheck(
  title: string,
  description: string,
  stagedImages: Array<{ file: File }>,
  uploadedImages: Array<{ url: string }>
) {
  const [state, setState] = useState<FraudCheckState>({
    status: "idle",
    message: null,
    similarity: null,
  });

  useEffect(() => {
    const hasText = title.trim().length + description.trim().length > 0;
    const hasImage = stagedImages.length > 0 || uploadedImages.length > 0;

    if (!hasText || !hasImage) {
      setState({ status: "idle", message: null, similarity: null });
      return;
    }

    setState({ status: "checking", message: null, similarity: null });

    const timer = setTimeout(async () => {
      try {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim() || "");

        if (stagedImages.length) {
          fd.append("image_file", stagedImages[0].file);
        } else if (uploadedImages.length) {
          const url = uploadedImages[0].url;
          const isAbs = /^https?:\/\//i.test(url);
          const absUrl = isAbs
            ? url
            : `${window.location.protocol}//${window.location.host}${
                url.startsWith("/") ? url : "/" + url
              }`;
          fd.append("image_url", absUrl);
        }

        fd.append("threshold", "0.25");

        const res = await fetch("/api/fraud-check", {
          method: "POST",
          body: fd,
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const sim = json?.similarity;
          setState({
            status: "fraud",
            message: json?.message || "Image does not match title/description.",
            similarity: typeof sim === "number" ? sim : null,
          });
          return;
        }

        setState({
          status: "ok",
          message: null,
          similarity: json?.similarity ?? null,
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Fraud check failed",
          similarity: null,
        });
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [title, description, stagedImages, uploadedImages]);

  return state;
}