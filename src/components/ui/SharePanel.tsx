import { Share2, X, MessageCircle, Copy, Download, Loader2 } from "lucide-react";
import Button from "./Button";

type Props = {
  sharing:       string | null;
  copyDone:      boolean;
  downloadDone:  boolean;
  shareNative:   () => void;
  shareTwitter:  () => void;
  shareWhatsApp: () => void;
  copyImage:     () => void;
  downloadImage: () => void;
};

function ShareButton({
  label, loading, done, onClick, disabled, icon,
}: {
  label:    string;
  loading:  boolean;
  done:     boolean;
  onClick:  () => void;
  disabled: boolean;
  icon:     React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 py-3 px-2
                 bg-surface border border-border rounded-sm
                 hover:border-border-bright hover:bg-elevated
                 transition-all duration-150
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <Loader2 size={16} className="animate-spin text-muted" />
        : icon}
      <span className={`font-mono text-[9px] tracking-widest uppercase ${done ? "text-green" : "text-dim"}`}>
        {label}
      </span>
    </button>
  );
}

export default function SharePanel({
  sharing, copyDone, downloadDone,
  shareNative, shareTwitter, shareWhatsApp, copyImage, downloadImage,
}: Props) {
  const isBusy = sharing !== null;

  return (
    <div className="w-full flex flex-col gap-3">
      {"share" in navigator ? (
        <Button
          variant="primary" size="lg" fullWidth
          onClick={shareNative} disabled={isBusy}
          className="amber-pulse"
        >
          {sharing === "native"
            ? <Loader2 size={15} className="animate-spin" />
            : <Share2  size={15} />}
          <span className="ml-2">Share Result</span>
        </Button>
      ) : (
        <Button
          variant="primary" size="lg" fullWidth
          onClick={downloadImage} disabled={isBusy}
          className="amber-pulse"
        >
          {sharing === "download"
            ? <Loader2  size={15} className="animate-spin" />
            : <Download size={15} />}
          <span className="ml-2">{downloadDone ? "Saved!" : "Save Image"}</span>
        </Button>
      )}

      <div className="grid grid-cols-3 gap-2">
        <ShareButton
          label="Twitter"
          loading={sharing === "twitter"}
          done={false}
          onClick={shareTwitter}
          disabled={isBusy}
          icon={<X size={16} className="text-muted" />}
        />
        <ShareButton
          label="WhatsApp"
          loading={sharing === "whatsapp"}
          done={false}
          onClick={shareWhatsApp}
          disabled={isBusy}
          icon={<MessageCircle size={16} className="text-muted" />}
        />
        <ShareButton
          label={copyDone ? "Copied!" : "Copy"}
          loading={sharing === "copy"}
          done={copyDone}
          onClick={copyImage}
          disabled={isBusy}
          icon={<Copy size={16} className={copyDone ? "text-green" : "text-muted"} />}
        />
      </div>
    </div>
  );
}
