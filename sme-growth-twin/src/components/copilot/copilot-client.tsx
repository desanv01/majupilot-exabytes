"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { CopilotMessage } from "@/domain/copilot";
import { Brand } from "@/components/assessment/brand";
import { loadDurableJourney } from "@/infrastructure/persistence/durable-journey-client";

import {
  CopilotApiError,
  type CopilotApiErrorBody,
  type CopilotClientMessage,
  copilotErrorPresentation,
  COPILOT_WELCOME_TEXT,
  prepareCopilotRetry,
  restoreCopilotMessages,
  shouldOfferCopilotRetry,
} from "./copilot-client-utils";

type ToolCall = { toolName: string; status: "completed" | "confirmation_required" | "rejected"; confirmationId: string | null };
type Message = CopilotClientMessage & { tools?: ToolCall[] };
type Session = { id: string };
type HistoryResponse = { session: Session; messages: CopilotMessage[] };
type HealthResponse = { state: string; liveAvailable: boolean };

const withRequestId = (message: string, requestId: string | null) => requestId ? `${message} Request ID: ${requestId}` : message;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => undefined) as { data?: T; error?: CopilotApiErrorBody } | undefined;
  if (!response.ok || body?.data === undefined) {
    const error = body?.error;
    throw new CopilotApiError(
      error?.code ?? `request_${response.status}`,
      error?.category ?? null,
      error?.requestId ?? response.headers.get("x-correlation-id"),
      error?.retryable ?? response.status >= 500,
      response.status,
    );
  }
  return body.data;
}

