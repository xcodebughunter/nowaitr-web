function loadingOverlay(action) {
  $.LoadingOverlay(action, {
    size: 10,
    maxSize: 70,
    minSize: 50
  });
}

function clean(obj) {
  for (var propName in obj) {
    if (obj[propName] === null || obj[propName] === undefined) {
      delete obj[propName];
    }
  }
}

function dialogError(error) {
  $.toast({
    heading: 'Error',
    text: error.message,
    position: 'bottom-right',
    bgColor: '#ff0000',
    loaderBg: '#6900ff',
    hideAfter: 3500,
    stack: 1
  });
}

function uploadImage(file, restaurantID, entryID) {
  const extension = file.name.split('.')[file.name.length - 1];
  const storageRef = firebase.storage().ref();
  const newUploadRef = storageRef.child(`images/${entryID}.${extension}`);
  const uploadTask = newUploadRef.put(file);

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
        uploadTask.snapshot.ref
          .getDownloadURL()
          .then(function (downloadURL) {
            return firebase
              .firestore()
              .collection('restaurants')
              .doc(restaurantID)
              .collection('entries')
              .doc(entryID)
              .set({
                image: downloadURL
              }, {
                merge: true
              });
          })
          .then(() => {
            resolve(true);
          });
      }
    );
  });
}

function saveFormNewEntry(e) {
  e.preventDefault();
  e.stopPropagation();

  const uid = localStorage.getItem('uid');

  const formNewEntry = document.getElementById('form-new-entry');

  if (formNewEntry.checkValidity()) {
    const name = $('#field-name').val();
    const price = $('#field-price').val();
    const quantity = $('#field-quantity').val();
    const description = $('#field-description').val();
    const typeMenuId = $('#field-type-menu-entry').val();
    const typeMenuColor = $('#field-type-menu-entry option:selected').data(
      'color'
    );
    const coockingTime = $('#field-coocking-time').val();
    const typeMenuValue = $('#field-type-menu-entry option:selected').text();
    const size = $('input[name="field-size"]:checked').val();
    const [image] = document.getElementById('image-upload').files;

    const data = {
      name,
      price,
      quantity,
      description,
      coocking_time: coockingTime,
      type_menu_id: typeMenuId,
      type_menu_name: typeMenuValue,
      type_menu_color: typeMenuColor,
      size: size,
      image: ''
    };

    loadingOverlay('show');

    firebase
      .firestore()
      .collection('restaurants')
      .doc(uid)
      .collection('entries')
      .add(data)
      .then(response => {
        if (image) {
          return uploadImage(image, uid, response.id);
        }
        Promise.resolve(null);
      })
      .then(imageURL => {
        loadingOverlay('hide');

        $('#add-contact').modal('hide');

        formNewEntry.classList.remove('was-validated');
        formNewEntry.reset();
        $('.dropify-clear').click();

        loadDataEntries(typeMenuId);
      })
      .catch(err => {
        dialogError(err);
        loadingOverlay('hide');
      });
  } else {
    formNewEntry.classList.add('was-validated');
  }
}

function saveFormNewTypeMenu(e) {
  e.preventDefault();
  e.stopPropagation();

  const uid = localStorage.getItem('uid');

  const menuKey = $('#field-type-menu').val();
  const menuColor = $('#field-type-menu option:selected').data('color');
  const menuValue = $('#field-type-menu option:selected').text();
  const menuOrder = $('#field-type-menu option:selected').data('order');
  const menuIcon = $('#field-type-menu option:selected').data('icon');

  const data = {
    id: menuKey,
    name: menuValue,
    color: menuColor,
    order: menuOrder,
    icon: menuIcon
  };

  console.log(data);

  loadingOverlay('show');

  firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .collection('menus')
    .where('id', '==', menuKey)
    .get()
    .then(response => {
      const {
        empty
      } = response;

      if (empty) {
        firebase
          .firestore()
          .collection('restaurants')
          .doc(uid)
          .collection('menus')
          .add(data)
          .then(response => {
            loadingOverlay('hide');

            loadDataMenus();

            $('#add-label').modal('hide');
          })
          .catch(error => {
            dialogError(error);
            loadingOverlay('hide');
            $('#add-label').modal('hide');
          });
      } else {
        loadingOverlay('hide');
        $('#add-label').modal('hide');
        dialogError({
          message: 'Tipo de menu ya existe'
        });
      }
    })
    .catch(error => {
      dialogError(error);
      loadingOverlay('hide');
      $('#add-label').modal('hide');
    });
}

