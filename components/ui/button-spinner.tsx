interface ButtonSpinnerProps {
  size?: number;
}

export function ButtonSpinner({ size = 12 }: ButtonSpinnerProps) {
  return (
    <span
      className="btn-spinner"
      style={{ width: size, height: size, borderWidth: Math.max(1.5, size / 8) }}
      aria-hidden
    />
  );
}
