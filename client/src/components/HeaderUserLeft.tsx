import type { User } from "../auth";

/**
 * Standard header left slot: username and optional Admin badge.
 * Second row reserves height when not admin so the header stays a consistent size.
 */
export function HeaderUserLeft({ user }: { user: User | null }) {
  return (
    <div className="flex flex-col justify-center gap-0.5">
      <p className="truncate text-sm leading-tight text-muted">{user?.username}</p>
      <div className="flex h-5 items-center">
        {user?.is_admin ? (
          <span className="inline-flex rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium leading-none text-accent">
            Admin
          </span>
        ) : null}
      </div>
    </div>
  );
}
