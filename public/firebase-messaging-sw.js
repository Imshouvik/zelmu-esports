importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAzlIfdJaMq3w-moUyHJWtR45y2vuUK9rs',
  authDomain: 'zelmu-6e7f3.firebaseapp.com',
  projectId: 'zelmu-6e7f3',
  storageBucket: 'zelmu-6e7f3.firebasestorage.app',
  messagingSenderId: '320824312979',
  appId: '1:320824312979:web:efd15b423728d1b02b3966',
  measurementId: 'G-ML3C4P95S8',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 