"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/assessment/brand";
import { loadDurableJourney } from "@/infrastructure/persistence/durable-journey-client";

type ToolCall = { toolName: string; status: "completed" | "confirmation_required" | "rejected"; confirmationId: string | null };
type Message = { id: string; role: "user" | "assistant" | "status"; text: string; tools?: ToolCall[] };
type Session = { id: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => undefined) as { data?: T; error?: { code?: string } } | undefined;
  if (!response.ok || !body?.data) throw new Error(body?.error?.code ?? `request_${response.status}`);
  return body.data;
}

export function CopilotClient() {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [session, setSession] = useState<Session>();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: "Ask me to explain your Business Twin, recommendations, scenario, Blueprint, or consultation status. I will keep deterministic facts and AI interpretation visibly separate." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Checking your secure MajuPilot workspace...");
  const logRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef(false);

  useEffect(() => {
    if (openingRef.current) return;
    openingRef.current = true;
    const context = loadDurableJourney(localStorage);
    if (!context?.syncedAt || !context.artifactIds) {
      setStatus("Complete and sync a Blueprint before opening Copilot.");
      setReady(true);
      return;
    }
    setAvailable(true);
    Promise.all([
      api<{ state: string; liveAvailable: boolean }>("/api/v2/copilot/status?detail=safe"),
      api<Session>("/api/v2/copilot/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentSessionId: context.assessmentSessionId, businessTwinId: context.artifactIds.businessTwin, blueprintId: context.artifactIds.blueprint, idempotencyKey: `copilot:${context.assessmentSessionId}` }),
      }),
    ]).then(([health, nextSession]) => {
      setSession(nextSession);
      setStatus(health.liveAvailable ? "Live DeepSeek guidance is available through Vercel AI Gateway." : "Copilot is using its safe deterministic response path.");
    }).catch(() => setStatus("Copilot could not open this workspace. Refresh to retry."))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => { logRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || !session || busy) return;
    setInput(""); setBusy(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: message }]);
    try {
      const result = await api<{ text: string; state: string; toolCalls: ToolCall[] }>(`/api/v2/copilot/sessions/${session.id}/turns`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, idempotencyKey: `turn:${crypto.randomUUID()}` }),
      });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: result.text, tools: result.toolCalls }]);
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "status", text: error instanceof Error && error.message === "AI_REQUIRED_UNAVAILABLE" ? "Live guidance is temporarily unavailable. Your saved evidence was not changed." : "That request could not be completed safely. Please try again." }]);
    } finally { setBusy(false); }
  };

  const confirm = async (confirmationId: string) => {
    setBusy(true);
    try {
      await api(`/api/v2/copilot/confirmations/${confirmationId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmationText: "CONFIRM", idempotencyKey: `confirm:${crypto.randomUUID()}` }) });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "status", text: "Confirmed action completed and added to the audit trail." }]);
    } catch { setMessages((current) => [...current, { id: crypto.randomUUID(), role: "status", text: "The action was not executed. Review the request and try again." }]); }
    finally { setBusy(false); }
  };

  return (
    <div className="copilot-page">
      <header className="topbar copilot-topbar"><Brand /><nav aria-label="Copilot navigation"><Link href="/">Home</Link><Link href="/blueprint">Blueprint</Link><Link href="/consultation">Consultation</Link></nav></header>
      <main className="copilot-shell">
        <section className="copilot-intro"><p className="eyebrow">MajuPilot Transformation Copilot</p><h1>Turn your evidence into a confident next move.</h1><p>Explore the reasoning behind your plan, retrieve exact evidence, and prepare changes for explicit confirmation.</p><span className="copilot-live-status" role="status">{status}</span></section>
        {!ready ? <section className="copilot-empty" aria-busy="true"><h2>Opening your workspace</h2><p>Your authorized Twin and Blueprint are being loaded.</p></section> : !available ? (
          <section className="copilot-empty"><h2>Your Blueprint comes first</h2><p>Copilot answers from your persisted evidence, so it opens after a Blueprint is securely synced.</p><Link className="button primary" href="/assessment">Start or resume assessment</Link></section>
        ) : (
          <section className="copilot-workspace" aria-label="Transformation Copilot conversation">
            <div className="copilot-log" ref={logRef} role="log" aria-live="polite">
              {messages.map((message) => <article key={message.id} className={`copilot-message ${message.role}`}><span>{message.role === "user" ? "You" : message.role === "assistant" ? "MajuPilot" : "Status"}</span><p>{message.text}</p>{message.tools?.filter((tool) => tool.status === "confirmation_required" && tool.confirmationId).map((tool) => <button key={tool.confirmationId} type="button" className="button secondary" disabled={busy} onClick={() => confirm(tool.confirmationId!)}>Confirm {tool.toolName}</button>)}</article>)}
              {busy ? <article className="copilot-message status"><span>Status</span><p>Working with your authorized evidence...</p></article> : null}
            </div>
            <form className="copilot-composer" onSubmit={submit}><label htmlFor="copilot-message">Ask about your transformation plan</label><div><textarea id="copilot-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} rows={3} placeholder="For example: Why is CRM prioritised before AI automation?" disabled={!session || busy} /><button className="button primary" type="submit" disabled={!session || busy || !input.trim()}>Send</button></div><small>Writes are never automatic. Copilot will ask for confirmation before any approved action.</small></form>
          </section>
        )}
      </main>
    </div>
  );
}
