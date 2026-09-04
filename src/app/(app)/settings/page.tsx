"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setCity(data.city ?? "");
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city: city || null }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-stone">Loading…</p>;

  return (
    <div className="max-w-md">
      <h1 className="font-display text-4xl mb-2">Settings</h1>
      <p className="text-stone mb-10">Manage your account and weather location.</p>

      <div className="space-y-6">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} disabled className="opacity-60" />
        </div>
        <div>
          <Label>City</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. San Francisco"
          />
          <p className="text-xs text-stone mt-1.5">
            Used to factor real weather into outfit recommendations. We never request your device
            location.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {saved && <span className="text-sm text-success">Saved</span>}
        </div>
      </div>
    </div>
  );
}
