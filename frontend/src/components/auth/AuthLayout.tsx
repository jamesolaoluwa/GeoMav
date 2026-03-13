"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";
import { fadeUp, staggerContainer } from "@/lib/motion";

interface AuthLayoutProps {
  children: ReactNode;
}

function NetworkVisualization() {
  const nodes = [
    { id: "brand", cx: 200, cy: 200, r: 28, label: "You", color: "#1a1225" },
    { id: "chatgpt", cx: 80, cy: 80, r: 20, label: "ChatGPT", color: "#8B7CB5" },
    { id: "gemini", cx: 330, cy: 70, r: 20, label: "Gemini", color: "#6B8F71" },
    { id: "claude", cx: 340, cy: 300, r: 20, label: "Claude", color: "#B8A9D4" },
    { id: "perplexity", cx: 60, cy: 320, r: 20, label: "Perplexity", color: "#4A3F5C" },
    { id: "bing", cx: 200, cy: 380, r: 16, label: "Bing", color: "#8C8499" },
    { id: "deepseek", cx: 350, cy: 190, r: 18, label: "DeepSeek", color: "#4A7F8B" },
    { id: "n1", cx: 140, cy: 120, r: 6, label: "", color: "#B8A9D4" },
    { id: "n2", cx: 280, cy: 130, r: 5, label: "", color: "#6B8F71" },
    { id: "n3", cx: 290, cy: 260, r: 7, label: "", color: "#8B7CB5" },
    { id: "n4", cx: 110, cy: 260, r: 5, label: "", color: "#4A3F5C" },
    { id: "n5", cx: 160, cy: 330, r: 6, label: "", color: "#8C8499" },
  ];

  const edges = [
    { from: "brand", to: "chatgpt" },
    { from: "brand", to: "gemini" },
    { from: "brand", to: "claude" },
    { from: "brand", to: "perplexity" },
    { from: "brand", to: "bing" },
    { from: "brand", to: "deepseek" },
    { from: "chatgpt", to: "n1" },
    { from: "gemini", to: "n2" },
    { from: "claude", to: "n3" },
    { from: "perplexity", to: "n4" },
    { from: "bing", to: "n5" },
    { from: "n1", to: "brand" },
    { from: "n2", to: "brand" },
    { from: "n3", to: "brand" },
    { from: "n4", to: "brand" },
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex items-center justify-center"
    >
      <svg viewBox="0 0 400 440" className="w-full max-w-[360px]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          return (
            <motion.line
              key={`edge-${i}`}
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke="#B8A9D4"
              strokeWidth="1"
              strokeOpacity="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 + i * 0.06 }}
            />
          );
        })}

        {edges.slice(0, 5).map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          return (
            <motion.circle
              key={`pulse-${i}`}
              r="3"
              fill="#8B7CB5"
              opacity="0.7"
              filter="url(#glow)"
            >
              <animateMotion
                dur={`${2.5 + i * 0.4}s`}
                repeatCount="indefinite"
                path={`M${from.cx},${from.cy} L${to.cx},${to.cy}`}
              />
            </motion.circle>
          );
        })}

        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, type: "spring", stiffness: 200 }}
          >
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r + 4}
              fill={node.color}
              opacity="0.1"
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={node.color}
              className={node.id === "brand" ? "" : ""}
            />
            {node.label && (
              <text
                x={node.cx}
                y={node.cy + (node.r > 20 ? 1 : 0.5)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={node.r > 20 ? 10 : 7}
                fontWeight={node.id === "brand" ? "700" : "500"}
                fontFamily="var(--font-body), system-ui, sans-serif"
              >
                {node.label}
              </text>
            )}
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding/marketing */}
      <div
        className="hidden flex-col justify-between p-10 md:flex md:w-1/2 lg:p-14"
        style={{
          background:
            "linear-gradient(135deg, var(--color-hero) 0%, var(--color-page) 50%, rgba(184,169,212,0.15) 100%)",
        }}
      >
        <Logo className="hover:opacity-80 transition-opacity" />

        <div className="flex flex-col items-center gap-8">
          <NetworkVisualization />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-[400px] text-center"
          >
            <motion.h1
              variants={fadeUp}
              className="text-[2rem] leading-[1.15] tracking-[-0.02em] text-heading lg:text-[2.5rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Monitor Your AI Visibility
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-[1rem] leading-relaxed text-body"
            >
              Track how AI assistants represent your business across ChatGPT,
              Gemini, Claude, and more.
            </motion.p>
          </motion.div>
        </div>

        <div />
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center bg-white p-6 md:w-1/2 md:p-10 lg:p-14">
        {/* Mobile logo */}
        <div className="mb-8 md:hidden">
          <Logo className="hover:opacity-80 transition-opacity" />
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
