const language = {
  sProcessing: "Procesando...",
  sLengthMenu: "Mostrar _MENU_ registros",
  sZeroRecords: "No se encontraron resultados",
  sEmptyTable: "Ningún dato disponible en esta tabla =(",
  sInfo:
    "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
  sInfoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
  sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
  sInfoPostFix: "",
  sSearch: "Buscar:",
  sUrl: "",
  sInfoThousands: ",",
  sLoadingRecords: "Cargando...",
  oPaginate: {
    sFirst: "Primero",
    sLast: "Último",
    sNext: "Siguiente",
    sPrevious: "Anterior"
  },
  oAria: {
    sSortAscending: ": Activar para ordenar la columna de manera ascendente",
    sSortDescending: ": Activar para ordenar la columna de manera descendente"
  },
  buttons: {
    copy: "Copiar",
    colvis: "Visibilidad"
  }
};

function loadingOverlay(action) {
  $.LoadingOverlay(action, {
    size: 10,
    maxSize: 70,
    minSize: 50
  });
}

function getColumnsTable() {
  const getColorStatus = status => {
    const data = {
      pending: "bg-orange",
      canceled: "bg-red",
      completed: "bg-green"
    };

    return data[status] || "bg-grey";
  };

  const getLabelStatus = status => {
    const data = {
      pending: "Pendiente",
      canceled: "Cancelado",
      completed: "Completado"
    };

    return data[status] || "";
  };

  return [
    {
      title: "Cliente",
      data: "client_email",
      defaultContent: "",
      orderable: false
    },
    {
      title: "# Ticket",
      data: "num_ticket",
      defaultContent: "",
      orderable: false
    },
    {
      title: "# Mesa",
      data: "num_table",
      defaultContent: "",
      orderable: false
    },
    {
      title: "Metodo de Pago",
      data: "payment_method",
      defaultContent: "",
      orderable: false
    },
    {
      title: "Monto Total",
      data: "amount",
      defaultContent: "0",
      orderable: false
    },
    {
      title: "Status",
      data: "status",
      defaultContent: "",
      orderable: false,
      render: (data, type, row, meta) => {
        return `<span class="badge ${getColorStatus(data)}">${getLabelStatus(
          data
        )}</span>`;
      }
    },
    {
      title: "Acciones",
      data: "id",
      defaultContent: "",
      orderable: false,
      render: data => {
        return `
          <button class="btn btn-primary" onclick="openModalDetailOrder('${data}')">Ver</button>
          <button class="btn btn-success dropdown" id="lang" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i class="ion-compose"></i>
            <ul class="dropdown-menu dropdown-menu-left" aria-labelledby="lang">
                <li class="dropdown-item"><a href="#" onclick="changeStatus('${data}', 'completed')">Pagado</a></li>
                <li class="dropdown-item"><a href="#" onclick="changeStatus('${data}', 'canceled')">Cancelar</a></li>
                <li class="dropdown-item"><a href="#" onclick="archiveOrder('${data}')">Archivar</a></li>
            </ul>
          </button>`;
      }
    }
  ];
}

function changeStatus(orderId, status) {
  if (status === "completed") {
    showModalSelectPaymentMethod(orderId);
  } else {
    loadingOverlay("show");
    firebase
      .firestore()
      .collection("orders")
      .doc(orderId)
      .update({
        status
      })
      .then(() => {
        loadingOverlay("hide");
      })
      .catch(e => {
        loadingOverlay("hide");
      });
  }
}

function showModalSelectPaymentMethod(orderId) {
  $("#order-selected").val(orderId);
  $("#modal-select-payment-method").modal("show");
}

function savePaymentMethod(e) {
  e.preventDefault();
  e.stopPropagation();

  const orderId = $("#order-selected").val();
  const paymentMethod = $("#form-payment-method").val();

  loadingOverlay("show");
  firebase
    .firestore()
    .collection("orders")
    .doc(orderId)
    .set(
      {
        status: "completed",
        payment_status: "aprobado",
        payment_details: {
          payment_method_name: paymentMethod,
          operation_date: moment().format("lll"),
          transaction_id: orderId,
          reference: orderId
        }
      },
      { merge: true }
    )
    .then(() => {
      loadingOverlay("hide");
      $("#modal-select-payment-method").modal("hide");
    })
    .catch(e => {
      loadingOverlay("hide");
      $("#modal-select-payment-method").modal("hide");
    });
}

function archiveOrder(orderId) {
  loadingOverlay("show");
  firebase
    .firestore()
    .collection("orders")
    .doc(orderId)
    .set(
      {
        archived: true
      },
      {
        merge: true
      }
    )
    .then(() => {
      loadingOverlay("hide");
    })
    .catch(e => {
      loadingOverlay("hide");
    });
}

