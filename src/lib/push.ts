const PUBLIC_VAPID_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || '';
const SERVICE_WORKER_PATH = '/service-worker.js';

export type PushSupportState = {
  supported: boolean;
  secureContext: boolean;
  hasPublicKey: boolean;
  permission: NotificationPermission | 'unsupported';
  standalone: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function getPushSupportState(): PushSupportState {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      secureContext: false,
      hasPublicKey: false,
      permission: 'unsupported',
      standalone: false,
    };
  }

  const secureContext = window.isSecureContext || window.location.hostname === 'localhost';
  const supported =
    secureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (typeof navigator !== 'undefined' && 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  return {
    supported,
    secureContext,
    hasPublicKey: Boolean(PUBLIC_VAPID_KEY),
    permission: supported ? Notification.permission : 'unsupported',
    standalone,
  };
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  await navigator.serviceWorker.ready;
  return registration;
}

export async function getExistingPushSubscription() {
  const support = getPushSupportState();
  if (!support.supported || !support.hasPublicKey) {
    return null;
  }

  const registration = await registerServiceWorker();
  return registration.pushManager.getSubscription();
}

export async function subscribeCurrentDeviceToPush() {
  const support = getPushSupportState();

  if (!support.supported) {
    throw new Error('Push notifications are not supported on this device/browser.');
  }

  if (!support.hasPublicKey) {
    throw new Error('Web Push is not configured yet. Missing VAPID public key.');
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission is blocked in this browser.');
  }

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await registerServiceWorker();
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
  });
}

export async function unsubscribeCurrentDeviceFromPush() {
  const registration = await registerServiceWorker();
  const existingSubscription = await registration.pushManager.getSubscription();

  if (!existingSubscription) {
    return null;
  }

  const endpoint = existingSubscription.endpoint;
  await existingSubscription.unsubscribe();
  return endpoint;
}