export function CopilotClient() {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [session, setSession] = useState<Session>();
  const [openFailure, setOpenFailure] = useState<{ message: string; requestId: string | null; retryable: boolean }>();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: COPILOT_WELCOME_TEXT },
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
    const artifactIds = context?.artifactIds;
    if (!context?.syncedAt || !artifactIds) {
      queueMicrotask(() => {
        setStatus("Complete and sync a Blueprint before opening Copilot.");
        setReady(true);
      });
      return;
    }
    queueMicrotask(() => setAvailable(true));
    const openWorkspace = async () => {
      try {
        const [healthResult, sessionResult] = await Promise.allSettled([
          api<HealthResponse>("/api/v2/copilot/status?detail=safe"),
          api<Session>("/api/v2/copilot/sessions", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assessmentSessionId: context.assessmentSessionId, businessTwinId: artifactIds.businessTwin, blueprintId: artifactIds.blueprint, idempotencyKey: `copilot:${context.assessmentSessionId}` }),
          }),
        ]);
        if (sessionResult.status === "rejected") throw sessionResult.reason;
        const nextSession = sessionResult.value;
        const history = await api<HistoryResponse>(`/api/v2/copilot/sessions/${nextSession.id}/messages`);
        setSession(nextSession);
        setMessages(restoreCopilotMessages(history.messages));
        if (healthResult.status === "fulfilled") {
          setStatus(healthResult.value.liveAvailable ? "Live DeepSeek guidance is available through Vercel AI Gateway." : "Copilot is using its safe deterministic response path.");
        } else {
          const presentation = copilotErrorPresentation(healthResult.reason);
          setStatus(withRequestId(presentation.message, presentation.requestId));
        }
      } catch (error) {
        const presentation = copilotErrorPresentation(error);
        setOpenFailure({ message: presentation.message, requestId: presentation.requestId, retryable: presentation.retryable });
        setAvailable(false);
      } finally { setReady(true); }
    };
    void openWorkspace();
  }, []);

  useEffect(() => { logRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  const sendTurn = async (message: string, idempotencyKey = `turn:${crypto.randomUUID()}`, appendOptimisticUser = true) => {
    if (!message || !session || busy) return;
    setInput(""); setBusy(true);
    if (appendOptimisticUser) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: message }]);
    try {
      const result = await api<{ text: string; state: string; toolCalls: ToolCall[] }>(`/api/v2/copilot/sessions/${session.id}/turns`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, idempotencyKey }),
      });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: result.text, tools: result.toolCalls }]);
    } catch (error) {
      const presentation = copilotErrorPresentation(error);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "status", text: presentation.message,
        requestId: presentation.requestId,
        retryMessage: presentation.retryable ? message : undefined,
        retryIdempotencyKey: presentation.retryable ? idempotencyKey : undefined,
      }]);
    } finally { setBusy(false); }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendTurn(input.trim());
  };

  const retryTurn = (failedStatusId: string, message: string, idempotencyKey: string) => {
    setMessages((current) => prepareCopilotRetry(current, failedStatusId));
    void sendTurn(message, idempotencyKey, false);
  };

  const confirm = async (confirmationId: string) => {
    setBusy(true);
    try {
      await api(`/api/v2/copilot/confirmations/${confirmationId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmationText: "CONFIRM", idempotencyKey: `confirm:${crypto.randomUUID()}` }) });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "status", text: "Confirmed action completed and added to the audit trail." }]);
    } catch (error) {
      const presentation = copilotErrorPresentation(error);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "status", text: presentation.message, requestId: presentation.requestId }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="copilot-page">
      <header className="topbar copilot-topbar"><Brand /><nav aria-label="Copilot navigation"><Link href="/">Home</Link><Link href="/blueprint">Blueprint</Link><Link href="/consultation">Consultation</Link></nav></header>
      <main className="copilot-shell">
        <section className="copilot-intro"><p className="eyebrow">MajuPilot Transformation Copilot</p><h1>Turn your evidence into a confident next move.</h1><p>Explore the reasoning behind your plan, retrieve exact evidence, and prepare changes for explicit confirmation.</p><span className="copilot-live-status" role="status">{status}</span></section>
        {!ready ? <section className="copilot-empty" aria-busy="true"><h2>Opening your workspace</h2><p>Your authorized Twin and Blueprint are being loaded.</p></section> : !available ? (
          <section className="copilot-empty" role={openFailure ? "alert" : undefined}><h2>{openFailure ? "Copilot could not open this workspace" : "Your Blueprint comes first"}</h2><p>{openFailure?.message ?? "Copilot answers from your persisted evidence, so it opens after a Blueprint is securely synced."}</p>{openFailure?.requestId ? <p className="copilot-diagnostic">Request ID: <code>{openFailure.requestId}</code></p> : null}{shouldOfferCopilotRetry(openFailure) ? <button className="button secondary" type="button" onClick={() => window.location.reload()}>Retry</button> : !openFailure ? <Link className="button primary" href="/assessment">Start or resume assessment</Link> : null}</section>
        ) : (
          <section className="copilot-workspace" aria-label="Transformation Copilot conversation">
            <div className="copilot-log" ref={logRef} role="log" aria-live="polite">
              {messages.map((message) => <article key={message.id} className={`copilot-message ${message.role}`}><span>{message.role === "user" ? "You" : message.role === "assistant" ? "MajuPilot" : "Status"}</span><p>{message.text}</p>{message.requestId ? <small className="copilot-diagnostic">Request ID: <code>{message.requestId}</code></small> : null}{message.retryMessage && message.retryIdempotencyKey ? <button type="button" className="button secondary" disabled={busy} onClick={() => retryTurn(message.id, message.retryMessage!, message.retryIdempotencyKey!)}>Retry</button> : null}{message.tools?.filter((tool) => tool.status === "confirmation_required" && tool.confirmationId).map((tool) => <button key={tool.confirmationId} type="button" className="button secondary" disabled={busy} onClick={() => confirm(tool.confirmationId!)}>Confirm {tool.toolName}</button>)}</article>)}
              {busy ? <article className="copilot-message status"><span>Status</span><p>Working with your authorized evidence...</p></article> : null}
            </div>
            <form className="copilot-composer" onSubmit={submit}><label htmlFor="copilot-message">Ask about your transformation plan</label><div><textarea id="copilot-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} rows={3} placeholder="For example: Why is CRM prioritised before AI automation?" disabled={!session || busy} /><button className="button primary" type="submit" disabled={!session || busy || !input.trim()}>Send</button></div><small>Writes are never automatic. Copilot will ask for confirmation before any approved action.</small></form>
          </section>
        )}
      </main>
    </div>
  );
}
