
var config = {
    myID: null,
    broker: null,
    topic: null
};

var client = null;

function setupMQTT(topic) {
    config.myID = "itu" + parseInt(Math.random() * 10000000);
    config.topic = topic;

    // selecting broker based on topic length (idea is to split load in two)
    if(topic.count % 2 == 0) {
        config.broker = "wss://edp21:Ko5z2bU0Uf7ajNzv@edp21.cloud.shiftr.io"; 
    }
    else {
        config.broker = "wss://edp21:Ko5z2bU0Uf7ajNzv@edp21.cloud.shiftr.io";
    }

    client = mqtt.connect(config.broker, { clientId: config.myID });

    // RECEIVING MESSAGE
    client.on('message', function(topic, message) {
        let msg = JSON.parse(message);
        onMessage(msg);
    });

    // CONNECTING
    client.on('connect', function() {
      console.log('connected!');
      client.subscribe(config.topic);
    });
}

// --- SEND MESSAGE --------------------------------------
function sendMessage(msg) {
    if(client == null) {
        console.log("Trying to send a message without setting up MQTT.")
        return;
    }

    let JSONmsg = JSON.stringify(msg);
    client.publish(config.topic, JSONmsg);
    console.log("Sent message");
}
