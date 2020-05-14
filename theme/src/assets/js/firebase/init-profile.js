function loadingOverlay(action) {
  $.LoadingOverlay(action, {
    size: 10,
    maxSize: 70,
    minSize: 50
  });
}

function toastAlert(message) {
  $.toast({
    heading: 'Alerta',
    text: message,
    position: 'buttom-right',
    bgColor: '#5cb85c',
    loaderBg: '#6900ff',
    hideAfter: 3500,
    stack: 1
  });
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

function uploadImageCoverProfile(uid, file) {
  const extension = file.name.split('.').pop();
  const storageRef = firebase.storage().ref();
  const newUploadRef = storageRef.child(`images/coverpage_${uid}.${extension}`);

  return handleUploadFile(newUploadRef, 'file', file);
}

function uploadImageQR(uid, file) {
  const storageRef = firebase.storage().ref();
  const newUploadRef = storageRef.child(`images/qr_${uid}.png`);

  return handleUploadFile(newUploadRef, 'base64', file);
}

function saveFormStep1(e) {
  e.preventDefault();

  const uid = localStorage.getItem('uid');

  const formAdmin = document.getElementById('form-step-1-admin');
  const formRes = document.getElementById('form-step-1-res');

  const nameAdmin = $('#field-name-admin').val();
  const phoneAdmin = $('#field-phone-admin').val();
  const emailAdmin = $('#field-email-admin').val();
  const cityRes = $('#field-city-restaurant').val();
  const nameRes = $('#field-name-restaurant').val();
  const nitRes = $('#field-nit-restaurant').val();
  const phoneRes = $('#field-phone-restaurant').val();
  const addressRes = $('#field-address-restaurant').val();
  const typeRes = $('#field-type-restaurant').val();
  const typeResName = $('#field-type-restaurant option:selected').text();

  const dataAdmin = {
    full_name: nameAdmin,
    phone: phoneAdmin,
    email: emailAdmin,
    step_1: true
  };

  const dataRes = {
    city: cityRes,
    name: nameRes,
    phone: phoneRes,
    address: addressRes,
    type_id: typeRes,
    type_name: typeResName,
    nit: nitRes
  };

  if (formAdmin.checkValidity() && formRes.checkValidity()) {
    const promiseAdmin = firebase
      .firestore()
      .collection('users')
      .doc(uid)
      .set(dataAdmin, {
        merge: true
      });

    const promiseRes = firebase
      .firestore()
      .collection('restaurants')
      .doc(uid)
      .set(dataRes, {
        merge: true
      });

    loadingOverlay('show');

    Promise.all([promiseAdmin, promiseRes])
      .then(res => {
        loadingOverlay('hide');

        window.currentUser.updateProfile({
          displayName: nameRes
        });

        window.localStorage.setItem('name_type_commerce', typeResName);
        window.localStorage.setItem('type_commerce', typeRes);

        window.location.href = '/pages/config/step2.html';
      })
      .catch(err => {
        loadingOverlay('hide');
        console.log(err);
      });
  } else {
    formAdmin.classList.add('was-validated');
    formRes.classList.add('was-validated');
  }
}

function saveFormStep2(e) {
  e.preventDefault();

  const uid = localStorage.getItem('uid');

  const [file] = document.getElementById('field-cover-image').files;

  if (file) {
    loadingOverlay('show');

    uploadImageCoverProfile(uid, file)
      .then(coverPageURL => {
        return firebase
          .firestore()
          .collection('restaurants')
          .doc(uid)
          .set({
            url_coverpage_image: coverPageURL
          }, {
            merge: true
          });
      })
      .then(res => {
        return firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .set({
            step_2: true
          }, {
            merge: true
          });
      })
      .then(() => {
        toastAlert('Se ha cargado su imagen');
        loadingOverlay('hide');

        setTimeout(() => {
          goStep(3);
        }, 500);
      })
      .catch(err => {
        loadingOverlay('hide');
        console.log(err);
      });
  } else {
    alert('Debes seleccionar una imagen');
  }
}

function saveFormStep4() {
  const uid = window.localStorage.getItem('uid');
  const checkboxs = $('.input_menu');
  const data = [];

  checkboxs.each((index, el) => {
    if ($(el).is(':checked')) {
      let id = $(el).attr('id');

      data.push({
        name: $(`label[for='${id}'`).text(),
        id: id,
        color: $(el).data('color'),
        order: $(el).data('order'),
        icon: $(el).data('icon')
      });
    }
  });

  loadingOverlay('show');

  const batch = firebase.firestore().batch();

  data.forEach(map => {
    let cref = firebase
      .firestore()
      .collection('restaurants')
      .doc(uid)
      .collection('menus')
      .doc();

    batch.set(cref, map);
  });

  batch
    .commit()
    .then(res => {
      console.log(res);
      loadingOverlay('hide');

      firebase
        .firestore()
        .collection('users')
        .doc(uid)
        .set({
          step_4: true
        }, {
          merge: true
        });

      setTimeout(() => {
        window.location.href = '/pages/manage-menu.html';
      }, 1000);
    })
    .catch(err => {
      loadingOverlay('hide');
      console.log(err);
    });
}

function generateQRImage() {
  const uid = window.localStorage.getItem('uid');
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

  setTimeout(() => {
    const image = container.querySelector('img');

    uploadImageQR(uid, image.src)
      .then(url => {
        const img = document.createElement('img');
        img.src = url;
        document.getElementById('image-qr-modal').innerHTML = '';
        document.getElementById('image-qr-modal').appendChild(img);

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
        return firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .set({
            step_3: true
          }, {
            merge: true
          });
      })
      .then(() => {
        loadingOverlay('hide');
        $('#modalDownloadQR').modal('show');
      })
      .catch(error => {
        console.log(error);
        loadingOverlay('hide');
      });
  }, 1500);
}

function downloadQRImage() {
  const uid = window.localStorage.getItem('uid');
  const img = document.getElementById('image-qr-modal').querySelector('img');

  const x = new XMLHttpRequest();
  x.open('GET', img.src, true);
  x.responseType = 'blob';
  x.onload = function (e) {
    download(x.response, `QR_${uid}.png`, 'image/png');

    setTimeout(() => {
      goStep(4);
    }, 2000);
  };
  x.send();
}

function goStep(step) {
  window.location.href = `/pages/config/step${step}.html`;
}