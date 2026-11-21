
const tools = [
  {
    icon: "✍️",
    name: "AI Writer",
    description: "Write essays, emails, articles and professional content.",
    tag: "Writing",
    href: "/writer",
  },
  {
    icon: "💡",
    name: "Business Name Generator",
    description: "Discover creative names and ideas for your next business.",
    tag: "Business",
    href: "#",
  },
  {
    icon: "📄",
    name: "CV Builder",
    description: "Create professional CVs that help you stand out.",
    tag: "Career",
    href: "#",
  },
  {
    icon: "📱",
    name: "Social Media Generator",
    description: "Generate captions, posts and content ideas.",
    tag: "Social",
    href: "#",
  },
  {
    icon: "💻",
    name: "Coding Assistant",
    description: "Understand code, solve problems and build projects.",
    tag: "Development",
    href: "#",
  },
  {
    icon: "🎓",
    name: "Study Assistant",
    description: "Learn difficult topics and understand concepts faster.",
    tag: "Education",
    href: "#",
  },
];

const plans = [
  {
    name: "Free",
    price: "KSh 0",
    description: "Get started with AI.",
    features: ["Limited AI usage", "Basic tools", "Standard responses"],
    featured: false,
  },
  {
    name: "Pro",
    price: "KSh 499",
    description: "For everyday creators.",
    features: [
      "Higher usage limits",
      "All standard tools",
      "Faster responses",
      "More generations",
    ],
    featured: true,
  },
  {
    name: "Ultimate",
    price: "KSh 999",
    description: "For people who want more.",
    features: [
      "Highest usage limits",
      "Advanced AI features",
      "Priority access",
      "Everything in Pro",
    ],
    featured: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-xl font-bold">
            A
          </div>
          <span className="text-2xl font-bold tracking-tight">
            aivanta<span className="text-violet-400">.</span>
          </span>
        </a>

        <div className="hidden items-center gap-9 text-sm text-gray-400 md:flex">
          <a href="#tools" className="hover:text-white">AI Tools</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </div>

        <a href="#tools" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-200">
          Get started
        </a>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-28 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-10 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="relative">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-300">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            One workspace. Endless possibilities.
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Everything you need.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-gray-400">
            Write, create, learn and build with powerful AI tools
            in one simple workspace. Turn your ideas into something
            extraordinary.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#tools" className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-4 font-semibold transition hover:scale-105">
              Explore AI tools →
            </a>
            <a href="#pricing" className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-semibold hover:bg-white/10">
              View pricing
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Built for creators, students, developers and dreamers.
          </p>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
            Your AI workspace
          </p>
          <h2 className="text-3xl font-bold sm:text-5xl">
            Meet your new toolkit.
          </h2>
          <p className="mt-4 text-gray-400">
            Everything you need to bring your next idea to life.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-violet-500/[0.06]"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-4xl">{tool.icon}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                  {tool.tag}
                </span>
              </div>

              <h3 className="text-xl font-semibold">{tool.name}</h3>
              <p className="mt-3 leading-7 text-gray-400">
                {tool.description}
              </p>

              <a
                href={tool.href}
                className="mt-7 block text-sm font-semibold text-violet-400 transition hover:text-violet-300"
              >
                {tool.href === "/writer" ? "Open AI Writer →" : "Coming soon →"}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              Why Aivanta?
            </p>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              Less switching.
              <br />
              More creating.
            </h2>
            <p className="mt-6 max-w-lg leading-8 text-gray-400">
              Stop jumping between different platforms. Aivanta
              brings useful AI tools together so you can focus on
              doing your best work.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              ["✦", "Everything in one place", "Your essential AI tools in one workspace."],
              ["⚡", "Save valuable time", "Spend less time on repetitive tasks."],
              ["🌍", "Made for everyone", "Useful whether you're learning, working or creating."],
            ].map(([icon, title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-[#101117] p-6">
                <div className="flex gap-4">
                  <span className="text-2xl text-violet-400">{icon}</span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Simple pricing
          </p>
          <h2 className="text-4xl font-bold sm:text-5xl">
            Choose your power.
          </h2>
          <p className="mt-4 text-gray-400">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.featured
                  ? "border-violet-500 bg-violet-500/[0.09] shadow-xl shadow-violet-950/30"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {plan.featured && (
                <div className="mb-5 inline-block rounded-full bg-violet-500 px-3 py-1 text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{plan.description}</p>

              <div className="mt-7 text-4xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-gray-400"> / month</span>
              </div>

              <div className="my-8 h-px bg-white/10" />

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-violet-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#tools"
                className={`mt-9 block rounded-xl px-5 py-3 text-center text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-violet-600 hover:bg-violet-500"
                    : "border border-white/15 hover:bg-white/10"
                }`}
              >
                Get started
              </a>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center">
        <p className="text-xl font-bold">
          aivanta<span className="text-violet-400">.</span>
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Your ideas, powered by AI.
        </p>
        <p className="mt-5 text-xs text-gray-600">
          © {new Date().getFullYear()} Aivanta. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
