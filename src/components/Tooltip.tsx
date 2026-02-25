export function HelpTip({ text }: { text: string }) {
  return (
    <span
      className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-black/5"
      title={text}
      aria-label={text}
    >
      ?
    </span>
  );
}
