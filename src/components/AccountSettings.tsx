"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function AccountSettings({ currentUsername }: { currentUsername: string }) {
  const [username, setUsername] = useState(currentUsername);
  const [usernameMsg, setUsernameMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  async function handleUsernameChange(e: React.FormEvent) {
    e.preventDefault();
    setUsernameMsg("");
    if (username === currentUsername) return;
    setLoadingUsername(true);
    const result = await authClient.updateUser({ username });
    setLoadingUsername(false);
    if (result.error) {
      setUsernameMsg(result.error.message ?? "Failed to update username");
    } else {
      setUsernameMsg("Username updated");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    if (!currentPassword || !newPassword) return;
    setLoadingPassword(true);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    setLoadingPassword(false);
    if (result.error) {
      setPasswordMsg(result.error.message ?? "Failed to change password");
    } else {
      setPasswordMsg("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-5">
      <h2 className="font-medium text-foreground">Account</h2>

      <form onSubmit={handleUsernameChange} className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-foreground">Username</label>
        <div className="flex gap-2">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" disabled={loadingUsername || username === currentUsername}>
            {loadingUsername ? "Saving…" : "Save"}
          </Button>
        </div>
        {usernameMsg && (
          <p className={`text-sm ${usernameMsg.includes("updated") ? "text-green-600" : "text-destructive"}`}>
            {usernameMsg}
          </p>
        )}
      </form>

      <form onSubmit={handlePasswordChange} className="space-y-2">
        <label className="text-sm font-medium text-foreground">Change Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          required
          autoComplete="new-password"
          className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={loadingPassword || !currentPassword || !newPassword}>
          {loadingPassword ? "Changing…" : "Change Password"}
        </Button>
        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.includes("changed") ? "text-green-600" : "text-destructive"}`}>
            {passwordMsg}
          </p>
        )}
      </form>
    </div>
  );
}
