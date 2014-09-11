//
//  Server.js
//  MeetingStar
//
//  Created by Timo Müller on 12.11.2012.
//  Copyright 2012 FernUniversität in Hagen. All rights reserved.
//
var // MAF application facade
    appFacade = require('maf').applicationFacade,
// MAF event emitter
    eventEmitter = appFacade.eventEmitter,
    maf = {
        APPLICATION_ID:'13',
        INSTANCE_NAME:'SensingEventManager'
    },
// Andreas Scheerer InteractionManager
    server = {
        HOST:'http://meetingstar.pi6.fernuni-hagen.de',
        PORT:'9292',
        APPLICATION:'interaction-manager'
    },
    tempSensingDataArray = null,
    interactionManager = null,
    interactionManagerActive = false,
    sensingEngineActive = false,
    currentConnectedUsers = null,
    instance = {
        id:null,
        msId:null
    },
    socketIoPath = '/app/mobile/sensingengine/sensingengine',
    socketStore = null,
    meetingInstanceId = null

log = appFacade.loggerFactory(maf.INSTANCE_NAME);


exports.startSensingServer = function (req, res) {
    var instanceData = {
        created:new Date(),
        meetingInstanceId:req.body.meetingInstanceId
    };

    // reset InteractionManager
    tempSensingDataArray = null;
    interactionManager = null;

    appFacade.startApplicationInstance(maf.APPLICATION_ID, maf.INSTANCE_NAME, instanceData, function (result) {
        var appInstance = result.appInstance;
        // store application server instance ids in class variables
        instance.id = appInstance.instanceId;
        instance.msId = req.session.userContext.applicationInstance.instanceId;
        meetingInstanceId = instanceData.meetingInstanceId;
        var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] startSensingServer success';
        log.debug(message);

        initSocketConfiguration(result);
        initInteractionManager(meetingInstanceId);

        res.writeHead(200, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:true,
            message:message,
            appInstId:instance.id,
            msInstId:instance.msId
        }));
    });
};

exports.sendInstanceIdToClient = function (req, res) {
    if (instance.id != null) {
        res.writeHead(200, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:true,
            appInstId:instance.id
        }));
    } else {
        res.writeHead(500, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:false
        }));
    }
};

exports.receiveSensingEventDataFromClient = function (req, res) {
    var instanceData = {
        created:new Date(),
        data:req.body.data,
        meetingInstanceId:req.body.meetingInstanceId
    };

    if (instanceData.data != null) {
        var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + ']  receiveSensingEventDataFromClient (data: ' + instanceData.data + ')';
        log.debug(message);

        res.writeHead(200, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:true,
            message:message,
            appInstId:instance.id,
            msInstId:instance.msId
        }));

        var appName = JSON.parse(instanceData.data).appName;
        var eventId = JSON.parse(instanceData.data).eventId;
        var eventType = JSON.parse(instanceData.data).eventType;
        var senderTime = JSON.parse(instanceData.data).senderTime;
        var appInstanceId = instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId;
        var eventProperties = JSON.parse(instanceData.data).eventProperties;

    } else {
        var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] receiveSensingEventDataFromClient failed';
        log.warn(message);
        res.writeHead(500, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:false,
            message:message
        }));
    }
};

exports.receiveInstanceDataFromClient = function (req, res) {
    var instanceData = {
        created:new Date(),
        data:req.body.data,
        senderTime:req.body.senderTime,
        meetingInstanceId:req.body.meetingInstanceId
    };
        if (instanceData.data != null) {
            exportDataToExternalApplication(instanceData);
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] receiveInstanceDataFromClient for senderTime: ' + instanceData.senderTime + ' (data: ' + instanceData.data + ')';
            log.debug(message);

            res.writeHead(200, { 'Content-Type':'application/json' });
            res.end(JSON.stringify({
                success:true,
                message:message,
                appInstId:instance.id,
                msInstId:instance.msId
            }));

        } else {
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] receiveInstanceDataFromClient failed';
            log.warn(message);
            res.writeHead(500, { 'Content-Type':'application/json' });
            res.end(JSON.stringify({
                success:false,
                message:message
            }));
        }
};

