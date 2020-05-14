const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

exports.onCreateOrder = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snapshot, context) => {
    // const snapshotUser = await admin
    //   .firestore()
    //   .collection("users")
    //   .doc(snapshot.get("restaurant_id"))
    //   .get();

    // const payload = {
    //   notification: {
    //     title: "Se ha recibido una nueva orden",
    //     body: `Nueva order #${snapshot.get('num_ticket')}`,
    //     badge: "1",
    //     sound: "default"
    //   }
    // };

    return db.collection('notifications').add({
      uid: snapshot.get('restaurant_id'),
      title: "Se ha recibido una nueva orden",
      body: `Nueva order #${snapshot.get('num_ticket')}`,
    });

    // return admin.messaging().sendToDevice(snapshotUser.get("token"), payload);
  });

exports.notifications = functions.https.onRequest((request, response) => {
  if (request.method.toLocaleUpperCase() === "POST") {
    const {
      body
    } = request;

    console.log(body);

    if (body['response_message_pol'] === 'APPROVED') {
      return admin.firestore()
        .collection('orders')
        .where('num_ticket', '==', body['reference_sale'])
        // reference sale es el id del documento orders
        //.doc(body['reference_sale'])
        .get()
        .then(query => {
          if (query.size > 0) {
            const [order] = query.docs;
            return order.ref.set({
              payment_status: 'APPROVED',
              payment_details: {
                reference: body['reference_pol'],
                reference_sale: body['reference_sale'],
                payment_method_name: body['payment_method_name'],
                operation_date: body['operation_date'],
                transaction_id: body['transaction_id'],
              }
            }, {
              merge: true
            });
          }
          return Promise.resolve();
        }).catch(console.log);
      //reference_sale
      //payment_method_name
      //operation_date
      //transaction_id
    }
    return Promise.resolve();
  }

  response.send("Enpoint Webhooks!");
});
