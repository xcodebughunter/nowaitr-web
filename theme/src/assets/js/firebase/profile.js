function loadingOverlay(action) {
  $.LoadingOverlay(action, {
    size: 10,
    maxSize: 70,
    minSize: 50
  });
}

function updateProfileImage(url) {
  $('.user-profile img').attr('src', url);
  $('.user-thumb img').attr('src', url);
}

function updateQRImage(url) {
  $('#container-image-qr img').attr('src', url);
}

function updateCoverpageImage(url) {
  $('.card-img').css('background-image', `url(${url})`);
}

function handleUploadFile(refUpload, typeUpload, file) {
  var uploadTask = {};

  if (typeUpload === 'base64') {
    uploadTask = refUpload.putString(file, 'data_url');
  } else {
    uploadTask = refUpload.put(file);
  }

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      function (snapshot) {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      },
      function (error) {
        console.error(error);
        reject(error);
      },
      function () {
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          resolve(downloadURL);
        });
      }
    );
  });
}

function uploadImageQR(uid, file) {
  const storageRef = firebase.storage().ref();
  const newUploadRef = storageRef.child(`images/${uid}.png`);

  return handleUploadFile(newUploadRef, 'base64', file);
}

function uploadImageProfile(uid, file) {
  const extension = file.name.split('.').pop();
  const storageRef = firebase.storage().ref();
  const newUploadRef = storageRef.child(`images/profile_${uid}.${extension}`);

  return handleUploadFile(newUploadRef, 'file', file);
}

function uploadImageCoverProfile(uid, file) {
  const extension = file.name.split('.').pop();
  const storageRef = firebase.storage().ref();
  const newUploadRef = storageRef.child(`images/coverpage_${uid}.${extension}`);

  return handleUploadFile(newUploadRef, 'file', file);
}

function generateQR() {
  const uid = localStorage.getItem('uid');
  const container = document.getElementById('container-image-qr');
  container.innerHTML = '';

  loadingOverlay('show');

  const qrcode = new QRCode(container, {
    text: uid,
    width: 300,
    height: 300,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  const image = container.querySelector('img');

  setTimeout(() => {
    uploadImageQR(uid, image.src)
      .then(url => {
        return firebase
          .firestore()
          .collection('restaurants')
          .doc(uid)
          .set({
            url_qr_image: url
          }, {
            merge: true
          });
      })
      .then(() => {
        loadingOverlay('hide');
      })
      .catch(error => {
        console.log(error);
        loadingOverlay('hide');
      });
  }, 1500);
}

function downloadQRImage() {
  const container = document.getElementById('container-image-qr');
  const image = container.querySelector('img');

  const x = new XMLHttpRequest();
  x.open('GET', image.src, true);
  x.responseType = 'blob';
  x.onload = function (e) {
    download(x.response, 'QR.png', 'image/png');
  };
  x.send();
}

function downloadQRPdf() {
  const container = document.getElementById('container-image-qr');

  const image = container.querySelector('img');

  const doc = new jsPDF();

  doc.addImage(image, 'PNG', 50, 40, 100, 100);

  doc.save('qr.pdf');
}

function saveProfileAdmin(e) {
  e.preventDefault();

  const uid = localStorage.getItem('uid');
  const currentUser = firebase.auth().currentUser;

  const fullName = $('#field-name-admin').val();
  const email = $('#field-email-admin').val();
  const phone = $('#field-phone-admin').val();

  loadingOverlay('show');

  firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .set({
      full_name: fullName,
      email,
      phone
    }, {
      merge: true
    })
    .then(() => {
      currentUser.updateProfile({
        displayName: fullName
      });

      loadingOverlay('show');
    })
    .catch(error => {
      console.log(error);
      loadingOverlay('hide');
    });
}

function saveProfileRestaurant(e) {
  e.preventDefault();

  const uid = localStorage.getItem('uid');

  const name = $('#field-name-restaurant').val();
  const phone = $('#field-phone-restaurant').val();
  const address = $('#field-address-restaurant').val();
  const facebook = $('#field-social-facebook').val();
  const web = $('#field-social-web').val();
  const instagram = $('#field-social-instagram').val();
  const numTables = $('#field-num-tables-restaurant').val();

  const [image = null] = document.getElementById(
    'field-image-restaurant'
  ).files;
  const [imageCoverpage = null] = document.getElementById(
    'field-image-coverpage-restaurant'
  ).files;

  loadingOverlay('show');

  const data = {
    name: name,
    address: address,
    phone: phone,
    facebook: facebook,
    web: web,
    instagram: instagram,
    num_tables: numTables
  };

  const refRest = firebase
    .firestore()
    .collection('restaurants')
    .doc(uid);

  new Promise((resolve, reject) => {
      if (image) {
        return uploadImageProfile(uid, image)
          .then(resolve)
          .catch(reject);
      }
      resolve(null);
    })
    .then(imageURL => {
      if (imageURL) {
        data['url_profile_image'] = imageURL;
        window.currentUser.updateProfile({
          photoURL: imageURL
        });
        updateProfileImage(imageURL);
      }

      if (imageCoverpage) {
        return uploadImageCoverProfile(uid, imageCoverpage);
      }
      Promise.resolve(null);
    })
    .then(coverPageURL => {
      if (coverPageURL) {
        data['url_coverpage_image'] = coverPageURL;
        updateCoverpageImage(coverPageURL);
      }
      return refRest.set(data, {
        merge: true
      });
    })
    .then(() => {
      window.currentUser.updateProfile({
        displayName: name
      });
      loadingOverlay('hide');
    })
    .catch(() => {
      loadingOverlay('hide');
    });
}

function loadDataProfileAdmin() {
  const uid = localStorage.getItem('uid');

  return firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .get()
    .then(res => {
      $('#field-name-admin').val(res.get('full_name'));
      $('#field-email-admin').val(res.get('email'));
      $('#field-phone-admin').val(res.get('phone'));
      $('#name-admin').html(res.get('full_name'));

      if (window.currentUser.photoURL) {
        updateProfileImage(window.currentUser.photoURL);
      }
    })
    .catch(console.log);
}

function loadDataProfileRestaurant() {
  const uid = localStorage.getItem('uid');

  return firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .get()
    .then(res => {
      $('#field-name-restaurant').val(res.get('name'));
      $('#field-phone-restaurant').val(res.get('phone'));
      $('#field-address-restaurant').val(res.get('address'));
      $('#field-social-facebook').val(res.get('facebook'));
      $('#field-social-web').val(res.get('web'));
      $('#field-social-instagram').val(res.get('instagram'));
      $('#field-city-restaurant').val(res.get('city'));
      $('#field-num-tables-restaurant').val(res.get('num_tables'));
      $('#field-nit').val(res.get('nit'));

      if (res.get('url_qr_image')) {
        updateQRImage(res.get('url_qr_image'));
      }

      if (res.get('url_coverpage_image')) {
        updateCoverpageImage(res.get('url_coverpage_image'));
      }
    })
    .catch(console.log);
}

$(window).on('load', function () {
  loadingOverlay('show');

  Promise.all([loadDataProfileAdmin(), loadDataProfileRestaurant()])
    .then(() => {
      loadingOverlay('hide');
    })
    .catch(() => {
      loadingOverlay('hide');
    });
});
