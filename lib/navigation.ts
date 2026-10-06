import { FEATURES } from "@/lib/features";

export const PRIMARY_NAVIGATION = [
  { href: "/tools", label: "Tools" },
  { href: "/plays", label: "Plays" },
  ...(FEATURES.communities ? [{ href: "/communities", label: "Comms" }] : []),
  { href: "/ai-automation", label: "Learn" },
  ...(FEATURES.staticSearch ? [{ href: "/search", label: "Search" }] : []),
  ...(FEATURES.auth ? [{ href: "/profile", label: "Profile" }] : []),
];
