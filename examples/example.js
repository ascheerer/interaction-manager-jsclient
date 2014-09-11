require('../lib/interaction-manager/');

// init client
// var client = new InteractionManagerClient('SensingEventManager', 'sem1345', 'http://meetingstar.pi6.fernuni-hagen.de:9292/interaction-manager');
// var client = new InteractionManagerClient('SensingEventManager', 'sem1345', 'http://localhost:9292/interaction-manager');
var client = new InteractionManagerClient('ExampleApp', 'exampleApp12345', 'http://localhost:9292/interaction-manager');
client.setLogLevel('debug');

// define onEvent function to receive events
client.onEvent( function(event) {
     console.log('Yeah! Received an event (id=' + event.id + ') from IneractionManager: ' + event + '(' + event.toJson() + ')' );
     // console.log('Let\'s close the connection. I don\'t want to receive another boring event...');
     // client.close();
     // setTimeout(function() {
     //    console.log('Trying to send another event with a closed connection. Guess what will happen ;-)')
     //    client.sendEvent(event2);
     //},1000);
});



// create events
var event1 = new InteractionManagerEvent("event1");
event1.setProperty('prop1','val1');
event1.setCustomVar('_var1','val2');

var event2 = new InteractionManagerEvent("event2");
event2.setProperties({'prop2':'val3','prop3':'val4'});
event2.setCustomVars({'_var2':'val5','_var3':'val6'});

var event3 = InteractionManagerEvent.fromJson('{"name":"topic","appType":"SensingEventManager","appInstanceId":"50924677bbcdaaa713000001","properties":{"topicId":1.0,"topicTitle":"Einleitung","topicApplication":"10","topicDuration":900000.0},"customVars":{"id":1.36423500328918E14,"eventId":3.0,"eventType":"topic","senderTime":"topicChange","_dateCreated":"2013-03-25T19:10:03","_timeCreated":"19:10:03"}}');

// send event1 (we are waiting a second here to wait for a connection)
setTimeout(function() {
    console.log('Trying to send event');
    client.sendEvent(event1);
},1000);

setTimeout(function() {
    console.log('Trying to send a second event');
    client.sendEvent(event2);
},5000);


setTimeout(function() {
    console.log('Trying to send a third event');
    client.sendEvent(event3);
},20000);


