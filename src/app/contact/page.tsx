"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminInfo = {
  name: process.env.NEXT_PUBLIC_CONTACT_ADMIN_NAME || "SmartAgri Admin Team",
  email: process.env.NEXT_PUBLIC_CONTACT_ADMIN_EMAIL || "support@smartagri.local",
  phone: process.env.NEXT_PUBLIC_CONTACT_ADMIN_PHONE || "+91 00000 00000",
  address:
    process.env.NEXT_PUBLIC_CONTACT_ADMIN_ADDRESS ||
    "SmartAgri Support Desk, Bhubaneswar, Odisha, India",
  hours: process.env.NEXT_PUBLIC_CONTACT_ADMIN_HOURS || "Mon-Sat, 9:00 AM - 6:00 PM",
};

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
    const saved = localStorage.getItem("smartAgriName") || "";
    if (saved) setName(saved);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      setSending(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to send message.");
        return;
      }
      alert("Message sent to admin successfully.");
      setSubject("");
      setMessage("");
    } catch (e: any) {
      alert(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Contact Admin</h1>
          <p className="mt-1 text-slate-600">
            Reach support for account issues, feature help, data corrections, and technical assistance.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-1">
            <h2 className="text-lg font-bold text-slate-900">Admin Contact Info</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-slate-700">
                <span className="font-semibold text-slate-900">Team:</span> {adminInfo.name}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold text-slate-900">Email:</span> {adminInfo.email}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold text-slate-900">Phone:</span> {adminInfo.phone}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold text-slate-900">Address:</span> {adminInfo.address}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold text-slate-900">Support Hours:</span> {adminInfo.hours}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">Send a Message</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Subject *</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Issue subject"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Message *</label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Describe your issue in detail..."
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send to Admin"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
