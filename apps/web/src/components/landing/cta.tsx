"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24 px-6">
      <motion.div
        className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/20 p-12 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Ready to see your tests clearly?
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Get started in minutes. No credit card required.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
