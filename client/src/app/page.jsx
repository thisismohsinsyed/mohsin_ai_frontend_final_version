"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence
} from "framer-motion";
import {
  Mic,
  Zap,
  Activity,
  Users,
  Globe,
  BarChart,
  Shield,
  Code,
  Headphones,
  Calendar,
  TrendingUp,
  Upload,
  Settings,
  Radio,
  CheckCircle2,
  ArrowRight,
  Play,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

// --- COMPONENTS ---

export default function HomePage() {
  const [activeUseCase, setActiveUseCase] = useState("support");
  const containerRef = useRef(null);

  // Parallax hook
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <main ref={containerRef} className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-indigo-500/30 selection:text-indigo-900 overflow-hidden">

      {/* Decorative Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left Content */}
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:w-1/2 space-y-8 text-center lg:text-left relative z-20"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-sm font-medium hover:border-indigo-200 transition-colors cursor-pointer">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                v2.0 Now Available
                <div className="w-px h-3 bg-slate-300 mx-1"></div>
                <span className="text-indigo-600 font-semibold flex items-center">
                  What's New <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] text-slate-900"
              >
                The new standard for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 animate-gradient-x">
                  Voice AI Agents
                </span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Build human-like voice agents with <span className="text-slate-900 font-semibold">&lt;300ms latency</span>.
                Deploy scalable, conversational AI that feels natural and instantaneous.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link href="/voice_agent">
                  <Button size="lg" className="h-14 px-8 text-base bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1">
                    Start Building Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/voice_lab">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                    <Play className="w-4 h-4 mr-2" />
                    View Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center justify-center lg:justify-start gap-8 pt-6 border-t border-slate-200/60 mt-8 max-w-md mx-auto lg:mx-0">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative">
                      {/* Placeholder avatars */}
                      <div className={`w-full h-full bg-gradient-to-br from-indigo-${i * 100} to-purple-${i * 100} opacity-80`}></div>
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    +2k
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-slate-900 font-bold">
                    ⭐⭐⭐⭐⭐ 5.0
                  </div>
                  <span className="text-slate-500">from 200+ developer reviews</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Advanced 3D Mock UI */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -10, rotateX: 5 }}
              animate={{ opacity: 1, scale: 1, rotateY: -5, rotateX: 2 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="lg:w-1/2 w-full perspective-1000 relative z-20"
            >
              {/* Floating Elements (Decorative) */}
              <FloatingBadge icon={<Zap className="text-yellow-500" />} text="30ms Latency" className="-top-10 -left-10 delay-700" />
              <FloatingBadge icon={<Globe className="text-blue-500" />} text="50+ Languages" className="top_20 -right-12 delay-1000" />
              <FloatingBadge icon={<Shield className="text-green-500" />} text="SOC2 Secure" className="-bottom-8 left-10 delay-1500" />

              <div className="relative bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 p-6 transform transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0 group">
                {/* Glass Reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-[2.5rem] pointer-events-none"></div>

                {/* UI Header */}
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] border border-[#E0443E]"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] border border-[#D89E24]"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-[#28C840] border border-[#1AAB29]"></div>
                  </div>
                  <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-mono text-slate-500 font-medium tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    VOICE_AGENT_V2.ACTIVE
                  </div>
                </div>

                {/* Chat Area */}
                <div className="space-y-6 min-h-[300px] relative">

                  {/* AI Message */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-white p-5 rounded-3xl rounded-tl-none text-slate-700 text-[15px] leading-relaxed shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100/60 max-w-[85%]">
                      <p className="mb-3 font-medium text-slate-900">Hello Alex 👋</p>
                      <TypewriterText text="I've analyzed your customer support metrics. Call resolution time needs optimization. Shall I activate the new turbo-model?" />
                    </div>
                  </motion.div>

                  {/* User Message */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 }}
                    className="flex items-start gap-4 justify-end"
                  >
                    <div className="bg-slate-900 p-5 rounded-3xl rounded-tr-none text-white text-[15px] leading-relaxed shadow-lg max-w-[80%]">
                      Yes, please deploy it immediately. Also, give me a summary of today's traffic.
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 border-2 border-white overflow-hidden shadow-md flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-tl from-slate-400 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">YOU</div>
                    </div>
                  </motion.div>

                  {/* AI Status / Thinking */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.5 }}
                    className="flex items-center gap-3 absolute bottom-0 left-0"
                  >
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-75"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Processing request...</span>
                  </motion.div>

                </div>

                {/* Voice Visualizer */}
                <div className="mt-8 bg-slate-50/80 backdrop-blur rounded-2xl p-5 flex items-center justify-between border border-slate-100/80">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  </div>
                  <div className="flex items-center gap-[3px] h-10 mx-6 flex-1 justify-center mask-gradient">
                    {[...Array(32)].map((_, i) => (
                      <VisualizerBar key={i} delay={i * 0.03} />
                    ))}
                  </div>
                  <div className="text-xs font-mono font-medium text-slate-500 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">01:42</div>
                </div>

              </div>

            </motion.div>

          </div>
        </div>
      </section>

      {/* --- LOGO CLOUD --- */}
      <section className="py-10 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by engineering teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-60">
            {['Acme Corp', 'GlobalTech', 'Nebula', 'Velocity', 'CodeFlow'].map((name, i) => (
              <span key={i} className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-800 rounded-md"></div> {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8"
          >
            <StatItem icon={<Zap />} value="<300ms" label="Ultra-low Latency" desc="Faster than human reaction time" />
            <StatItem icon={<Activity />} value="99.99%" label="Uptime SLA" desc="Enterprise-grade reliability" />
            <StatItem icon={<Users />} value="10k+" label="Concurent Calls" desc="Scales automatically with traffic" />
            <StatItem icon={<Globe />} value="50+" label="Global Languages" desc="Real-time translation & accents" />
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 bg-slate-50/50 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-100/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Everything you need to build <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">World-Class Voice Agents</span>
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed">
              A comprehensive platform designed for developers who demand control, speed, and quality.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Real-time Streaming"
              description="Bidirectional WebSockets with VAD (Voice Activity Detection) ensures natural, interruption-free dialogue."
              color="indigo"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Instant Voice Cloning"
              description="Zero-shot voice cloning. Upload a 10s sample and start generating speech that sounds exactly like the source."
              color="purple"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Multi-language Engine"
              description="Automatic language detection and switching. Support for mixed-language conversations out of the box."
              color="pink"
            />
            <FeatureCard
              icon={<Code className="w-6 h-6" />}
              title="Function Calling"
              description="Give your agent tools. Retrieve data, book appointments, or control devices via structured JSON outputs."
              color="blue"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Enterprise Security"
              description="SOC 2 Type II compliant. End-to-end encryption. Private networking options available."
              color="emerald"
            />
            <FeatureCard
              icon={<BarChart className="w-6 h-6" />}
              title="Deep Analytics"
              description="Full conversation logs, sentiment analysis, audio recordings, and granular usage metrics."
              color="orange"
            />
          </motion.div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">From Zero to Production</h2>
            <p className="text-slate-500 mt-4 text-lg">Launch your first agent in minutes, not months.</p>
          </motion.div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[2.25rem] left-0 w-full h-0.5 bg-slate-100 z-0"></div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-4 gap-12 relative z-10"
            >
              <StepCard
                number="01"
                title="Clone or Pick"
                desc="Choose a pre-made voice or clone your own for a unique brand identity."
                icon={<Upload className="w-5 h-5" />}
              />
              <StepCard
                number="02"
                title="Configure"
                desc="Define system prompt, available tools, and knowledge base access."
                icon={<Settings className="w-5 h-5" />}
              />
              <StepCard
                number="03"
                title="Test & Tweak"
                desc="Interact in the playground. Adjust latency vs. quality settings in real-time."
                icon={<Radio className="w-5 h-5" />}
              />
              <StepCard
                number="04"
                title="Deploy"
                desc="Get your API key and connect via WebSocket. Scale instantly."
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- INTERACTIVE USE CASES --- */}
      <section className="py-32 bg-[#0F172A] text-white overflow-hidden relative">
        {/* Abstract Background */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20">

            {/* Left Menu */}
            <div className="lg:w-5/12 space-y-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  Use Cases
                </div>
                <h2 className="text-4xl font-bold mb-4 leading-tight">Prepared for any <br /> scenario.</h2>
                <p className="text-slate-400 text-lg">Our models are fine-tuned for diverse industry applications, ensuring context awareness and reliability.</p>
              </motion.div>

              <div className="space-y-4">
                <UseCaseButton
                  active={activeUseCase === 'support'}
                  onClick={() => setActiveUseCase('support')}
                  icon={<Headphones />}
                  title="Customer Support"
                  desc="Automate Tier 1 calls, verify identities, and handle FAQs."
                />
                <UseCaseButton
                  active={activeUseCase === 'appointments'}
                  onClick={() => setActiveUseCase('appointments')}
                  icon={<Calendar />}
                  title="Scheduling & Bookings"
                  desc="Manage calendars, book slots, and send reminders."
                />
                <UseCaseButton
                  active={activeUseCase === 'sales'}
                  onClick={() => setActiveUseCase('sales')}
                  icon={<TrendingUp />}
                  title="Sales Qualification"
                  desc="Qualify leads, gather requirements, and route to reps."
                />
              </div>
            </div>

            {/* Right Content Preview */}
            <div className="lg:w-7/12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeUseCase}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-[2rem] p-10 h-full relative overflow-hidden flex flex-col justify-between group"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-900/50">
                      {activeUseCase === 'support' && <Headphones className="w-8 h-8 text-white" />}
                      {activeUseCase === 'appointments' && <Calendar className="w-8 h-8 text-white" />}
                      {activeUseCase === 'sales' && <TrendingUp className="w-8 h-8 text-white" />}
                    </div>

                    <h3 className="text-3xl font-bold mb-4">
                      {activeUseCase === 'support' && "24/7 Intelligent Support"}
                      {activeUseCase === 'appointments' && "Smart Scheduling Assistant"}
                      {activeUseCase === 'sales' && "AI Sales Representative"}
                    </h3>
                    <p className="text-indigo-200/80 leading-relaxed mb-10 text-lg max-w-xl">
                      {activeUseCase === 'support' && "Reduce wait times to zero. Handle thousands of concurrent calls with a consistent, polite, and helpful tone. Seamlessly hand off complex issues to human agents with full context."}
                      {activeUseCase === 'appointments' && "Eliminate the back-and-forth of scheduling. Integrating directly with Google Calendar, Outlook, and CRMs to find the perfect time slot for your customers."}
                      {activeUseCase === 'sales' && "Engage leads instantly when they show interest. Qualify prospects based on budget, timeline, and needs before your expensive sales team spends a minute."}
                    </p>

                    <ul className="space-y-4 mb-12">
                      {[
                        activeUseCase === 'support' ? 'Context Retention' : 'Real-time Availability',
                        'Sentiment Analysis',
                        'CRM Integration'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-700/50 pt-8 mt-auto relative z-10">
                    <span className="text-sm text-slate-400 font-medium">Ready to deploy?</span>
                    <Link href="/voice_agent">
                      <button className="text-sm font-bold text-white hover:text-indigo-300 transition-colors flex items-center">
                        Start building now <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-white shadow-2xl relative overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/30 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3"></div>

            <h2 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight relative z-10">Ready to transform your <br /> UX with Voice?</h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">
              Join 10,000+ developers building the future of conversational AI. Start your free trial today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/voice_agent">
                <Button size="lg" className="h-16 px-10 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full shadow-lg font-bold">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg border-white/20 text-white bg-transparent hover:bg-white/10 rounded-full font-bold">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}

// --- SUBCOMPONENTS ---

function FloatingBadge({ icon, text, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className={`absolute bg-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 z-30 ${className}`}
    >
      <div className="p-2 bg-slate-50 rounded-lg">
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{text}</span>
    </motion.div>
  )
}

function TypewriterText({ text }) {
  const [displayedText, setDisplayedText] = useState("");
  const isInView = useInView(useRef(null), { once: true });

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text, isInView]);

  // We return a ref-less div just to trigger the effect on mount, 
  // but in reality we'd attach ref to container. For simplicity here:
  return <span>{displayedText}<span className="animate-pulse">|</span></span>;
}

function VisualizerBar({ delay }) {
  return (
    <motion.div
      className="w-1.5 bg-indigo-500 rounded-full"
      animate={{
        height: ["20%", "60%", "30%", "80%", "40%"],
        backgroundColor: ["#6366f1", "#8b5cf6", "#6366f1"]
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    />
  );
}

function StatItem({ icon, value, label, desc }) {
  return (
    <motion.div variants={fadeInUp} className="flex flex-col text-left group cursor-default">
      <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl w-fit text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <div className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">{value}</div>
      <div className="text-base font-bold text-slate-900 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-500">{desc}</div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  const colorMap = {
    indigo: "text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600",
    purple: "text-purple-600 bg-purple-50 group-hover:bg-purple-600",
    pink: "text-pink-600 bg-pink-50 group-hover:bg-pink-600",
    blue: "text-blue-600 bg-blue-50 group-hover:bg-blue-600",
    emerald: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600",
    orange: "text-orange-600 bg-orange-50 group-hover:bg-orange-600",
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8 }}
      className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
    >
      <div className={`mb-6 p-4 rounded-2xl w-fit transition-colors ${colorMap[color]} group-hover:text-white`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}

function StepCard({ number, title, desc, icon }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group text-center md:text-left z-10"
    >
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 w-12 h-12 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm shadow-sm z-20">
        {number}
      </div>
      <div className="pt-6">
        <div className="mb-4 mx-auto md:mx-0 w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </motion.div>
  );
}

function UseCaseButton({ active, onClick, icon, title, desc }) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${active
        ? 'bg-white/10 border-indigo-500/50 shadow-lg'
        : 'bg-transparent border-transparent hover:bg-white/5'
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div>
          <h3 className={`font-bold text-lg ${active ? 'text-white' : 'text-slate-300'}`}>{title}</h3>
          {active && desc && <p className="text-sm text-slate-400 mt-2 leading-relaxed">{desc}</p>}
        </div>
      </div>
    </div>
  );
}
