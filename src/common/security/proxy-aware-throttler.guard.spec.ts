import { ProxyAwareThrottlerGuard } from './proxy-aware-throttler.guard';

/**
 * Regression lock: the throttler must bucket on the resolved client IP, not the
 * proxy IP — so one abusive client cannot rate-limit everyone behind a reverse proxy.
 */
describe('ProxyAwareThrottlerGuard.getTracker', () => {
  const guard = Object.create(ProxyAwareThrottlerGuard.prototype) as ProxyAwareThrottlerGuard;
  const track = (req: unknown): Promise<string> =>
    (guard as unknown as { getTracker(r: unknown): Promise<string> }).getTracker(req);

  it('keys on req.ip directly', async () => {
    expect(await track({ ip: '203.0.113.9' })).toBe('203.0.113.9');
  });
});
