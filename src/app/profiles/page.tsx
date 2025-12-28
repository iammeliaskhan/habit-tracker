"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

type UsersResponse = {
  activeUserId: string;
  users: User[];
};

export default function ProfilesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load profiles");
    const json = (await res.json()) as UsersResponse;
    setUsers(json.users);
    setActiveUserId(json.activeUserId);
  }

  useEffect(() => {
    void refresh().catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  async function createProfile(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();
    if (!name) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: color || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create profile");
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create profile");
    } finally {
      setBusy(false);
    }
  }

  async function setActive(userId: string) {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/users/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to switch profile");
      }
      setActiveUserId(userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to switch profile");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile(userId: string) {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete profile");
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-zinc-500">Habit Tracker</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profiles</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Switch between profiles to keep habits and check-ins separate.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Back
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <form action={createProfile} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <div className="mb-1 text-xs font-medium text-zinc-600">Profile name</div>
            <input
              name="name"
              placeholder="e.g. Elias"
              disabled={busy}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-300"
            />
          </label>

          <label>
            <div className="mb-1 text-xs font-medium text-zinc-600">Color</div>
            <input
              name="color"
              type="color"
              defaultValue="#0ea5e9"
              disabled={busy}
              className="h-9 w-12 rounded-md border border-zinc-200 bg-white p-1"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Create
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold text-zinc-600">
                Profile
              </th>
              <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold text-zinc-600">
                Created
              </th>
              <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-right text-xs font-semibold text-zinc-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isActive = u.id === activeUserId;
              return (
                <tr key={u.id} className="hover:bg-zinc-50">
                  <td className="border-b border-zinc-100 px-3 py-2 text-sm text-zinc-900">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: u.color ?? "#94a3b8" }}
                        aria-hidden
                      />
                      <span className="font-medium">{u.name}</span>
                      {isActive ? (
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
                          Active
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 text-sm text-zinc-600">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void setActive(u.id)}
                        disabled={busy || isActive}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Set active
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProfile(u.id)}
                        disabled={busy || isActive}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-sm text-zinc-600" colSpan={3}>
                  No profiles yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Note: Profiles are local-only (no login). Switching profiles affects which habits appear on the home page.
      </p>
    </div>
  );
}
