import React from "react";

function cx(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cx(
        "relative overflow-hidden rounded-md bg-white/[0.06] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#D4AF37]/10 before:to-transparent",
        className
      )}
    />
  );
}
