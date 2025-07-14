"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
// @ts-ignore
import { messaging as messagingRaw, getToken as getTokenRaw, onMessage as onMessageRaw } from '@/utils/firebase';
// @ts-ignore
const messaging: any = messagingRaw;
// @ts-ignore
const getToken: any = getTokenRaw;
// @ts-ignore
const onMessage: any = onMessageRaw;

const VAPID_KEY = 'BKKnWz8gEgTbgihzBowSE90_lMZ2lYWXE06ByN1Uf_hFp-3yglYRELYosMKUd35AFx1A6i3-b7swnTSwIXDeuhw';

export default function NotificationSetup() {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isClient, setIsClient] = useState(false);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        console.log('Notification permission:', permission);
        
        if (permission === 'granted' && messaging && typeof getToken === 'function') {
          // Register service worker and get token
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service worker registered');
          
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
          if (currentToken) {
            console.log('FCM token obtained:', currentToken);
            
            // Save token to localStorage for now
            localStorage.setItem('fcm_token', currentToken);
            
            // If user is logged in, save to database
            const { data } = await supabase!.auth.getUser();
            if (data.user) {
              const { error } = await supabase!
                .from('users')
                .update({ fcm_token: currentToken })
                .eq('id', data.user.id);
              
              if (error) {
                console.error('Failed to save FCM token:', error);
              } else {
                console.log('FCM token saved to DB');
              }
            }
          } else {
            console.log('No registration token available.');
          }
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    } else {
      console.log('Notifications not supported in this browser');
    }
  };

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    // Check current permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      
      // If permission is not granted, request it
      if (Notification.permission === 'default') {
        requestNotificationPermission();
      } else if (Notification.permission === 'granted') {
        // Permission already granted, proceed with setup
        requestNotificationPermission();
      }
    }
    
    // Listen for foreground messages only if messaging is available
    if (messaging && typeof onMessage === 'function') {
      onMessage(messaging, (payload: any) => {
        console.log('Message received. ', payload);
        // Optionally show a toast or in-app notification
      });
    }
  }, []);

  // Don't render anything until client-side
  if (!isClient) {
    return null;
  }

  // Show a small indicator for debugging (you can remove this later)
  if (permissionStatus === 'default' && typeof window !== 'undefined') {
    return (
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
        <div>Notification: {permissionStatus}</div>
        <button onClick={requestNotificationPermission} style={{ background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginTop: '5px' }}>
          Enable Notifications
        </button>
      </div>
    );
  }

  return null;
} 