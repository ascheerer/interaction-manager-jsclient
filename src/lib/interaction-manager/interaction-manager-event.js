/**
 * JavaScript client for the InteractionManager.
 */
InteractionManagerEvent = function(eventName) {
    
    // --------------------------------------------------------------------------
    // ---                           private members                          ---
    // --------------------------------------------------------------------------
    this.name = eventName;
    this.id = '';
    this.appType = '';
    this.appInstanceId = '';
    this.properties  = {};
    this.customVars  = {}; 

    // --------------------------------------------------------------------------
    // ---                           private methods                          ---
    // --------------------------------------------------------------------------

    
    // --------------------------------------------------------------------------
    // ---                           public methods                           ---
    // --------------------------------------------------------------------------
    this.setProperty = function(key, value) {
        this.properties[key] = value;        
    }

    this.setProperties = function(props) {
        this.properties = props;	
    }

    this.setCustomVar = function(key, value) {
        this.customVars[key] = value;
    }

    this.setCustomVars = function(customs) {
        this.customVars = customs;
    }

	this.setId = function(eventId) {
		this.id = eventId;
	}

    this.setAppType = function(type) {
        this.appType = type;
    }

    this.setAppInstanceId = function(instanceId) {
        this.appInstanceId = instanceId;
    }

    this.toJson = function() {
        return JSON.stringify(this);
    }
}

InteractionManagerEvent.fromJson = function(eventJson) {
    var event = JSON.parse(eventJson);
    var imEvent = new InteractionManagerEvent(event.name);
    imEvent.setId(event.id);
    imEvent.setAppType(event.appType);
    imEvent.setAppInstanceId(event.appInstanceId);
    imEvent.setCustomVars(event.customVars);
    imEvent.setProperties(event.properties);
    return imEvent;
}

module.exports = InteractionManagerEvent;
