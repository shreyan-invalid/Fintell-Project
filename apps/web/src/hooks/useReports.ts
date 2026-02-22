import { useQuery } from "@tanstack/react-query";
import { fetchReports } from "../api/reports";

type Options = {
  enabled?: boolean;
};

export function useReports(options: Options = {}) {
  return useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
    staleTime: 1000 * 30,
    retry: 1,
    enabled: options.enabled ?? true
  });
}