function saveFormEditEntry(e) {
  e.preventDefault();
  e.stopPropagation();

  loadingOverlay('show');

  const uid = localStorage.getItem('uid');
  const entriId = $('#field-edit-id-entry').val();

  const name = $('#field-edit-name').val();
  const price = $('#field-edit-price').val();
  const quantity = $('#field-edit-quantity').val();
  const description = $('#field-edit-description').val();
  const typeMenuId = $('#field-edit-type-menu-entry').val();
  const coockingTime = $('#field-edit-coocking-time').val();
  const typeMenuColor = $('#field-edit-type-menu-entry').data('color');
  const typeMenuValue = $('#field-edit-type-menu-entry option:selected').text();
  const size = $('input[name="field-edit-size"]:checked').val();
  const [image] = document.getElementById('field-edit-image-upload').files;

  const data = {
    name,
    price,
    quantity,
    description,
    coocking_time: coockingTime,
    type_menu_id: typeMenuId,
    type_menu_name: typeMenuValue,
    type_menu_color: typeMenuColor,
    size: size
  };

  clean(data);

  firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .collection('entries')
    .doc(entriId)
    .set(data, {
      merge: true
    })
    .then(() => {
      if (image) {
        return uploadImage(image, uid, entriId);
      }
      Promise.resolve(null);
    })
    .then(() => {
      $('#edit-entry').modal('hide');
      loadingOverlay('hide');

      if (window.currentTypeMenu) {
        loadDataEntries(window.currentTypeMenu);
      } else {
        loadDataEntries();
      }
    })
    .catch(error => {
      loadingOverlay('hide');
    });
}

function openModalEditEntry(entriId) {
  const uid = localStorage.getItem('uid');

  loadingOverlay('show');

  firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .collection('entries')
    .doc(entriId)
    .get()
    .then(response => {
      $('#edit-entry').modal('show');
      $('#field-edit-id-entry').val(entriId);

      $('#field-edit-name').val(response.get('name'));
      $('#field-edit-price').val(response.get('price'));
      $('#field-edit-quantity').val(response.get('quantity'));
      $('#field-edit-description').val(response.get('description'));
      $('#field-edit-coocking-time').val(response.get('coocking_time'));

      const radios = $('input:radio[name="field-edit-size"]');

      if (response.get('size')) {
        radios
          .filter('[value="' + response.get('size') + '"]')
          .prop('checked', true);
      }

      $('#field-edit-type-menu-entry').val(response.get('type_menu_id'));

      console.log(response);
      loadingOverlay('hide');
    })
    .catch(error => {
      loadingOverlay('hide');
    });
}

function loadDataEntries(menu) {
  const uid = localStorage.getItem('uid');
  const container = $('#container-entries');

  container.html('');

  const getSizeEntry = item => {
    if (item.get('size') === 'large') {
      return 'Grande';
    }

    if (item.get('size') === 'small') {
      return 'Pequeño';
    }

    if (item.get('size') === 'medium') {
      return 'Mediano';
    }

    return '';
  };

  let query = '';
  const ref = firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .collection('entries');

  if (menu) {
    query = ref.where('type_menu_id', '==', menu);
  } else {
    query = ref;
  }

  return query.get().then(response => {
    response.forEach(item => {
      const imageEntry = item.get('image') ?
        item.get('image') :
        '../assets/img/image-not-available.png';

      const template = `
        <!-- Begin | Column -->
        <div class="col-lg-4" id="${item.id}">
            <!-- Begin | Card [[ Find in card.scss ]] -->
            <div class="card-shadow card overflow-hidden">
                <!-- Begin | Contact Card [[ Find in contact.scss ]] -->
                <div class="contact-card">
                    <!-- Begin | Contact Content [[ Find in contact.scss ]] -->
                    <div class="contact-content">
                        <!-- Begin | Contact Header [[ Find in contact.scss ]] -->
                        <div class="d-flex p-3 contact-header">
                            <span class="contact-label-dot bg-${item.get(
                              'type_menu_color'
                            )}"></span>
                            <!-- Begin | Card Options [[ Find in card.scss ]] -->
                            <ul class="card-option d-flex ml-auto">
                                <li><a href="javascript:openModalEditEntry('${
                                  item.id
                                }')"><i class="mi mi-edit"></i></a></li>
                                <li><a href="javascript:deleteEntry('${
                                  item.id
                                }')"><i class="mi mi-delete"></i></a></li>
                            </ul>
                            <!-- End | Card Options -->
                        </div>
                        <!-- End | Contact Header -->
                        <img src="${imageEntry}" alt="img2" class="contact-img w-100">
                        <!-- Begin | Contact Description [[ Find in contact.scss ]] -->
                        <div class="contact-desc p-3">
                            <h6 class="h6">${item.get('name')}</h6>
                            <span class="d-block">${item.get(
                              'description'
                            )}</span>
                            <ul class="contact-info">
                                <li>
                                    <i class="mi font-16 mi-monetization-on"></i>
                                    <span>Precio final: ${item.get('price')}</span>
                                </li>
                                <li>
                                    <i class="mi font-16 mi-control-point"></i>
                                    <span>Cantidad: ${item.get(
                                      'quantity'
                                    )}</span>
                                </li>
                                <li>
                                    <i class="mi font-16 ion-android-list"></i>
                                    <span>${item.get('type_menu_name')}</span>
                                </li>
                            </ul>
                        </div>
                        <!-- End | Contact Description -->
                    </div>
                    <!-- End | Contact Content -->
                    <div class="d-flex align-items-center px-2 py-3">
                        <i class="mi mi-label mr-2"></i>
                        <span>${getSizeEntry(item)}</span>
                    </div>
                </div>
                <!-- End | Contact Card -->
            </div>
            <!-- End | Card -->
        </div>
        <!-- End | Column -->`;
      container.append(template);
    });
  });
}

