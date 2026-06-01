"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type ModifierTemplateSettingsProps = {
  initialMultiSelect?: boolean;
  initialMaxSelections?: number;
};

export function ModifierTemplateSettings({
  initialMultiSelect = false,
  initialMaxSelections = 2,
}: ModifierTemplateSettingsProps) {
  const [multiSelect, setMultiSelect] = React.useState(initialMultiSelect);
  const [maxSelections, setMaxSelections] = React.useState(String(initialMaxSelections));

  return (
    <>
      <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
        <input
          name="multiSelect"
          type="checkbox"
          defaultChecked={initialMultiSelect}
          onChange={(event) => setMultiSelect(event.currentTarget.checked)}
          className="field-checkbox"
        />
        Multi-select
      </label>

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Badge variant={multiSelect ? "primary" : "default"}>
          {multiSelect ? "Multi-select" : "Single-select"}
        </Badge>
        {multiSelect ? <Badge variant="primary">Max {maxSelections}</Badge> : null}
      </div>

      {multiSelect ? (
        <label className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">Max selections</span>
          <Input
            name="maxSelections"
            type="number"
            min="1"
            step="1"
            defaultValue={initialMaxSelections}
            onChange={(event) => setMaxSelections(event.currentTarget.value)}
            required
          />
          <span className="text-xs text-muted-foreground">
            Multi-select groups can choose up to this many options.
          </span>
        </label>
      ) : null}
    </>
  );
}
