import envelopeSvg from "./envelope.svg?raw";

/**
 * Brand mark from `envelope.svg`.
 * Replace that file in `client/src/components/` to change the art; it is loaded as-is via `?raw`.
 */
export function EbAndFlowLogo({
  className = "",
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-inherit [&_svg]:fill-current ${className}`}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Ebb and Flow"}
    >
      <span
        className="inline-flex h-9 max-h-9 shrink-0 items-center [&_svg]:block [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-[min(48vw,6rem)] sm:h-10"
        dangerouslySetInnerHTML={{ __html: envelopeSvg }}
      />
    </span>
  );
}