exports.receiveUpdateUserEventFromClient = function (req, res) {
    var instanceData = {
        created:new Date(),
        data:req.body.data,
        meetingInstanceId:req.body.meetingInstanceId
    };
    var appInstance = appFacade.getApplicationInstance(instance.msId);
    if (instanceData.data == 'join') {
        currentConnectedUsers = appInstance.getNumberOfUsers();
    } else {
        currentConnectedUsers = appInstance.getNumberOfUsers() - 1;
    }

    if (currentConnectedUsers != null) {
        var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] updateUserEvent ' + instanceData.data + ' (number of users: ' + currentConnectedUsers + ')';
        log.debug(message);
        res.writeHead(200, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:true,
            message:message,
            data:currentConnectedUsers,
            appInstId:instance.id,
            msInstId:instance.msId
        }));
    } else {
        var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] updateUserEvent failed';
        log.warn(message);
        res.writeHead(500, { 'Content-Type':'application/json' });
        res.end(JSON.stringify({
            success:false,
            message:message
        }));
    }
};

exports.stopSensingServer = function (req, res) {
    var instanceData = {
        created:new Date(),
        meetingInstanceId:req.body.meetingInstanceId
    };

    // reset InteractionManager
    tempSensingDataArray = null;
    interactionManager.close();
    sensingEngineActive = false;

    var appInstance = appFacade.getApplicationInstance(instance.id);
    appInstance.stop(function (err, result) {
        if (result.resultOK == true) {
            currentConnectedUsers = null;
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '-' + instanceData.meetingInstanceId + '] stopSensingServer success';
            log.debug(message);
            res.writeHead(200, { 'Content-Type':'application/json' });
            res.end(JSON.stringify({
                success:true,
                message:message,
                appInstId:instance.id,
                msInstId:instance.msId
            }));
        } else {
            var message = '[SensingEventManager server] stopSensingServer failed: ' + err;
            log.debug(message);
            res.writeHead(500, { 'Content-Type':'application/json' });
            res.end(JSON.stringify({
                success:false,
                message:message,
                appInstId:instance.id,
                msInstId:instance.msId
            }));
            next(err);
        }
    });
}; // TODO auch an Andi

function initSocketConfiguration(result) {
    // query the socketIOServerSetup object to return the socket for a specific namespace
    var sioSensingEngine = result.socketIOServerSetup[socketIoPath];
    interactionManagerActive = false; // todo close-Event senden
    sioSensingEngine.on('connection', function (socket) {
        socketStore = socket;
        socket.on('sensingEvent', function (data) {
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '] incoming sensingEvent';
            log.debug(message);
            socket.broadcast.emit('sensingEvent', {eventObject:data});
        });
        socket.on('connectToInteractionManager', function () {
            initInteractionManager(meetingInstanceId);
        })
    });

    // store the socket.io data
    result.appInstance.socketData = {
        SensingEngineSocket:sioSensingEngine,
        userSockets:[] // holds indivdual sockets for each user key: userid, value: socket
    };

    // set your authorisation function for your socket.io
    // namespaces. Every time a client opens a socket.io connection
    // this function is called. There you can evaluate the actual namespace
    // (ns), the session and the configured roles.
    result.authorisationHook.func = authorizeSocketIOConnection;
};

function exportDataToExternalApplication(req) {
    if (sensingEngineActive == true) {
        if (tempSensingDataArray != null) {
            log.debug(tempSensingDataArray.length + ' items in tempSensingDataArray');
            for (var i = 0; i < tempSensingDataArray.length; i++) {
                iterateDataRecords(tempSensingDataArray[i]);
            }
            tempSensingDataArray = null;
        }
        var records = JSON.parse(req.data).records;
        iterateDataRecords(records);
    } else {
        var records = JSON.parse(req.data).records;
        if (tempSensingDataArray == null) {
            tempSensingDataArray = [];
        }
        tempSensingDataArray.push(records);
        var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '] exportDataToExternalApplication not executed. InteractionManager not started yet. ' + records.length + ' items (total: ' + tempSensingDataArray.length + ') were stored temporally.';
        log.warn(message);
    }
};

