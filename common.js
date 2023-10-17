

 const CHAT_CHANNEL = "chat"


 function waitForAllICE(peerConnection) {
    return waitForEvent((fulfill) => {
		console.log("iceEvent1 ")
        peerConnection.onLocalCandidate = (iceEvent) => {
			console.log("iceEvent2 "+iceEvent)
            if (iceEvent.candidate === null) {
                fulfill()
            }
        }
    })
}


 function waitForEvent(user_function, delay=30000) {
    return new Promise((fulfill, reject) => {
        user_function(fulfill)
        setTimeout(() => reject("Waited too long"), delay)
    })
}

 function addConnectionStateHandler(peerConnection) {
    peerConnection.onconnectionstatechange = function (event) {
        console.log("onconnectionstatechange ", event.type, " is ", peerConnection.connectionState)
    };

    peerConnection.onsignalingstatechange = function (event) {
        console.log("onsignalingstatechange ", peerConnection.signalingState)
    };
    peerConnection.onicecandidateerror = function (event) {
        console.log("onicecandidateerror", event)
    };
}

module.exports = {
    addConnectionStateHandler,waitForEvent,waitForAllICE
}
