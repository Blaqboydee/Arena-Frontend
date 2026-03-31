import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import type { Player } from "../types";
import type { TttMatchOver } from "./useTicTacToe";

type ShareTarget = "native" | "twitter" | "whatsapp" | "copy" | "download";

type Options = {
  matchOver: TttMatchOver;
  players:   Player[];
  myId:      string;
};

export function useShareResult({ matchOver, players, myId }: Options) {
  const cardRef                     = useRef<HTMLDivElement>(null);
  const [sharing, setSharing]       = useState<ShareTarget | null>(null);
  const [copyDone, setCopyDone]     = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const iWon     = matchOver.winnerId === myId;
  const isDraw   = matchOver.winnerId === null;
  const opponent = players.find((p) => p.id !== myId);
  const myScore  = matchOver.scores[myId] ?? 0;
  const oppScore = opponent ? (matchOver.scores[opponent.id] ?? 0) : 0;

  // ── Fallback text (used by Twitter / WhatsApp) ─────────────────────────────
  const shareText = isDraw
    ? `Drew ${myScore}-${oppScore} after ${matchOver.totalRounds} rounds on ARENA ⚡ arenagameplay.vercel.app`
    : iWon
    ? `Beat ${opponent?.name ?? "my opponent"} ${myScore}-${oppScore} in Tic Tac Toe on ARENA ⚡ arenagameplay.vercel.app`
    : `Lost to ${matchOver.winnerName} ${oppScore}-${myScore} in Tic Tac Toe on ARENA ⚡ arenagameplay.vercel.app`;

  // ── Core: render card → PNG blob ───────────────────────────────────────────
  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,        // retina quality
        cacheBust:  true,
      });
      const res  = await fetch(dataUrl);
      return await res.blob();
    } catch (err) {
      console.error("[share] image generation failed:", err);
      return null;
    }
  }, []);

  // ── Share targets ──────────────────────────────────────────────────────────

  // Native share sheet (mobile) — shares the PNG file if supported,
  // falls back to text-only if the browser can't share files.
  const shareNative = useCallback(async () => {
    setSharing("native");
    try {
      const blob = await generateImage();

      if (blob && navigator.canShare?.({ files: [new File([blob], "result.png", { type: "image/png" })] })) {
        const file = new File([blob], "arena-result.png", { type: "image/png" });
        await navigator.share({ files: [file], text: shareText });
      } else {
        // Fallback: text-only native share
        await navigator.share({ text: shareText });
      }
    } catch (err: any) {
      // AbortError = user dismissed — not a real error
      if (err?.name !== "AbortError") console.error("[share] native failed:", err);
    } finally {
      setSharing(null);
    }
  }, [generateImage, shareText]);

  // Twitter/X — image can't be injected via URL scheme, so open compose
  // with the text pre-filled. User attaches the downloaded image manually
  // if they want it (common Twitter share pattern).
  const shareTwitter = useCallback(async () => {
    setSharing("twitter");
    // Trigger a background download so the image is ready to attach
    const blob = await generateImage();
    if (blob) triggerDownload(blob, "arena-result.png");

    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSharing(null);
  }, [generateImage, shareText]);

  // WhatsApp — text only (WA doesn't support image blobs via URL scheme)
  const shareWhatsApp = useCallback(() => {
    setSharing("whatsapp");
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSharing(null);
  }, [shareText]);

  // Copy image to clipboard using Clipboard API
  const copyImage = useCallback(async () => {
    setSharing("copy");
    try {
      const blob = await generateImage();
      if (!blob) throw new Error("no blob");

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch (err) {
      console.error("[share] clipboard write failed:", err);
      // Graceful fallback: copy text instead
      await navigator.clipboard.writeText(shareText).catch(() => {});
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } finally {
      setSharing(null);
    }
  }, [generateImage, shareText]);

  // Download PNG directly
  const downloadImage = useCallback(async () => {
    setSharing("download");
    const blob = await generateImage();
    if (blob) triggerDownload(blob, "arena-result.png");
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
    setSharing(null);
  }, [generateImage]);

  return {
    cardRef,
    sharing,
    copyDone,
    downloadDone,
    shareNative,
    shareTwitter,
    shareWhatsApp,
    copyImage,
    downloadImage,
  };
}

// ── Utility ────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}