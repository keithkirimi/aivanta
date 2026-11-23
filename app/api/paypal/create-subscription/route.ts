import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

type CheckoutBody = {
  plan?: unknown;
};

type PayPalLink = {
  rel?: string;
  href?: string;
};

type PayPalSubscriptionResponse = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
};

function getPayPalConfig() {
  const mode = process.env.PAYPAL_MODE;

  if (mode !== "live" && mode !== "sandbox") {
    return null;
  }

  const suffix = mode === "live" ? "LIVE" : "SANDBOX";
  const setting = (name: string) =>
    process.env[`PAYPAL_${suffix}_${name}`];

  const clientId = setting("CLIENT_ID");
  const clientSecret = setting("CLIENT_SECRET");
  const proPlanId = setting("PRO_PLAN_ID");
  const ultimatePlanId = setting("ULTIMATE_PLAN_ID");

  if (!clientId || !clientSecret || !proPlanId || !ultimatePlanId) {
    return null;
  }

  return {
    mode,
    clientId,
    clientSecret,
    proPlanId,
    ultimatePlanId,
    baseURL:
      mode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  };
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const baseURL = process.env.BETTER_AUTH_URL;

    if (!origin || !baseURL) {
      return NextResponse.json(
        { error: "Checkout could not verify this request." },
        { status: 403 }
      );
    }

    const allowedOrigins = new Set([
      new URL(baseURL).origin,
      new URL(request.url).origin,
    ]);

    if (!allowedOrigins.has(origin)) {
      return NextResponse.json(
        { error: "Checkout requests must come from AI Vanta." },
        { status: 403 }
      );
    }

    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in before choosing a subscription." },
        { status: 401 }
      );
    }

    const config = getPayPalConfig();

    if (!config) {
      console.error("PayPal environment is not fully configured.");

      return NextResponse.json(
        { error: "PayPal checkout is not configured." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as CheckoutBody;

    if (body.plan !== "pro" && body.plan !== "ultimate") {
      return NextResponse.json(
        { error: "Please choose a valid subscription plan." },
        { status: 400 }
      );
    }

    const planId =
      body.plan === "pro"
        ? config.proPlanId
        : config.ultimatePlanId;

    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
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

    if (!tokenResponse.ok) {
      console.error("PayPal OAuth failed:", tokenResponse.status);

      return NextResponse.json(
        { error: "PayPal could not authorize checkout. Please try later." },
        { status: 502 }
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "PayPal did not provide an access token." },
        { status: 502 }
      );
    }

    const subscriptionResponse = await fetch(
      `${config.baseURL}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: session.user.id,
          application_context: {
            brand_name: "AI Vanta",
            locale: "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: new URL(
              "/pricing/success",
              baseURL
            ).toString(),
            cancel_url: new URL(
              "/pricing?checkout=cancelled",
              baseURL
            ).toString(),
          },
        }),
        cache: "no-store",
      }
    );

    if (!subscriptionResponse.ok) {
      console.error(
        "PayPal subscription creation failed:",
        subscriptionResponse.status
      );

      return NextResponse.json(
        { error: "PayPal couldn't start checkout. Please try again." },
        { status: 502 }
      );
    }

    const subscription =
      (await subscriptionResponse.json()) as PayPalSubscriptionResponse;

    const approvalURL = subscription.links?.find(
      (link) => link.rel === "approve" && typeof link.href === "string"
    )?.href;

    if (!subscription.id || !approvalURL) {
      console.error("PayPal response did not include checkout approval.");

      return NextResponse.json(
        { error: "PayPal did not return a checkout link." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      approvalURL,
    });
  } catch (error) {
    console.error("AI Vanta PayPal checkout error:", error);

    return NextResponse.json(
      { error: "Something went wrong while starting checkout." },
      { status: 500 }
    );
  }
}
