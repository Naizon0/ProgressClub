// Google Play Billing Integration
// Supports:
// 1. Google Play Digital Goods API (for PWABuilder / Bubblewrap / Trusted Web Activities - 100% Free)
// 2. Median / GoNative JavaScript Bridge (Native wrapper fallback)

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

// Purge any legacy sandbox flags
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('progressclub_billing_sandbox_mode');
  } catch {}
}

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

// Get Google Play Digital Goods Service (standard for TWA / PWABuilder on Android)
export async function getDigitalGoodsService(): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  const win = window as any;

  if (typeof win.getDigitalGoodsService === 'function') {
    try {
      const service = await win.getDigitalGoodsService('https://play.google.com/billing');
      return service;
    } catch (err) {
      console.info('DigitalGoodsService not active in current window context:', err);
      return null;
    }
  }
  return null;
}

export type BillingEnvironment = 'digital_goods' | 'median' | 'twa_standalone' | 'web_browser';

export interface BillingEnvironmentInfo {
  type: BillingEnvironment;
  label: string;
  isNativePlayBilling: boolean;
  description: string;
}

/**
 * Detect runtime environment and Google Play connection state
 */
export async function detectBillingEnvironment(): Promise<BillingEnvironmentInfo> {
  if (typeof window === 'undefined') {
    return {
      type: 'web_browser',
      label: 'Web Browser',
      isNativePlayBilling: false,
      description: 'Server / SSR environment',
    };
  }

  // 1. Check if Digital Goods API is directly connected (PWABuilder / TWA)
  const dgService = await getDigitalGoodsService();
  if (dgService) {
    return {
      type: 'digital_goods',
      label: 'Google Play (Digital Goods / TWA)',
      isNativePlayBilling: true,
      description: 'Connected directly to Google Play Billing through Trusted Web Activity.',
    };
  }

  // 2. Check if Median IAP bridge is available
  if (isMedianAvailable()) {
    return {
      type: 'median',
      label: 'Median Native Bridge',
      isNativePlayBilling: true,
      description: 'Connected to Google Play Billing through Median container.',
    };
  }

  // 3. Check if installed as standalone PWA / TWA on Android
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  if (isStandalone) {
    return {
      type: 'twa_standalone',
      label: 'Installed Android App',
      isNativePlayBilling: true,
      description: 'Running inside installed Android app. Subscriptions connect to Google Play.',
    };
  }

  return {
    type: 'web_browser',
    label: 'Web Preview (Browser)',
    isNativePlayBilling: false,
    description: 'Running in a web browser. Native Google Play sheets trigger inside the installed Android app.',
  };
}

/**
 * Check if Play Billing is available via any supported mechanism
 */
export async function isPlayBillingAvailable(): Promise<boolean> {
  const env = await detectBillingEnvironment();
  return env.isNativePlayBilling;
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  transactionId?: string;
  productID?: string;
}

/**
 * Execute real purchase through Google Play Billing
 * Tries:
 * 1. Google Play Digital Goods API (PWABuilder / TWA)
 * 2. Median / GoNative IAP Bridge
 */