function loadDataMenus() {
  const uid = localStorage.getItem('uid');
  const container = $('#container-menus');

  const selectTypeMenu = $('#field-type-menu-entry');
  const selectTypeMenuEdit = $('#field-edit-type-menu-entry');

  container.html('');

  selectTypeMenu
    .find('option')
    .remove()
    .end()
    .append('<option></option>');

  selectTypeMenuEdit
    .find('option')
    .remove()
    .end()
    .append('<option></option>');

  return firebase
    .firestore()
    .collection('restaurants')
    .doc(uid)
    .collection('menus')
    .orderBy('order')
    .get()
    .then(response => {
      response.forEach(item => {
        selectTypeMenu.append(
          `<option data-color="${item.get('color')}" data-icon="${item.get(
            'icon'
          )}" value="${item.get('id')}">${item.get('name')}</option>`
        );
        selectTypeMenuEdit.append(
          `<option data-color="${item.get('color')}" data-icon="${item.get(
            'icon'
          )}" value="${item.get('id')}">${item.get('name')}</option>`
        );
        container.append(
          `<li class="label-${item.get('color')}" id="${
            item.id
          }"><a href="javascript:filterEntryByMenu('${item.get(
            'id'
          )}')">${item.get('name')}</a>
          <button type="button" class="close" aria-label="Close" onclick="javascript:deleteTypeMenu('${
            item.id
          }')">
            <span aria-hidden="true">×</span>
          </button>
          </li>`
        );
      });
    });
}

function filterEntryByMenu(menu) {
  window.currentTypeMenu = menu;
  loadDataEntries(menu);
}

function deleteTypeMenu(typeMenuId) {
  const uid = window.localStorage.getItem('uid');

  if (confirm('Esta seguro de eliminar?')) {
    firebase
      .firestore()
      .collection('restaurants')
      .doc(uid)
      .collection('menus')
      .doc(typeMenuId)
      .delete();

    $(`#${typeMenuId}`).remove();
  }
}

function deleteEntry(entryID) {
  const uid = window.localStorage.getItem('uid');

  if (confirm('Esta seguro de eliminar?')) {
    firebase
      .firestore()
      .collection('restaurants')
      .doc(uid)
      .collection('entries')
      .doc(entryID)
      .delete();

    $(`#${entryID}`).remove();
  }
}

$(window).on('load', function () {
  loadingOverlay('show');

  const [, type] = window.localStorage.getItem('type_commerce').split('_');
  const select = $('#field-type-menu');

  window.dataMenusCommerce[type].forEach(item => {
    select.append(
      `<option data-color="${item['color']}" data-order="${
        item['order']
      }" data-icon="${item['icon']}" value="${item['key']}">${
        item['name']
      }</option>`
    );
  });

  Promise.all([loadDataEntries(), loadDataMenus()])
    .then(() => {
      loadingOverlay('hide');
    })
    .catch(() => {
      loadingOverlay('hide');
    });
});
