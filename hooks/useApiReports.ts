import { useEffect, useState } from "react";
import {
  IncidentReport,
  ApiResponse,
  convertApiToReport,
} from "@/data/MockReports";

const API_URL = "/api/reports";

export function useApiReports() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        const convertedReports = data.data.map(convertApiToReport);
        setReports(convertedReports);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch reports"
        );
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return { reports, loading, error };
}
