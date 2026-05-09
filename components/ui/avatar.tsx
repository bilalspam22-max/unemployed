import { getInitials, avatarColor } from "@/lib/utils";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "xs" | "sm" | "md";
}

export function Avatar({ firstName, lastName, size = "md" }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const bg = avatarColor(`${firstName}${lastName}`);
  return (
    <div
      className={`avatar ${size === "sm" ? "avatar--sm" : size === "xs" ? "avatar--xs" : ""}`}
      style={{ background: bg }}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
