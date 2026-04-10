"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

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
    <div className="mx-auto max-w-lg">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="size-3.5" />
        Back to projects
      </button>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-base font-semibold text-zinc-900">Create project</h2>
          <p className="mt-0.5 text-[0.8rem] text-zinc-500">
            Add your site details. You can configure the widget after.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="wizard-name" className="text-[0.8rem] text-zinc-700">
              Project name
            </Label>
            <Input
              id="wizard-name"
              placeholder="My Portfolio"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-url" className="text-[0.8rem] text-zinc-700">
              Website URL
            </Label>
            <Input
              id="wizard-url"
              type="url"
              placeholder="https://myapp.com"
              value={websiteUrl}
              onChange={(e) => onWebsiteUrlChange(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.8rem] text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800"
            disabled={!canSubmit || creating}
            onClick={() => void onSubmit()}
          >
            {creating ? "Creating…" : "Create project"}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
