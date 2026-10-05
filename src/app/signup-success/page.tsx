"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { motion } from "motion/react";

function SignupSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasPendingRoleRequest = searchParams.get("pending") === "role";

  // Auto-redirect after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      <WebsiteShaderCanvas
        preset="aurora-veil"
        tone="dark"
        className="absolute inset-0 h-full w-full"
      >
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.2, visualDuration: 0.4 }}
            className="w-full max-w-md text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
            >
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <svg
                    className="h-24 w-24"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="24" cy="24" r="22" className="fill-emerald-500/20" />
                    <path
                      d="M14 24C14 28.4183 17.5817 32 22 32C26.4183 32 30 28.4183 30 24"
                      stroke="url(#check-gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18.3535 18.3536C19.74 16.967 22.26 16.967 23.6465 18.3536L28 22.697"
                      stroke="url(#check-gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="check-gradient" x1="0" y1="0" x2="48" y2="48">
                        <stop offset="0%" className="stop-emerald-400" />
                        <stop offset="100%" className="stop-teal-400" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Confirmation Message */}
              <motion.h1
                key="headline"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", bounce: 0.3 }}
                className="text-3xl font-bold tracking-tight text-white mb-3"
              >
                Account created. FOMO officially cancelled.
              </motion.h1>

              <motion.p
                key="subtext"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring", bounce: 0.3 }}
                className="text-white/50 mb-8"
              >
                {hasPendingRoleRequest ? "Your organizer access request is waiting for approval. You can still explore events as a Club Participant." : "Check your inbox if email confirmation is enabled, then explore events and connect with your community."}
              </motion.p>

              {/* Navigation Buttons */}
              <motion.div
                key="buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring", bounce: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:from-emerald-400 hover:to-teal-400"
                >
                  Explore Events
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/login")}
                  className="rounded-lg border border-white/20 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.1]"
                >
                  Log In Again
                </motion.button>
              </motion.div>

              {/* Progress Indicator */}
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 flex items-center justify-center gap-3 text-xs text-white/30"
              >
                <div className="h-1 w-12 rounded-full bg-emerald-500/50 overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  />
                </div>
                <span>Redirecting...</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </WebsiteShaderCanvas>
    </div>
  );
}

export default function SignupSuccessPage() {
  return <Suspense fallback={<div className="min-h-[calc(100dvh-4rem)] bg-black" />}><SignupSuccessContent /></Suspense>;
}
