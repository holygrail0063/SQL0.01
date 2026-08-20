"use client";

import Editor from "@monaco-editor/react";

export function SqlEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="min-h-[320px] flex-1 border-b border-line">
      <Editor
        height="100%"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
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
