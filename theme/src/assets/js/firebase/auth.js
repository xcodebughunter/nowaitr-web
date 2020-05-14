//Facebook
const facebookProvider = new firebase.auth.FacebookAuthProvider();

// Google
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

function loadingOverlay(action) {
  $.LoadingOverlay(action, {
    size: 10,
    maxSize: 70,
    minSize: 50
  });
}


function toastError(error) {
  $.toast({
    heading: 'Error',
    text: error.message,
    position: 'buttom-right',
    bgColor: '#ff0000',
    loaderBg: '#6900ff',
    hideAfter: 3500,
    stack: 1
  });
}

function toastInfo(message) {
  $.toast({
    heading: 'Se ha completado el proceso',
    text: message,
    position: 'buttom-right',
    bgColor: '#00c936',
    loaderBg: '#42ff75',
    hideAfter: 5000,
    stack: 1
  });
}

function loadDataRes(uid) {
  return firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .get()
    .then(data => {
      window.localStorage.setItem('name_type_commerce', data.get('type_name'));
      window.localStorage.setItem('type_commerce', data.get('type_id'));

      return uid;
    });
}

function verifyCompleteConfig(uid) {
  firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .get()
    .then(user => {
      console.log(user);
      if (!user.get('step_1')) {
        window.location.href = '/pages/config/step1.html';
      } else if (!user.get('step_2')) {
        window.location.href = '/pages/config/step2.html';
      } else if (!user.get('step_3')) {
        window.location.href = '/pages/config/step3.html';
      } else if (!user.get('step_4')) {
        window.location.href = '/pages/config/step4.html';
      } else {
        window.location.href = '/';
      }
    });
}

function signInWithGoogle() {
  firebase
    .auth()
    .signInWithPopup(googleProvider)
    .then(res => {
      return loadDataRes(res.user.uid);
    })
    .then(uid => {
      verifyCompleteConfig(uid);
    })
    .catch(error => {
      toastError(error);
      console.log(error);
    });
}

function signInWithFacebook() {
  firebase
    .auth()
    .signInWithPopup(facebookProvider)
    .then(res => {
      return loadDataRes(res.user.uid);
    })
    .then(uid => {
      verifyCompleteConfig(uid);
    })
    .catch(error => {
      toastError(error);
      console.log(error);
    });
}

function signIn(e) {
  e.preventDefault();
  e.stopPropagation();

  const username = document.getElementById('field-username').value;
  const password = document.getElementById('field-password').value;

  loadingOverlay('show');

  firebase
    .auth()
    .signInWithEmailAndPassword(username, password)
    .then(res => {
      if (res.user.emailVerified) {
        return loadDataRes(res.user.uid);
      } else {
        return firebase.auth().signOut();
      }
    })
    .then(uid => {
      loadingOverlay('hide');
      if (uid) {
        verifyCompleteConfig(uid);
      } else {
        toastError({
          message: 'Su cuenta aun no ha sido verificada'
        });
      }
    })
    .catch(error => {
      loadingOverlay('hide');
      toastError(error);
      console.log(error);
    });
}

function signUp(e) {
  e.preventDefault();
  e.stopPropagation();

  const form = document.getElementById('form-signup');
  const fieldEmail = document.getElementById('field-email');
  const fieldPassword = document.getElementById('field-password');
  const fieldRePassword = document.getElementById('field-repassword');

  const email = fieldEmail.value;
  const password = fieldPassword.value;
  const repassword = fieldRePassword.value;

  if (password !== repassword) {
    document.getElementById(
      'messages'
    ).innerHTML = `<div class="alert alert-warning" role="alert">Password not matched</div>`;

    return false;
  }

  loadingOverlay('show');

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(res => {
      console.log(res);

      form.reset();

      $.toast({
        heading: 'Usuario registrado con exito',
        text: 'Se ha enviado un email de verificacion a su correo electronico',
        position: 'buttom-right',
        bgColor: '#20bf6b',
        loaderBg: '#6900ff',
        hideAfter: 3500,
        stack: 1
      });

      firebase.auth().languageCode = 'es';

      return res.user.sendEmailVerification();
    })
    .then(() => {
      setTimeout(() => {
        window.location.href = '/pages/signin.html';
      }, 3500);

      loadingOverlay('hide');
    })
    .catch(error => {
      console.log(error);

      toastError(error);
      loadingOverlay('hide');
    });
}

function signOut() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      window.localStorage.removeItem('uid');
      window.location.href = '/pages/signin.html';
    });
}

function forgotPassword(e) {
  e.preventDefault();
  e.stopPropagation();

  const email = document.getElementById('field-email').value;

  if (!!email) {
    loadingOverlay('show');
    firebase
      .auth()
      .sendPasswordResetEmail(email, {
        url: `${window.location.origin}/pages/signin.html`
      })
      .then(res => {
        loadingOverlay('hide');
        document.getElementById('field-email').value = '';
        toastInfo('se ha enviado un correo para restablecer su contraseña');
      })
      .catch(error => {
        loadingOverlay('hide');
        toastError(error);
        console.log(error);
      });
  }
}

function openModalTermsConditions() {
  $('#modal-term-conditions').modal('show');
}
