// Analytics retirés dans le Studio EGEN : API compatible, sans effet.
const posthog = {
  capture: (..._args: unknown[]) => undefined,
  identify: (..._args: unknown[]) => undefined,
  reset: () => undefined,
  init: (..._args: unknown[]) => undefined,
};
export const usePostHog = () => posthog;
export default posthog;
