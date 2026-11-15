import type { ReleaseDatePrecision } from "@freetsy/poster";

const PRECISIONS: Record<string, ReleaseDatePrecision> = {
  "9": "year",
  "10": "month",
  "11": "day",
};

export function pickReleaseDate(rows: Array<{ value: string; extra: string }>): {
  releaseDate: string;
  releaseDatePrecision: ReleaseDatePrecision;
} {
  const dates = rows.flatMap((row) => {
    const precision = PRECISIONS[row.extra];
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(row.value);
    if (!precision || !match) return [];
    const [, year, month, day] = match;
    const iso =
      precision === "day"
        ? `${year}-${month}-${day}`
        : precision === "month"
          ? `${year}-${month}`
          : year;
    return [{ year, iso, precision, rank: Number(row.extra) }];
  });
  if (dates.length === 0) return { releaseDate: "", releaseDatePrecision: "year" };

  const earliestYear = dates.reduce(
    (min, date) => (date.year < min ? date.year : min),
    dates[0].year,
  );
  const best = dates
    .filter((date) => date.year === earliestYear)
    .sort((a, b) => b.rank - a.rank || a.iso.localeCompare(b.iso))[0];
  return { releaseDate: best.iso, releaseDatePrecision: best.precision };
}
