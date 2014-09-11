require('../lib/interaction-manager/');

// init client
var client = new InteractionManagerClient('RecommendationExample', 'recommendationExample1234', 'http://localhost:9292/interaction-manager');
client.setLogLevel('info');

// define onEvent function to receive events
client.onEvent( function(event) {
    if (event.name == 'recommendation') {
        console.log('Received recommendation event. Rock\'n\'roll!');
        console.log('Text: ' + event.properties.text);
        console.log('Headline: ' + event.properties.headline);
        console.log('Options: ');
        for (optionKey in event.properties.options) {
            console.log('\t' + optionKey + ' -> ' + event.properties.options[optionKey]);
        }
    } else {
        console.log('Received unknown event: ' + event.toJson());
    }
});

// create events
var event = new InteractionManagerEvent("testevent");

// send event1 (we are waiting a second here to wait for a connection)
setTimeout(function() {
    var success = client.sendEvent(event);
    if (!success) {
        console.log('>>> Shit! Something is wrong with the websocket connection. Let\'s call Andi to fix it ;-) <<<');
    }
},1000); 