export async function executePlayStorePurchase(plan: PlanType): Promise<PurchaseResult> {
  const skus = getPlayStoreSKUs();
  const targetSku = skus[plan];

  const planLabel = plan === 'yearly' ? 'Yearly' : plan === 'monthly' ? 'Monthly' : 'Weekly';
  const planPrice = plan === 'yearly' ? '12.00' : plan === 'monthly' ? '5.50' : '1.50';

  // --------------------------------------------------------------------------
  // PATH 1: Google Play Digital Goods API (Free PWABuilder / Bubblewrap / TWA)
  // --------------------------------------------------------------------------
  const digitalGoods = await getDigitalGoodsService();
  if (digitalGoods) {
    try {
      // Validate PaymentRequest support in Chromium
      if (typeof window.PaymentRequest === 'undefined') {
        throw new Error('PaymentRequest API is not supported in this browser.');
      }

      const paymentMethodData = [
        {
          supportedMethods: 'https://play.google.com/billing',
          data: {
            sku: targetSku,
          },
        },
      ];

      const paymentDetails = {
        total: {
          label: `Progress Club ${planLabel} Membership`,
          amount: {
            currency: 'USD',
            value: planPrice,
          },
        },
      };

      const request = new PaymentRequest(paymentMethodData, paymentDetails);
      const paymentResponse = await request.show();

      const purchaseToken =
        paymentResponse?.details?.purchaseToken ||
        paymentResponse?.details?.token ||
        `play_${Date.now()}`;

      // Acknowledge subscription with Google Play
      if (typeof digitalGoods.acknowledge === 'function' && purchaseToken) {
        try {
          await digitalGoods.acknowledge(purchaseToken, 'repeatable');
        } catch (ackErr) {
          console.warn('DigitalGoods acknowledgement note:', ackErr);
        }
      }

      // Complete payment response
      if (typeof paymentResponse.complete === 'function') {
        await paymentResponse.complete('success');
      }

      return {
        success: true,
        transactionId: purchaseToken,
        productID: targetSku,
      };
    } catch (err: any) {
      console.warn('Digital Goods purchase error:', err);
      const msg = err?.message || String(err);
      const isUserCancel =
        err?.name === 'AbortError' ||
        /cancel|user|abort|closed/i.test(msg);

      return {
        success: false,
        cancelled: isUserCancel,
        error: isUserCancel
          ? 'Google Play purchase was cancelled.'
          : `Google Play Billing error: ${msg}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // PATH 2: Median IAP Bridge (if running inside configured Median app)
  // --------------------------------------------------------------------------
  const bridge = getMedianIAPBridge();
  if (bridge) {
    try {
      let res: any;
      if (typeof bridge.purchase === 'function') {
        res = await bridge.purchase({ productID: targetSku, productIdentifier: targetSku });
      } else {
        throw new Error('Median IAP purchase method not found.');
      }

      if (res && res.error) {
        return {
          success: false,
          error: typeof res.error === 'string' ? res.error : 'Google Play purchase was cancelled or declined.',
          cancelled: true,
        };
      }

      return {
        success: true,
        transactionId: res?.transactionId || res?.orderId || `gp_${Date.now()}`,
        productID: targetSku,
      };
    } catch (err: any) {
      console.warn('Median Google Play purchase error:', err);
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

  // --------------------------------------------------------------------------
  // PATH 3: Standard Web Browser Outside Android Wrapper
  // --------------------------------------------------------------------------
  return {
    success: false,
    error:
      'Google Play Billing requires the installed Android app (via PWABuilder / TWA). Subscriptions cannot be processed in a standard web browser tab.',
  };
}

/**
 * Restore previous purchases from Google Play
 * Checks:
 * 1. Google Play Digital Goods API (TWA / PWABuilder)
 * 2. Median IAP Bridge
 */
export async function executePlayStoreRestore(): Promise<{
  success: boolean;
  restoredPlan?: PlanType;
  message: string;
}> {
  const skus = getPlayStoreSKUs();

  // 1. Digital Goods API restore
  const digitalGoods = await getDigitalGoodsService();
  if (digitalGoods && typeof digitalGoods.listPurchases === 'function') {
    try {
      const purchases = await digitalGoods.listPurchases();
      if (Array.isArray(purchases) && purchases.length > 0) {
        for (const p of purchases) {
          const id = p.itemId || p.sku || p.productIdentifier;
          if (id === skus.yearly) return { success: true, restoredPlan: 'yearly', message: 'Restored Yearly Executive Membership via Google Play!' };
          if (id === skus.monthly) return { success: true, restoredPlan: 'monthly', message: 'Restored Monthly Executive Membership via Google Play!' };
          if (id === skus.weekly) return { success: true, restoredPlan: 'weekly', message: 'Restored Weekly Executive Pass via Google Play!' };
        }
      }

      // Check listPurchaseHistory if available
      if (typeof digitalGoods.listPurchaseHistory === 'function') {
        const history = await digitalGoods.listPurchaseHistory();
        if (Array.isArray(history) && history.length > 0) {
          for (const p of history) {
            const id = p.itemId || p.sku || p.productIdentifier;
            if (id === skus.yearly) return { success: true, restoredPlan: 'yearly', message: 'Restored Yearly Executive Membership via Google Play!' };
            if (id === skus.monthly) return { success: true, restoredPlan: 'monthly', message: 'Restored Monthly Executive Membership via Google Play!' };
            if (id === skus.weekly) return { success: true, restoredPlan: 'weekly', message: 'Restored Weekly Executive Pass via Google Play!' };
          }
        }
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

  // 2. Median IAP Bridge restore
  const bridge = getMedianIAPBridge();
  if (bridge && typeof bridge.restorePurchases === 'function') {
    try {
      const res = await bridge.restorePurchases();
      const purchases = res?.purchases || res?.allPurchases || [];
      if (Array.isArray(purchases) && purchases.length > 0) {
        for (const p of purchases) {
          const id = p.productID || p.productId || p.productIdentifier;
          if (id === skus.yearly) return { success: true, restoredPlan: 'yearly', message: 'Restored Yearly Executive Membership!' };
          if (id === skus.monthly) return { success: true, restoredPlan: 'monthly', message: 'Restored Monthly Executive Membership!' };
          if (id === skus.weekly) return { success: true, restoredPlan: 'weekly', message: 'Restored Weekly Executive Pass!' };
        }
      }

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

  // Web / Android fallback: Open Google Play subscription manager directly in browser
  window.open('https://play.google.com/store/account/subscriptions', '_blank');
}
