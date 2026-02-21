import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "../api/metrics";

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    staleTime: 1000 * 30,
    retry: 1
  });
}
