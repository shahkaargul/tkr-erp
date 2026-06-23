/**
 * Utility to merge class names conditionally.
 * Works like clsx – filters out falsy values and joins the rest.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
