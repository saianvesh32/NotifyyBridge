"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { buildAssistantContext } from "@/lib/assistant-context";
import { getOpenAI } from "@/lib/openai";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

const askSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message is too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(12)
    .optional(),
});

export type AssistantReply = { reply: string };

export async function askAssistant(input: unknown): Promise<ActionResult<AssistantReply>> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");
  if (session.user.isSuspended) return actionError("Account suspended");

  const parsed = askSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  if (!process.env.OPENAI_API_KEY) {
    return actionError("AI assistant is not configured. Add OPENAI_API_KEY to your environment.");
  }

  try {
    const context = await buildAssistantContext(session.user.id, session.user.role as Role);

    const systemPrompt =
      session.user.role === Role.AUTHOR
        ? `You are the internal announcement portal assistant for an AUTHOR.
Help with: drafting tips, what to publish, understanding read/ack engagement, navigating drafts vs published vs archived.
Rules:
- Answer only using the portal data below. If unsure, say you don't have that information.
- Never invent announcement titles or IDs.
- Draft content is confidential to this author; do not describe other authors' drafts.
- Be concise and actionable.

Portal data:
${context}`
        : `You are the internal announcement portal assistant for an EMPLOYEE.
Help with: finding announcements, unread items, required acknowledgments, summaries of published posts.
Rules:
- Answer only using the portal data below. If unsure, say you don't have that information.
- Never reveal draft or archived-only content unless it appears below.
- Never invent announcement titles or IDs.
- Be concise and friendly.

Portal data:
${context}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const turn of parsed.data.history ?? []) {
      messages.push({ role: turn.role, content: turn.content });
    }

    messages.push({ role: "user", content: parsed.data.message });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      max_tokens: 900,
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return actionError("No response from the assistant");

    return actionSuccess({ reply });
  } catch (e) {
    console.error("askAssistant:", e);
    const msg = e instanceof Error ? e.message : "Assistant request failed";
    return actionError(msg.includes("API key") ? "Invalid or missing OpenAI API key" : "Assistant request failed");
  }
}
