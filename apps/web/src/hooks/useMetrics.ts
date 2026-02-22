import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "../api/metrics";

type Options = {
  enabled?: boolean;
};

export function useMetrics(options: Options = {}) {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    staleTime: 1000 * 30,
    retry: 1,
    enabled: options.enabled ?? true
  });
}
