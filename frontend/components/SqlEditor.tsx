"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import type { CSSProperties } from "react";

export function SqlEditor({
  className = "min-h-[320px] flex-1 border-b border-line",
  dataTour,
  onChange,
  onRun,
  style,
  value,
}: {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  dataTour?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const handleMount: OnMount = (editor, monaco) => {
    if (!onRun) return;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun());
  };

  return (
    <div className={className} data-tour={dataTour} style={style}>
      <Editor
        height="100%"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onMount={handleMount}
        onChange={(next) => onChange(next ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 4,
          wordWrap: "on",
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}