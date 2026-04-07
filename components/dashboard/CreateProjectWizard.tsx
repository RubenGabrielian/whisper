"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CreateProjectWizardProps = {
  name: string;
  websiteUrl: string;
  onNameChange: (v: string) => void;
  onWebsiteUrlChange: (v: string) => void;
  onSubmit: () => void | Promise<void>;
  onBack: () => void;
  creating: boolean;
  error: string | null;
  canSubmit: boolean;
};

export function CreateProjectWizard({
  name,
  websiteUrl,
  onNameChange,
  onWebsiteUrlChange,
  onSubmit,
  onBack,
  creating,
  error,
  canSubmit,
}: CreateProjectWizardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      className="mx-auto max-w-xl"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Sparkles className="size-6 text-cyan-600" aria-hidden />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900">New project</h3>
          <p className="mt-1 text-sm text-slate-600">
            Name your site and add its production URL. You&apos;ll configure the widget next.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="wizard-name" className="text-slate-800">
              Project name
            </Label>
            <Input
              id="wizard-name"
              placeholder="My Portfolio"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="h-12 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-url" className="text-slate-800">
              Website URL
            </Label>
            <Input
              id="wizard-url"
              type="url"
              placeholder="https://myapp.com"
              value={websiteUrl}
              onChange={(e) => onWebsiteUrlChange(e.target.value)}
              className="h-12 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <Button
          type="button"
          className="mt-8 w-full bg-cyan-600 text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 disabled:opacity-50"
          disabled={!canSubmit || creating}
          onClick={() => void onSubmit()}
        >
          {creating ? "Creating…" : "Create project"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}
