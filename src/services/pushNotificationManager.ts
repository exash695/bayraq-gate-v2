/**
 * خدمة إدارة الإشعارات الخارجية وتوكنات الأجهزة (FCM / Mobile Push Notification Manager)
 * متوافقة مع تطبيق بوابة بيرق - Bayraq Gate
 */

export interface DeviceTokenPayload {
  userId: string;
  token: string;
  platform?: 'android' | 'ios' | 'web';
  deviceModel?: string;
  schoolId?: string;
  role?: string;
}

export interface PermissionResult {
  success: boolean;
  status: 'granted' | 'denied' | 'default' | 'iframe_restricted' | 'unsupported';
  message: string;
}

class PushNotificationManager {
  private registeredToken: string | null = null;
  private currentUserId: string | null = null;

  /**
   * تسجيل توكن الجهاز في السيرفر
   */
  public async registerToken(payload: DeviceTokenPayload): Promise<boolean> {
    try {
      if (!payload.userId || !payload.token) return false;
      
      this.currentUserId = payload.userId;
      this.registeredToken = payload.token;

      // حفظ محلياً لتفادي التكرار
      try {
        localStorage.setItem('bayraq_fcm_token', payload.token);
        localStorage.setItem('bayraq_fcm_user', payload.userId);
      } catch (e) {}

      const response = await fetch('/api/notifications/register-device-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          platform: payload.platform || (this.isNativeMobile() ? 'android' : 'web'),
          deviceModel: payload.deviceModel || (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'Unknown')
        })
      });

      if (!response.ok) {
        console.warn("[PushManager] Failed to register token on server:", response.status);
        return false;
      }

      const resData = await response.json();
      console.log("[PushManager] Device token successfully registered with Bayraq Gate Server:", resData);
      return true;
    } catch (err) {
      console.error("[PushManager] Error registering device token:", err);
      return false;
    }
  }

  /**
   * فحص ما إذا كان التطبيق يعمل داخل iframe (مثل إطار معاينة AI Studio)
   */
  public isInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * تهيئة استماع الإشعارات في بيئة الموبايل (Capacitor Push Notifications)
   */
  public async initNativePush(userId: string, role = 'student', schoolId = ''): Promise<void> {
    if (typeof window === 'undefined') return;

    this.currentUserId = userId;

    // فحص ما إذا كان التطبيق يعمل كـ Capacitor Native
    const cap = (window as any).Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      try {
        const PushNotifications = (cap.Plugins && cap.Plugins.PushNotifications) || (window as any).PushNotifications;
        if (PushNotifications) {
          // طلب الصلاحيات
          const permResult = await PushNotifications.requestPermissions();
          if (permResult.receive === 'granted') {
            await PushNotifications.register();

            // الاستماع للحصول على التوكن
            PushNotifications.addListener('registration', async (tokenData: any) => {
              const tokenValue = tokenData?.value || tokenData;
              if (tokenValue) {
                await this.registerToken({
                  userId,
                  token: String(tokenValue),
                  platform: cap.getPlatform ? cap.getPlatform() : 'android',
                  schoolId,
                  role
                });
              }
            });

            // الاستماع لوصول إشعار أثناء فتح التطبيق
            PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
              console.log("[PushManager] Push Notification Received in Foreground:", notification);
            });

            // الاستماع عند نقر المستخدم على الإشعار من شريط التنبيهات
            PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
              console.log("[PushManager] User clicked push notification:", action);
              const notifData = action.notification?.data;
              if (notifData?.route && typeof window !== 'undefined') {
                window.location.hash = notifData.route;
              }
            });
          }
        }
      } catch (err) {
        console.warn("[PushManager] Native push notification registration handled with fallback:", err);
      }
    } else {
      // بيئة الويب والمتصفح (Web Notification API)
      this.initWebNotifications(userId);
    }
  }

  /**
   * تهيئة إشعارات الويب والمتصفحات وتسجيل الـ Service Worker (Web Notifications & SW)
   */
  public async initWebNotifications(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // تسجيل الـ Service Worker إن وجد
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log("[PushManager] Web Service Worker registered successfully with scope:", registration.scope);
      } catch (swErr) {
        console.warn("[PushManager] Service Worker registration failed:", swErr);
      }
    }

    if (!('Notification' in window)) return;

    try {
      if (Notification.permission === 'granted') {
        let token = localStorage.getItem('bayraq_web_token');
        if (!token) {
          token = `web_token_${userId}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('bayraq_web_token', token);
        }
        await this.registerToken({
          userId,
          token,
          platform: 'web',
          deviceModel: navigator.userAgent.slice(0, 100)
        });
      }
    } catch (e) {}
  }

  /**
   * طلب إذن الإشعارات من المستخدم يدوياً مع إرجاع تشخيص دقيق للنتيجة
   */
  public async requestWebPermission(userId: string): Promise<PermissionResult> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        success: false,
        status: 'unsupported',
        message: 'متصفحك الحالي لا يدعم ميزة إشعارات الويب.'
      };
    }

    // فحص ما إذا كان التطبيق يعمل داخل إطار iframe
    const isFramed = this.isInIframe();

    // إذا كان الإذن ممنوعاً بالفعل مسبقاً في المتصفح
    if (Notification.permission === 'denied') {
      return {
        success: false,
        status: 'denied',
        message: 'تم حظر الإشعارات مسبقاً في إعدادات المتصفح لهذا الرابط. يرجى تفعيلها من إعدادات الموقع بجانب شريط العنوان.'
      };
    }

    // طلب الإذن باستخدام Polyfill متوافق مع الموبايل وأجهزة أندرويد
    try {
      const askPermission = (): Promise<NotificationPermission> => {
        return new Promise((resolve, reject) => {
          try {
            // دعم الطريقتين: Promise و Callback القديمة
            const p = Notification.requestPermission((result) => {
              if (result) resolve(result);
            });
            if (p && typeof (p as any).then === 'function') {
              (p as Promise<NotificationPermission>).then(resolve).catch(reject);
            }
          } catch (err) {
            reject(err);
          }
        });
      };

      const permission = await askPermission();

      if (permission === 'granted') {
        let token = localStorage.getItem('bayraq_web_token');
        if (!token) {
          token = `web_token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          localStorage.setItem('bayraq_web_token', token);
        }
        await this.registerToken({
          userId,
          token,
          platform: 'web',
          deviceModel: navigator.userAgent.slice(0, 100)
        });

        // إشعار ترحيبي فوري للمستخدم
        this.showLocalNotification('تم تفعيل التنبيهات الخارجية بنجاح', {
          body: 'ستصلك الآن تنبيهات الواجبات، الأقساط، والتقارير المدرسية مباشرة على جهازك.',
          icon: '/logo.png'
        });

        return {
          success: true,
          status: 'granted',
          message: 'تم تفعيل إشعارات المتصفح بنجاح!'
        };
      } else if (permission === 'denied') {
        return {
          success: false,
          status: 'denied',
          message: isFramed
            ? 'متصفح Chrome يمنع طلب الإشعارات داخل إطار المعاينة. افتح الرابط المباشر للتفعيل.'
            : 'تم رفض إذن الإشعارات من المتصفح.'
        };
      } else {
        return {
          success: false,
          status: 'default',
          message: isFramed 
            ? 'يتطلب متصفح Chrome فتح الرابط المباشر للمنصة لمنح إذن الإشعارات.'
            : 'تم إلغاء طلب الإذن دون تأكيد.'
        };
      }
    } catch (err: any) {
      console.warn("[PushManager] requestPermission error:", err);
      if (isFramed || (err && String(err.message || '').includes('iframe'))) {
        return {
          success: false,
          status: 'iframe_restricted',
          message: 'متصفح Chrome يمنع طلب الإشعارات من داخل إطار المعاينة. يرجى فتح الرابط المباشر للمنصة لتفعيل الإشعارات بنقرة واحدة.'
        };
      }
      return {
        success: false,
        status: 'denied',
        message: err?.message || 'تعذر طلب الإذن من المتصفح.'
      };
    }
  }

  /**
   * إرسال إشعار خارجي موثق باسم «بوابة بيرق» عبر المتصفح أو الـ Service Worker
   */
  public showLocalNotification(title: string, options?: NotificationOptions): void {
    if (typeof window === 'undefined') return;

    const finalTitle = title.includes('بوابة بيرق') ? title : `بوابة بيرق: ${title}`;
    const defaultOptions: NotificationOptions = {
      icon: '/logo.png',
      badge: '/logo.png',
      dir: 'rtl',
      lang: 'ar',
      ...options
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      // الأفضلية للـ Service Worker لضمان استمرار الإشعار عند تصغير النافذة
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(finalTitle, defaultOptions).catch(() => {
            new Notification(finalTitle, defaultOptions);
          });
        }).catch(() => {
          new Notification(finalTitle, defaultOptions);
        });
      } else {
        new Notification(finalTitle, defaultOptions);
      }
    }
  }

  private isNativeMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).Capacitor?.isNativePlatform?.());
  }
}

export const pushNotificationManager = new PushNotificationManager();
