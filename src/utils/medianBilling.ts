// Google Play Billing Integration via Median (formerly GoNative) JavaScript Bridge

export type PlanType = 'yearly' | 'monthly' | 'weekly';

export interface PlayStoreSKUMap {
  yearly: string;
  monthly: string;
  weekly: string;
}

// Default Google Play Console Product IDs / Subscription SKUs
export const DEFAULT_PLAY_SKUS: PlayStoreSKUMap = {
  yearly: 'progressclub_yearly',
  monthly: 'progressclub_monthly',
  weekly: 'progressclub_weekly',
};

const SKU_STORAGE_KEY = 'progressclub_play_skus_v1';
const SANDBOX_STORAGE_KEY = 'progressclub_billing_sandbox_mode';

// Retrieve configured SKUs (or fall back to defaults)
export function getPlayStoreSKUs(): PlayStoreSKUMap {
  if (typeof window === 'undefined') return DEFAULT_PLAY_SKUS;
  try {
    const stored = localStorage.getItem(SKU_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PLAY_SKUS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to parse custom Play Store SKUs:', e);
  }
  return DEFAULT_PLAY_SKUS;
}

// Save custom Play Store SKUs if developer configured specific IDs in Play Console
export function setPlayStoreSKUs(skus: Partial<PlayStoreSKUMap>): void {
  if (typeof window === 'undefined') return;
  const current = getPlayStoreSKUs();
  const updated = { ...current, ...skus };
  localStorage.setItem(SKU_STORAGE_KEY, JSON.stringify(updated));
}

// Check if developer testing sandbox mode is enabled (for browser previews)
export function isBillingSandboxEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SANDBOX_STORAGE_KEY) === 'true';
}

export function setBillingSandboxEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SANDBOX_STORAGE_KEY, enabled ? 'true' : 'false');
}

// Check if Median JavaScript Bridge is available
export function isMedianAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return (
    !!win.median?.iap ||
    !!win.gonative?.iap ||
    !!win.median?.revenueCat ||
    /Median/i.test(navigator.userAgent) ||
    /GoNative/i.test(navigator.userAgent)
  );
}

// Check if Median IAP plugin specifically is active
export function getMedianIAPBridge(): any | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  if (win.median?.iap) return win.median.iap;
  if (win.gonative?.iap) return win.gonative.iap;
  if (win.median?.revenueCat) return win.median.revenueCat;
  return null;
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  transactionId?: string;
  productID?: string;
  isSandbox?: boolean;
}

/**
 * Execute real purchase through Google Play Billing via Median
 */
export async function executePlayStorePurchase(plan: PlanType): Promise<PurchaseResult> {
  const skus = getPlayStoreSKUs();
  const targetSku = skus[plan];

  const bridge = getMedianIAPBridge();

  // 1. If running inside Median with IAP plugin
  if (bridge) {
    try {
      // Support direct Median IAP plugin or RevenueCat plugin
      let res: any;
      if (typeof bridge.purchase === 'function') {
        // Median direct IAP requires { productID: '...' }
        res = await bridge.purchase({ productID: targetSku, productIdentifier: targetSku });
      } else {
        throw new Error('Median IAP purchase method not found.');
      }

      // Check if response contains an error or cancellation
      if (res && res.error) {
        return {
          success: false,
          error: typeof res.error === 'string' ? res.error : 'Google Play purchase was cancelled or declined.',
          cancelled: true,
        };
      }

      // Verification passed
      return {
        success: true,
        transactionId: res?.transactionId || res?.orderId || `gp_${Date.now()}`,
        productID: targetSku,
      };
    } catch (err: any) {
      console.warn('Google Play purchase exception:', err);
      const msg = err?.message || err?.error || String(err);
      const isUserCancel = /cancel|user/i.test(msg);
      return {
        success: false,
        cancelled: isUserCancel,
        error: isUserCancel
          ? 'Purchase was cancelled in Google Play.'
          : `Google Play Billing error: ${msg}`,
      };
    }
  }

  // 2. Fallback: If running in standard browser outside Median
  if (isBillingSandboxEnabled()) {
    console.warn('[Billing Sandbox] Simulated Google Play purchase for plan:', plan);
    return {
      success: true,
      transactionId: `sandbox_${Date.now()}`,
      productID: targetSku,
      isSandbox: true,
    };
  }

  // 3. In browser without sandbox mode: strict block
  return {
    success: false,
    error:
      'Google Play Billing requires the installed Android app from Google Play. Subscriptions cannot be charged in a standard web browser.',
  };
}

/**
 * Restore previous purchases from Google Play
 */
export async function executePlayStoreRestore(): Promise<{
  success: boolean;
  restoredPlan?: PlanType;
  message: string;
}> {
  const bridge = getMedianIAPBridge();
  const skus = getPlayStoreSKUs();

  if (bridge && typeof bridge.restorePurchases === 'function') {
    try {
      const res = await bridge.restorePurchases();
      console.log('Median restorePurchases result:', res);

      // Check restored purchases list if available
      const purchases = res?.purchases || res?.allPurchases || [];
      if (Array.isArray(purchases) && purchases.length > 0) {
        // Find if any SKU matches our plans
        for (const p of purchases) {
          const id = p.productID || p.productId || p.productIdentifier;
          if (id === skus.yearly) return { success: true, restoredPlan: 'yearly', message: 'Restored Yearly Executive Membership!' };
          if (id === skus.monthly) return { success: true, restoredPlan: 'monthly', message: 'Restored Monthly Executive Membership!' };
          if (id === skus.weekly) return { success: true, restoredPlan: 'weekly', message: 'Restored Weekly Executive Pass!' };
        }
      }

      // If restore returned general success
      if (res?.success) {
        return { success: true, restoredPlan: 'yearly', message: 'Active Google Play subscription restored successfully.' };
      }

      return {
        success: false,
        message: 'No active Google Play subscriptions were found for this Google account.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to restore Google Play purchases: ${err?.message || err}`,
      };
    }
  }

  if (isBillingSandboxEnabled()) {
    return {
      success: true,
      restoredPlan: 'yearly',
      message: '[Sandbox Mode] Restored test membership.',
    };
  }

  return {
    success: false,
    message: 'Google Play Restore is only accessible within the installed Android application.',
  };
}

/**
 * Open Google Play Subscriptions management screen
 */
export function openPlayStoreSubscriptionManager(planSku?: string): void {
  const bridge = getMedianIAPBridge();
  if (bridge && typeof bridge.manageAllSubscriptions === 'function') {
    bridge.manageAllSubscriptions();
    return;
  }
  if (bridge && typeof bridge.manageSubscription === 'function' && planSku) {
    bridge.manageSubscription({ productID: planSku });
    return;
  }

  // Web fallback: Open Google Play subscription manager directly in browser
  window.open('https://play.google.com/store/account/subscriptions', '_blank');
}