function openModalDetailOrder(orderId) {
  loadingOverlay("show");

  const getQuantity = (list, idEntry) => {
    const index = list.findIndex(item => item.idEntry === idEntry);

    return index !== -1 ? list[index]["count"] : 0;
  };

  const getField = (obj, field) => {
    return obj[field] || "";
  };

  let listEntries = [];
  let amountTotal = 0;

  firebase
    .firestore()
    .collection("orders")
    .doc(orderId)
    .get()
    .then(order => {
      const idRes = order.get("restaurant_id");

      const paymentDetails = order.get("payment_details") || {};

      $("#data-order-id").text(order.get("num_ticket"));
      $("#data-description").text(order.get("description"));

      $("#data-payment-details").html(`
          <hr>
          <div class="d-flex">
            <span class="h6 card-title">Detalles del pago</span>
          </div>
          <div class="d-flex">
            <label class="h6">Estado: </label>&nbsp;&nbsp;${order.get(
              "payment_status"
            ) || ""}
          </div>
          <div class="d-flex">
            <label class="h6">Tipo de pago: </label>&nbsp;&nbsp;${getField(
              paymentDetails,
              "payment_method_name"
            )}
          </div>
          <div class="d-flex">
            <label class="h6">Fecha de transacción: </label>&nbsp;&nbsp;${getField(
              paymentDetails,
              "operation_date"
            )}
          </div>
          <div class="d-flex">
            <label class="h6">ID de transacción: </label>&nbsp;&nbsp;${getField(
              paymentDetails,
              "transaction_id"
            )}
          </div>
          <div class="d-flex">
            <label class="h6">Referencia del pago: </label>&nbsp;&nbsp;${getField(
              paymentDetails,
              "reference"
            )}
          </div>
          <hr>
      `);

      if (order.get("datetime_created")) {
        moment.locale("es");
        const datetime = order.get("datetime_created");
        const date = new Date(datetime.seconds * 1000);

        $("#data-datetime").text(
          moment(date).format("dddd, MMMM Do YYYY, h:mm:ss a")
        );
      }

      listEntries = order.get("entries");
      amountTotal = order.get("amount");

      const entriesPromises = (order.get("entries") || []).map(item => {
        return firebase
          .firestore()
          .collection("restaurants")
          .doc(idRes)
          .collection("entries")
          .doc(item.idEntry)
          .get();
      });

      return Promise.all(entriesPromises);
    })
    .then(entries => {
      $("#table-entry-list tbody").html("");

      entries.forEach(entry => {
        const imageEntry =
          entry.get("image") || "assets/img/image-not-available.png";

        const quantity = Number(getQuantity(listEntries, entry.id));
        const price = Number(entry.get("price"));
        const total = price * quantity;

        $("#table-entry-list tbody").append(`
          <tr>
            <td>
                <div class="d-flex align-items-start">
                    <img class="thumb-circle" src="${imageEntry}" alt="img1">
                    <div class="pl-3 flex-grow-1">
                        <span class="title-midd">${entry.get("name")}</span>
                        <p>${entry.get("coocking_time")} minutos</p>
                    </div>
                </div>
            </td>
            <td>${price} $</td>
            <td>${quantity}</td>
            <td><span class="font-weight-bold">${total} $</span></td>
          </tr>
        `);
      });

      $("#table-entry-list tbody").append(`
        <tr>
          <td colspan="2"></td>
          <td><span class="title-midd text-right">Monto Total:</span></td>
          <td><span class="title-midd">${amountTotal} $</span></td>
        </tr>`);

      $("#modal-detail-order").modal("show");
      loadingOverlay("hide");
    })
    .catch(error => {
      console.log(error);
      loadingOverlay("hide");
    });
}

$(window).on("load", () => {
  const uid = localStorage.getItem("uid");

  ion.sound({
    sounds: [
      {
        name: "door_bell"
      }
    ],
    volume: 0.9,
    path: "assets/sounds/",
    preload: true
  });

  // Agregar los nuevos registros de primero firebase on snapshot
  jQuery.fn.dataTable.Api.register("row.addByPos()", function(data, index) {
    var currentPage = this.page();

    //insert the row
    this.row.add(data);

    //move added row to desired index
    var rowCount = this.data().length - 1,
      insertedRow = this.row(rowCount).data(),
      tempRow;

    for (var i = rowCount; i >= index; i--) {
      tempRow = this.row(i - 1).data();

      this.row(i).data(tempRow);
      $(this.row(i).node()).attr("data-id", tempRow.id);

      this.row(i - 1).data(insertedRow);
      $(this.row(i - 1).node()).attr("data-id", insertedRow.id);
    }

    //refresh the current page
    this.page(currentPage).draw(false);
  });

  const tableOrders = $("#table-orders").DataTable({
    language: language,
    columns: getColumnsTable(),
    ordering: false,
    createdRow: (row, data, index) => {
      $(row).attr("data-id", data.id);
    }
  });

  firebase
    .firestore()
    .collection("orders")
    .where("restaurant_id", "==", uid)
    .where("archived", "==", false)
    .orderBy("datetime_created")
    .onSnapshot(query => {
      query.docChanges().forEach(change => {
        const data = {
          id: change.doc.id,
          ...change.doc.data()
        };

        console.log(change);

        if (change.type === "added") {
          tableOrders.row.addByPos(data, 1);
        } else if (change.type === "modified") {
          tableOrders
            .row(`[data-id=${change.doc.id}]`)
            .data(data)
            .draw(false);
        } else if (change.type === "removed") {
          tableOrders
            .row(`[data-id=${change.doc.id}]`)
            .remove()
            .draw(false);
        }
      });

      firstFetch = false;
    });
});