function iterateDataRecords(records) {
    for (var i = 0; i < records.length; i++) {
        var event = new InteractionManagerEvent(records[i].eventType);
        event.setCustomVars({
            id:records[i].id,
            eventId:records[i].eventId,
            eventType:records[i].eventType,
            senderTime:records[i].senderTime,
            _dateCreated:records[i]._dateCreated,
            _timeCreated:records[i]._timeCreated
        });

        var eventProperties = records[i].eventProperties;
        event.setProperties(eventProperties);
        interactionManagerActive = interactionManager.sendEvent(event)
        if (interactionManagerActive) {
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '] InteractionManager send event ' + event.customVars.eventType;
            log.debug(message);
        } else {
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '] No connection to InteractionManager.';
            sensingEngineActive = false;
            if (socketStore != null) {
                var entryMessage = 'InteractionManager is not reachable. Try again?'
                setTimeout(function () {
                    socketStore.broadcast.emit('noConnectionToInteractionManager', {eventObject:entryMessage});
                    socketStore.emit('noConnectionToInteractionManager', {eventObject:entryMessage});
                }, 3000);
            }
        }
    }
};

function authorizeSocketIOConnection(ns, session, roles, callback) {
    var user = session.userContext;
    log.debug("Authorize name space. ns: " + ns + ", userid: " + user.userId + ", appInstId: " + user.getApplicationInstance().instanceId + ", allowed roles: " + JSON.stringify(roles));

    checkAuthorisation(user, roles, function (err, result) {
        if (result.resultOK == true) {
            callback({resultOK:true});
        } else {
            callback({resultOK:false});
        }
    });
};

function checkAuthorisation(user, roles, callback) {
    // get the current application instance for this user
    var appInstance = user.getApplicationInstance();

    if (appInstance.hasUser(user) == false) {
        log.warn("User not part of application instance list");
        callback({}, {resultOK:false});
    } else {
        var userData = appInstance.getUserData(user);

        var match = false;
        // check all allowed roles for a match
        roles.forEach(function (role) {
            if (role.role == userData.role) {
                match = true;
            }
        });
        if (match == true) {
            log.debug("Application authorisation successful");
            callback(null, {resultOK:true});
        } else {
            log.warn("User role mismatch");
            callback({}, {resultOK:false});
        }
    }
};

function initInteractionManager(meetingInstanceId) {
    interactionManager = new InteractionManagerClient(maf.INSTANCE_NAME, meetingInstanceId, server.HOST + ':' + server.PORT + '/' + server.APPLICATION);
    interactionManager.setLogLevel('info');
    interactionManager.onEvent(function (event) {
        console.error('YEAH');
        switch(event.name) {
            case 'recommendation':
                setTimeout(function () {
                    socketStore.broadcast.emit('recommendationCenter', {eventObject:event});
                    socketStore.emit('recommendationCenter', {eventObject:event});
                }, 1000);
                console.error('[SensingEventManager server #' + instance.id + '-' + instance.msId + '] received event from InteractionManager: ' + event);
                break;
            case 'colorChanger':
                setTimeout(function () {
                    socketStore.broadcast.emit('awarenessColorChanger', {eventObject:event});
                    socketStore.emit('awarenessColorChanger', {eventObject:event});
                }, 1000);
                console.error('[SensingEventManager server #' + instance.id + '-' + instance.msId + '] received event from InteractionManager: ' + event);
                break;
            case 'feedback':
                setTimeout(function () {
                    socketStore.broadcast.emit('feedbackAssistant', {eventObject:event});
                    socketStore.emit('feedbackAssistant', {eventObject:event});
                }, 1000);
                console.error('[SensingEventManager server #' + instance.id + '-' + instance.msId + '] received event from InteractionManager: ' + event);
                break;
            default:
                console.error('unknown event: ' + event);
                break;
        }

    })

    var event = new InteractionManagerEvent('connectionTest');
    setTimeout(function () {
        interactionManagerActive = interactionManager.sendEvent(event)

        if (interactionManagerActive) {
            sensingEngineActive = true;
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '] InteractionManager started.';
            log.log(message);
            var entryMessage = 'connection to InteractionManager established.'
            setTimeout(function () {
                socketStore.broadcast.emit('connectionEstablishedToInteractionManager', {eventObject:entryMessage});
                socketStore.emit('connectionEstablishedToInteractionManager', {eventObject:entryMessage});
            }, 3000);
        }

        else {
            sensingEngineActive = false;
            var message = '[SensingEventManager server #' + instance.id + '-' + instance.msId + '] InteractionManager  cannot be started.';
            log.warn(message);
            var entryMessage = 'InteractionManager is not reachable. Try again?'
            setTimeout(function () {
                socketStore.broadcast.emit('noConnectionToInteractionManager', {eventObject:entryMessage});
                socketStore.emit('noConnectionToInteractionManager', {eventObject:entryMessage});
            }, 3000);
        }
    }, 3000);
};