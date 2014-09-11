// required modules 
require('./interaction-manager-event.js');
var WebSocketClient = require('websocket').client;
var Log = require('log');

/**
* JavaScript client for the InteractionManager.
*/
InteractionManagerClient = function(appType, appInstanceId, wsUrl) {
    
    // --------------------------------------------------------------------------
    // ---                           private members                          ---
    // --------------------------------------------------------------------------
    var websocketClient = new WebSocketClient();
    var websocketConnection = false;
    var isConnected = false;

    var isRegistered = true; // TODO: switch to false by default

    var applicationType = appType;
    var applicationInstanceId = appInstanceId;
    var websocketUrl = wsUrl;
    
    var log = new Log('error');

    // --------------------------------------------------------------------------
    // ---                           private methods                          ---
    // --------------------------------------------------------------------------
    var init = function(wsUrl) {    

        websocketClient.on('connectFailed', function(error) {
            log.error('InteractionManager Connect Error: ' + error.toString());

            isConnected = false;
            webSocketConnection = false;
        });
    
        websocketClient.on('connect', function(connection) {
            connection.on('close', function() {
                log.info('InteractionManager connection closed.');
            });

            connection.on('message', function(msg) {
               if (msg.type === 'utf8') {
                   try {
                       var event = InteractionManagerEvent.fromJson(msg.utf8Data);
                   } catch (e) {
                       log.info('Could not parse invalid websocket message: ' + msg.utf8Data);
                       return
                   }

                   if (event.appType != appType || event.appInstanceId != appInstanceId) {
                        log.info('Ignored invalid InteractionManager with not matching appType or appInstanceId: ' + event.toJson());
                        return
                   }

                   log.info('Received valid InteractionManager event: "' + event.toJson() + '"');
                   onEventFnc(event);
               } else {
                   log.warn('Ignored invalid (not utf8 encoded) message: ' + msg.type);
               }
            });

            websocketConnection = connection;
            isConnected = true;

            log.info('InteractionManager connection established.');

            // TODO: send registration request
        });

        websocketClient.connect(websocketUrl);
    }

    var onEventFnc = function(event) {
        // dummy onEvent function. Can be redefined by onEvent method.
    }


    // --------------------------------------------------------------------------
    // ---                           public methods                           ---
    // --------------------------------------------------------------------------
    this.onEvent = function(fnc) {
        onEventFnc = fnc;
    }

    var sendEvent = this.sendEvent = function(event, callback) {
        if (!isConnected) {
            
            // TODO try to reconnect
            var msg = 'Error while trying to send InteractionManager event. No connection found.';
            log.error(msg);
            if (typeof callback === 'function') {
                callback(msg);
            }
            return;
        }
        if (!isRegistered) {
            var msg = 'Error while trying to send InteractionManager event. Client not registered.';
            log.error(msg);
            if (typeof callback === 'function') {
                callback(msg)
            }
            return;
        }

        event.setAppType(applicationType);
        event.setAppInstanceId(applicationInstanceId);

        websocketConnection.sendUTF(event.toJson(), function(err) {
            if (err) {
                var msg = 'Error while trying to send InteractionManager event: ' + err;
                log.error(msg);
                if (typeof callback === 'function') {
                    callback(msg);
                }
            } else {
                log.info('Successfully sent InteractionManager event ' + event.toJson());
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
        return;
    }

    this.sendEvents = function(events, callback) {
        for (i=0; i < events.length; i++) {
            sendEvent(events[i], callback);
        }
    }

    this.setLogLevel = function(level) {
        log = new Log(level);
    }
    
    var close = this.close = function() {
        websocketConnection.close();
        isConnected = false;
        isRegistered = false;
    }

    // --------------------------------------------------------------------------
    // ---                        constructor body                            ---
    // --------------------------------------------------------------------------
    init();

}



module.exports = InteractionManagerClient;
