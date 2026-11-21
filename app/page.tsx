
const tools = [
  {
    icon: "✍️",
    name: "AI Writer",
    description: "Write essays, emails, articles and professional content.",
    tag: "Writing",
    href: "/writer",
    available: true,
  },
  {
    icon: "💡",
    name: "Business Name Generator",
    description: "Discover creative names and ideas for your next business.",
    tag: "Business",
    href: "/business-name-generator",
    available: true,
  },
  {
    icon: "📄",
    name: "CV Builder",
    description: "Create professional CVs that help you stand out.",
    tag: "Career",
    href: "#",
    available: false,
  },
  {
    icon: "📱",
    name: "Social Media Generator",
    description: "Generate captions, posts and content ideas.",
    tag: "Social",
    href: "#",
    available: false,
  },
  {
    icon: "💻",
    name: "Coding Assistant",
    description: "Understand code, solve problems and build projects.",
    tag: "Development",
    href: "#",
    available: false,
  },
  {
    icon: "🎓",
    name: "Study Assistant",
    description: "Learn difficult topics and understand concepts faster.",
    tag: "Education",
    href: "#",
    available: false,
  },
];

const features = [
  {
    icon: "⚡",
    title: "Everything in one place",
    description:
      "Access a growing collection of tools from one simple workspace.",
  },
  {
    icon: "🎯",
    title: "Easy to use",
    description:
      "Simple interfaces designed to help you get started quickly.",
  },
  {
    icon: "🚀",
    title: "Built for productivity",
    description:
      "Spend less time switching between tools and more time creating.",
  },
];

const plans = [
  {
    name: "Free",
    price: "KSh 0",
    description: "Get started with Aivanta.",
    features: [
      "Access to available tools",
      "Basic workspace",
      "Demo features",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: "KSh 499",
    description: "For creators and students.",
    features: [
      "Everything in Free",
      "More tools as they launch",
      "Enhanced workspace",
    ],
    featured: true,
  },
  {
    name: "Ultimate",
    price: "KSh 999",
    description: "For ambitious builders.",
    features: [
      "Everything in Pro",
      "Access to future premium tools",
      "Priority feature access",
    ],
    featured: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      {/* HERO */}
      <section className="relative px-5 pb-24 pt-24 sm:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Welcome to Aivanta
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Everything you need.
            <span className="block bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
            Write, create, learn and build with a growing collection of tools
            designed to make your everyday work easier.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#tools"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-4 font-semibold transition hover:scale-[1.02] hover:opacity-90"
            >
              Explore tools →
            </a>

            <a
              href="#pricing"
              className="rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              View plans
            </a>
          </div>

          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div>
              <p className="text-3xl font-bold text-white">6</p>
              <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                Planned tools
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">1</p>
              <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                Workspace
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">∞</p>
              <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                Ideas to explore
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              YOUR WORKSPACE
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Explore your tools<span className="text-violet-400">.</span>
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-gray-400">
              Choose a tool and start bringing your ideas to life.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <article
                key={tool.name}
                className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:bg-violet-500/[0.05]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-3xl">
                    {tool.icon}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      tool.available
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.04] text-gray-400"
                    }`}
                  >
                    {tool.available ? "Available" : "Coming soon"}
                  </span>
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                  {tool.tag}
                </p>

                <h3 className="text-xl font-semibold">{tool.name}</h3>

                <p className="mt-3 min-h-14 text-sm leading-6 text-gray-400">
                  {tool.description}
                </p>

                <div className="mt-7">
                  {tool.available ? (
                    <a
                      href={tool.href}
                      className="inline-flex items-center gap-2 font-semibold text-violet-400 transition group-hover:text-violet-300"
                    >
                      Open tool <span>→</span>
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600">
                      Coming soon →
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              WHY AIVANTA
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              More focus. More possibilities.
            </h2>

            <p className="mt-5 leading-7 text-gray-400">
              A workspace built around simplicity, creativity and productivity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-[#101119] p-8"
              >
                <div className="mb-6 text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-4 text-sm leading-7 text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              SIMPLE PRICING
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Choose your plan<span className="text-violet-400">.</span>
            </h2>

            <p className="mt-5 text-gray-400">
              Start free. Explore more as Aivanta grows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-8 ${
                  plan.featured
                    ? "border-violet-500/60 bg-violet-500/[0.08]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.featured && (
                  <span className="mb-5 inline-block rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
                    Popular plan
                  </span>
                )}

                <h3 className="text-2xl font-bold">{plan.name}</h3>

                <p className="mt-3 text-sm text-gray-400">
                  {plan.description}
                </p>

                <p className="mt-8 text-4xl font-bold">{plan.price}</p>
                <p className="mt-2 text-xs text-gray-500">per month</p>

                <div className="my-8 h-px bg-white/10" />

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-sm text-gray-300"
                    >
                      <span className="text-violet-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="#tools"
                  className={`mt-9 block rounded-xl px-5 py-4 text-center text-sm font-semibold transition hover:opacity-90 ${
                    plan.featured
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                      : "border border-white/15 bg-white/[0.04] text-white"
                  }`}
                >
                  Get started
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-gray-500">
            Pricing is displayed for planning purposes. Paid subscriptions and
            premium features are not yet available.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <a href="/" className="text-2xl font-bold">
            aivanta<span className="text-violet-400">.</span>
          </a>

          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Aivanta. Built for ideas.
          </p>

          <a
            href="#tools"
            className="text-sm text-violet-400 hover:text-violet-300"
          >
            Explore tools ↑
          </a>
        </div>
      </footer>
    </main>
  );
}
