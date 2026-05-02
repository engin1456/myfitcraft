import { useEffect } from 'react';

import { isFirebaseConfigured } from '@/services/firebase';
import { subscribeToAuthChanges } from '@/services/auth.service';
import {
  ensureUserProfile,
  getUserProfile,
  updateUserProfile,
} from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';
import { useReportsStore } from '@/stores/reports.store';
import { useMeasurementsStore } from '@/stores/measurements.store';
import { useProgramsStore } from '@/stores/programs.store';

/**
 * Firebase auth state'ini dinleyip Zustand store'una senkronize eder.
 * Firebase yapılandırılmamışsa hata fırlatmadan store'u initialized işaretler.
 */
export function useAuthListener() {
  const setUid = useAuthStore((s) => s.setUid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInitialized(true);
      return;
    }

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (!user) {
        setUid(null);
        setProfile(null);
        // Logout: kullaniciya ozel cache'leri temizle
        useReportsStore.getState().reset();
        useMeasurementsStore.getState().reset();
        // Programs store reset (user programlari temizle)
        useProgramsStore.setState({
          presets: useProgramsStore.getState().presets,
          myPrograms: [],
          loaded: false,
        });
        setInitialized(true);
        return;
      }

      setUid(user.uid);
      try {
        // Profile yoksa oluştur (sosyal/ilk-açılış için), varsa fetch et
        let profile = await ensureUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        // Senkronizasyon: Firebase auth'da isim/foto var ama Firestore'da yoksa eşitle.
        // (Ör. registerden sonra fbUpdateProfile'dan önce auth event tetiklenmiş olabilir.)
        const patch: Partial<typeof profile> = {};
        if (!profile.displayName && user.displayName) patch.displayName = user.displayName;
        if (!profile.photoURL && user.photoURL) patch.photoURL = user.photoURL;
        if (!profile.email && user.email) patch.email = user.email;
        if (Object.keys(patch).length > 0) {
          try {
            await updateUserProfile(user.uid, patch);
            profile = { ...profile, ...patch };
          } catch {
            // sessizce geç — bir sonraki açılışta tekrar denenir
          }
        }
        setProfile(profile);
      } catch {
        // Firestore down ise profile null kalır, akış UI'da yönetilir
        const fallback = await getUserProfile(user.uid).catch(() => null);
        setProfile(fallback);
      } finally {
        setInitialized(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setUid, setProfile, setInitialized]);
}
