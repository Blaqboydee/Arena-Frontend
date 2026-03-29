type Props = {
  myName: string;
};

export default function WaitingScreen({ myName }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-2 border-border border-t-accent animate-spin" />

      <p className="text-muted text-sm tracking-widest uppercase">
        Searching for opponent…
      </p>
      <p className="text-muted text-sm">
        You are{" "}
        <span className="text-text font-semibold">{myName || "Anonymous"}</span>
      </p>
    </div>
  );
}