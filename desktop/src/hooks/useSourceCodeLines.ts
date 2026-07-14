import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseSourceCodeLinesResult {
  lines: string[];
  loading: boolean;
  error: string | null;
}

export function useSourceCodeLines(
  filePath: string | null,
  lineNumber: number | null,
  context: number = 3,
): UseSourceCodeLinesResult {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath || !lineNumber) {
      setLines([]);
      setError(null);
      return;
    }

    const fetchLines = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<string[]>("read_source_code_lines", {
          filePath,
          lineNumber,
          context,
        });
        setLines(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLines();
  }, [filePath, lineNumber, context]);

  return { lines, loading, error };
}
