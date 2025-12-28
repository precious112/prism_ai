"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, Variants } from "framer-motion";
import { Search, Zap, BookOpen } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.main
        className="flex w-full max-w-5xl flex-col items-center gap-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div className="text-center space-y-6" variants={itemVariants}>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl">
            Prism AI
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-xl md:text-2xl">
            Experience the future of research. High-fidelity, real-time answers backed by deep web analysis.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 h-12 rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full"
          variants={itemVariants}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Deep Research</CardTitle>
              <CardDescription>
                Comprehensive analysis across multiple sources to provide thorough answers.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Watch the research process unfold live as Prism AI navigates the web.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Citations</CardTitle>
              <CardDescription>
                Every claim is backed by verified sources, ensuring trust and transparency.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
