function showToastNotification() {
    $.toast({
        heading: 'Se recibido una nueva orden',
        text: `Nueva orden recibida <button 
            class="btn btn-info" 
            style="margin-left: 10px; padding: 5px 10px 5px 10px"
            onclick="javascript:goOrders()"
            >Ver</button>`,
        position: "bottom-right",
        bgColor: '#20bf6b',
        loaderBg: '#6900ff',
        hideAfter: false,
        icon: 'info',
        stack: 10,
        showHideTransition: 'slide',
    });
}

function goOrders() {
    window.location.href = '/';
}


function playSoundNotification() {
    const context = new AudioContext();
    context.resume().then(() => {
        ion.sound.play("door_bell");
    });
}

function listenNotification() {
    const uid = window.localStorage.getItem('uid');
    let firstFetch = true;

    firebase.firestore()
        .collection('notifications')
        .where('uid', '==', uid)
        .onSnapshot(query => {

            if (!firstFetch) {
                showToastNotification();
                playSoundNotification();
            }

            firstFetch = false;
        });
}

$(window).on("load", () => {
    ion.sound({
        sounds: [{
            name: "door_bell",
        }],
        volume: 0.9,
        path: "/assets/sounds/",
        preload: true
    });

    listenNotification();
});
