const firebaseConfig = {
  apiKey: 'AIzaSyDeuAdbR8O8keXR8tE-H3Ew-vltQbXpgEA',
  authDomain: 'nowaitrapp.firebaseapp.com',
  databaseURL: 'https://nowaitrapp.firebaseio.com',
  projectId: 'nowaitrapp',
  storageBucket: 'nowaitrapp.appspot.com',
  messagingSenderId: '324819744044',
  appId: '1:324819744044:web:531b828d38a979fd'
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

function sendTokenToServer(token) {
  const uid = window.localStorage.getItem('uid');

  firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .set({
      token
    }, {
      merge: true
    });
}

function showToastNotification() {
  $.toast({
    heading: 'Se recibido una nueva orden',
    text: 'Nueva orden recibida.',
    position: "bottom-right",
    bgColor: '#20bf6b',
    loaderBg: '#6900ff',
    hideAfter: 5000,
    stack: 1,
  });
}


firebase.auth().onAuthStateChanged(function (user) {
  const routesRestricted = [
    '/',
    '/index.html',
    '/pages/manage-menu.html',
    '/pages/profile.html',
    '/pages/config/step1.html',
    '/pages/config/step2.html',
    '/pages/config/step3.html',
    '/pages/config/step4.html'
  ];

  if (!user) {
    if (
      routesRestricted.findIndex(
        route => route === window.location.pathname
      ) !== -1
    ) {
      window.location.href = '/pages/signin.html';
    }
  } else {
    window.currentUser = user;

    window.localStorage.setItem('uid', user.uid);

    const splitEvery = str => {
      return str.match(/.{1,18}/g).join(' ');
    };

    if (user.displayName) {
      $('.user-name').html(user.displayName);
    } else if (user.email) {
      $('.user-name').html(user.email);
    }

    if (user.photoURL) {
      $('.user-thumb img').attr('src', user.photoURL);
    }

    // Messaging

    // const messaging = firebase.messaging();

    // messaging.usePublicVapidKey('BG0Fd3bWzbiHCCfucpa2j8pQlHP1f4xdm8M9c7fE6P_ZSjI4FkUQgtcMrRadbQjMH3nJZ0djkIE6J1RuFMLjn9Y');

    // ion.sound({
    //   sounds: [{
    //     name: "door_bell",
    //   }],
    //   volume: 0.9,
    //   path: "/assets/sounds/",
    //   preload: true
    // });

    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker.register('/assets/js/firebase/firebase-messaging-sw.js').then((registration) => {
    //     messaging.useServiceWorker(registration);

    //     messaging
    //       .requestPermission()
    //       .then(() => {
    //         return messaging.getToken();
    //       })
    //       .then((token) => {
    //         sendTokenToServer(token);
    //       })
    //       .catch((err) => {
    //         console.log('Unable to get permission to notify.', err);
    //       });
    //   });
    // }

    // messaging.onMessage((payload) => {
    //   const context = new AudioContext();
    //   context.resume().then(() => {
    //     ion.sound.play("door_bell");
    //   });
    //   showToastNotification();
    //   console.log('Message received. ', payload);
    // });

  }


});
