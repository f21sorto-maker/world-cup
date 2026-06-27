type Props = {
  count: number;
  size?: "sm" | "lg" | "xl";
  className?: string;
};

/** Gold stars indicating past World Cup titles (FIFA kit convention). */
export function WorldCupStars({ count, size = "sm", className = "" }: Props) {
  if (count <= 0) return null;

  const starsClass = [
    "team-flag-stars",
    `team-flag-stars--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={starsClass} aria-label={`${count} World Cup ${count === 1 ? "title" : "titles"}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="team-flag-star" aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}
