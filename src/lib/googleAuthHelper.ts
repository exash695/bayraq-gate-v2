// Google Identity Services (GIS) Account Selector Helper
// Opens Google's native account chooser with select_account prompt
// Pure Google Identity Services without Firebase dependency

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "728585268376-hf25klmd55cjomn0cuhso6qno10gn977.apps.googleusercontent.com";

function loadGoogleGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window is undefined'));
    
    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }
    
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('فشل تحميل محرك مصادقة Google')));
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('تعذر تحميل واجهة تسجيل الدخول من Google'));
    document.head.appendChild(script);
  });
}

/**
 * Prompts Google's native Account Chooser popup listing all user Gmail accounts.
 * Uses the robust OAuth2 Token Client flow which is compatible with iframes and mobile devices.
 */
export async function promptGoogleAccountPicker(): Promise<{ email: string; name?: string; photoURL?: string; uid: string }> {
  await loadGoogleGsiScript();

  return new Promise((resolve, reject) => {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        throw new Error('محرك حسابات Google غير متاح حالياً. يرجى إعادة تحميل الصفحة.');
      }

      // Initialize the Token Client which opens a standard browser popup
      // This flow is highly stable and bypasses the FedCM/Iframe constraints
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === 'access_denied') {
              return reject(new Error('تم إلغاء اختيار الحساب من قبل المستخدم'));
            }
            return reject(new Error(`خطأ في مصادقة Google: ${tokenResponse.error}`));
          }

          if (tokenResponse.access_token) {
            try {
              // Fetch user profile info using the access token
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });

              if (!userInfoRes.ok) {
                throw new Error('فشل استرجاع بيانات الحساب من خوادم Google');
              }

              const profile = await userInfoRes.json();
              
              if (!profile.email) {
                throw new Error('لم يتم العثور على بريد إلكتروني في الحساب المختار');
              }

              return resolve({
                email: profile.email.trim().toLowerCase(),
                name: profile.name || profile.given_name || profile.email.split('@')[0],
                photoURL: profile.picture || undefined,
                uid: profile.sub || `g_${Date.now()}`
              });
            } catch (err: any) {
              console.error('Error fetching Google user profile:', err);
              return reject(new Error('حدث خطأ أثناء استلام بيانات الحساب من Google'));
            }
          }
          
          return reject(new Error('فشل استلام تفويض صالح من Google'));
        },
        error_callback: (err: any) => {
          console.error('GSI Popup Error:', err);
          reject(new Error('فشل فتح نافذة تسجيل الدخول. يرجى التأكد من عدم حظر النوافذ المنبثقة.'));
        }
      });

      // Request the access token - this will open the native Google Account Picker popup
      client.requestAccessToken();

    } catch (err: any) {
      console.error('Google Auth Initialization Error:', err);
      reject(err);
    }
  });
}
