import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

type RecordData = Record<string, unknown>;

function isRecord(value: unknown): value is RecordData {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getPayPalConfig() {
  const mode = process.env.PAYPAL_MODE;

  if (mode !== "live" && mode !== "sandbox") {
    throw new Error("PAYPAL_MODE must be live or sandbox.");
  }

  const suffix = mode === "live" ? "LIVE" : "SANDBOX";
  const setting = (name: string) =>
    process.env[`PAYPAL_${suffix}_${name}`];

  const clientId = setting("CLIENT_ID");
  const clientSecret = setting("CLIENT_SECRET");
  const webhookId = setting("WEBHOOK_ID");
  const proPlanId = setting("PRO_PLAN_ID");
  const ultimatePlanId = setting("ULTIMATE_PLAN_ID");

  if (
    !clientId ||
    !clientSecret ||
    !webhookId ||
    !proPlanId ||
    !ultimatePlanId
  ) {
    throw new Error("PayPal environment is not fully configured.");
  }

  return {
    clientId,
    clientSecret,
    webhookId,
    proPlanId,
    ultimatePlanId,
    baseURL:
      mode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  };
}

async function getPayPalToken(config: ReturnType<typeof getPayPalConfig>) {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${config.baseURL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("PayPal authentication failed.");
  }

  const data = (await response.json()) as {
    access_token?: string;
  };

  if (!data.access_token) {
    throw new Error("PayPal did not return an access token.");
  }

  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const config = getPayPalConfig();

    const rawBody = await request.text();
    let event: RecordData;

    try {
      const parsed: unknown = JSON.parse(rawBody);

      if (!isRecord(parsed)) {
        throw new Error("Invalid event.");
      }

      event = parsed;
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook body." },
        { status: 400 }
      );
    }

    const transmissionId = request.headers.get("paypal-transmission-id");
    const transmissionTime = request.headers.get("paypal-transmission-time");
    const certURL = request.headers.get("paypal-cert-url");
    const authAlgo = request.headers.get("paypal-auth-algo");
    const transmissionSig = request.headers.get("paypal-transmission-sig");

    if (
      !transmissionId ||
      !transmissionTime ||
      !certURL ||
      !authAlgo ||
      !transmissionSig
    ) {
      return NextResponse.json(
        { error: "Missing PayPal signature headers." },
        { status: 400 }
      );
    }

    const token = await getPayPalToken(config);

    const verificationResponse = await fetch(
      `${config.baseURL}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certURL,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: config.webhookId,
          webhook_event: event,
        }),
        cache: "no-store",
      }
    );

    if (!verificationResponse.ok) {
      console.error("PayPal signature verification request failed.");

      return NextResponse.json(
        { error: "Could not verify PayPal notification." },
        { status: 502 }
      );
    }

    const verification =
      (await verificationResponse.json()) as {
        verification_status?: string;
      };

    if (verification.verification_status !== "SUCCESS") {
      console.error("Rejected an unverified PayPal notification.");

      return NextResponse.json(
        { error: "Invalid PayPal signature." },
        { status: 400 }
      );
    }

    const eventId = event.id;
    const eventType = event.event_type;
    const resource = isRecord(event.resource) ? event.resource : {};

    if (typeof eventId !== "string" || typeof eventType !== "string") {
      return NextResponse.json(
        { error: "Invalid PayPal event." },
        { status: 400 }
      );
    }

    const supportedEvents = new Set([
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.UPDATED",
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
      "BILLING.SUBSCRIPTION.EXPIRED",
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
      "PAYMENT.SALE.COMPLETED",
    ]);

    if (!supportedEvents.has(eventType)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const subscriptionId =
      typeof resource.id === "string"
        ? resource.id
        : typeof resource.billing_agreement_id === "string"
          ? resource.billing_agreement_id
          : null;

    if (!subscriptionId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const subscriptionResponse = await fetch(
      `${config.baseURL}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!subscriptionResponse.ok) {
      throw new Error("Could not retrieve the PayPal subscription.");
    }

    const subscription =
      (await subscriptionResponse.json()) as RecordData;

    const userId = subscription.custom_id;
    const planId = subscription.plan_id;
    const paypalStatus = subscription.status;

    if (typeof userId !== "string" || typeof planId !== "string") {
      console.error("PayPal subscription is missing its account mapping.");

      return NextResponse.json({ received: true, ignored: true });
    }

    const plan =
      planId === config.proPlanId
        ? "pro"
        : planId === config.ultimatePlanId
          ? "ultimate"
          : null;

    if (!plan) {
      console.error("PayPal subscription has an unrecognized plan.");

      return NextResponse.json({ received: true, ignored: true });
    }

    const billingInfo = isRecord(subscription.billing_info)
      ? subscription.billing_info
      : {};

    const executions = Array.isArray(billingInfo.cycle_executions)
      ? billingInfo.cycle_executions
      : [];

    const trialCycle = executions.find(
      (cycle) =>
        isRecord(cycle) &&
        cycle.tenure_type === "TRIAL" &&
        Number(cycle.cycles_completed ?? 0) === 0 &&
        Number(cycle.cycles_remaining ?? 0) > 0
    );

    let status: string;

    switch (paypalStatus) {
      case "ACTIVE":
        status =
          plan === "pro" && trialCycle ? "trialing" : "active";
        break;
      case "SUSPENDED":
        status = "past_due";
        break;
      case "CANCELLED":
        status = "cancelled";
        break;
      case "EXPIRED":
        status = "expired";
        break;
      default:
        return NextResponse.json({ received: true, ignored: true });
    }

    if (eventType === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
      status = "past_due";
    }

    const startTime =
      typeof subscription.start_time === "string"
        ? subscription.start_time
        : null;

    const nextBillingTime =
      typeof billingInfo.next_billing_time === "string"
        ? billingInfo.next_billing_time
        : null;

    const trialStart = status === "trialing" ? startTime : null;
    const trialEnd = status === "trialing" ? nextBillingTime : null;

    const { env } = await getCloudflareContext({ async: true });

    const db = (env as unknown as {
      aivanta_db: D1Database;
    }).aivanta_db;

    if (!db) {
      throw new Error("AI Vanta D1 database is unavailable.");
    }

    await db.batch([
      db.prepare(`
        INSERT INTO subscriptions (
          id,
          user_id,
          plan,
          status,
          provider,
          provider_subscription_id,
          trial_start_at,
          trial_end_at,
          current_period_start_at,
          current_period_end_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 'paypal', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(provider_subscription_id) DO UPDATE SET
          status = excluded.status,
          trial_start_at = excluded.trial_start_at,
          trial_end_at = excluded.trial_end_at,
          current_period_start_at = excluded.current_period_start_at,
          current_period_end_at = excluded.current_period_end_at,
          updated_at = CURRENT_TIMESTAMP
        WHERE subscriptions.user_id = excluded.user_id
          AND subscriptions.plan = excluded.plan
      `).bind(
        `paypal_${subscriptionId}`,
        userId,
        plan,
        status,
        subscriptionId,
        trialStart,
        trialEnd,
        startTime,
        nextBillingTime
      ),
      db.prepare(`
        INSERT INTO payment_webhook_events (event_id, event_type)
        VALUES (?, ?)
        ON CONFLICT(event_id) DO NOTHING
      `).bind(eventId, eventType),
    ]);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("AI Vanta PayPal webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
