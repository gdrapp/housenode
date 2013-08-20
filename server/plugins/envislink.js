exports.info = {
	name: "envisalink",
	version: "1.0",
	friendlyName: "Envisalink Plugin",
	description: "Plugin for Envisalink 2DS/3DS security system TCP/IP module",
	configSchema: [{name:'host', 			type:'string', 	description:'Module IP address', 	mandatory:true},
								 {name:'port', 			type:'integer', description:'Module TCP port', 		mandatory:true},
								 {name:'password', 	type:'string', 	description:'Module password', 		mandatory:true}]
};

exports.plugin = EnvisalinkPlugin;

function EnvisalinkPlugin () {
	var net = require('net'),
			PluginAPI = new require('./pluginapi');

	var instance,
			pluginApi,
			host,
			port,
			password,
			code;

	var init = function (instance, config) {
		instance = instance;
		pluginApi = new PluginAPI(exports.info.name, instance),
		host = config.host,
		port = config.port,
		password = config.password,
		code = config.code;

		console.log("Connecting to Envisalink module at %s:%d", host, port);
		var client = net.createConnection(port, host, function() {
			console.log("Connected to Envisalink module at %s:%d", host, port);
		});

		createListeners(client);
	};

	var destroy = function () {

	};

	function createListeners(client) {
		var dataBuffer = '';

		client.on('connect', function () {

		});

		client.on('data', function (data) {
			data = data.toString();

			// Split incoming data on CRLF
	    var lines = data.split(/\r\n/);
	    lines[0] = dataBuffer + lines[0];
	    dataBuffer = lines.pop();

	    lines.forEach(function (line, index) {
	    	if (isValidData(line)) {
			    console.log("Received data from Envisalink: %s", line);
			    
			    // Remove the checksum since we know it's good
			    line = line.substring(0,line.length-2);

		      processData(client, line);	    		
	    	} else {
	    		console.warn("Received bad data from Envisalink: %s", line);
	    	}
	    });
		});

		client.on('end', function () {
		  console.log("Disconnected from Envisalink");

		  setTimeout(function () {
		  	console.log("Attemping to reinitialize Envisalink plugin");
			  exports.plugin.init();
		  }, 5000);
		});

		pluginApi.onCommand('arm', function (target, args) {
			if (target && target.length === 2 && target.chartAt(0) === 'P') {
				var partition = target.charAt(1);
				console.log("Received arm command for partition " + partition);
				sendData(client, createCommand("030", partition));
			} else {
				console.warn("Invalid Envisalink arm command target: %s", target)
			}
		});

		pluginApi.onCommand('disarm', function (target, args) {
			if (target && target.length === 2 && target.chartAt(0) === 'P') {
				var partition = target.charAt(1);
				console.log("Received disarm command for partition " + partition);
				sendData(client, createCommand("040", partition+(args.code || code)));
			} else {
				console.warn("Invalid Envisalink arm command target: %s", target)
			}
		});
	};

	// Handle incoming data from Envisalink
	function processData (socket, data) {
		var cmd = data.substring(0,3),
				payload = data.substring(3);

	  if (cmd === "505") {
	  	if (payload === "0") {
	  		console.log("Envisalink login failed");
	  		socket.end();
	  	}
	  	else if (payload === "1") {
	  		console.log("Envisalink login successful");
	  		sendData(socket, createCommand("001", ""));
	  	} 
	  	else if (payload === "2") {
	  		console.log("Envisalink login timed out");
	  		socket.end();
	  	} 
	  	else if (payload === "3") {
	  		console.log("Envisalink login password request");	  		
				var toSend = createCommand("005", password);
				sendData(socket, toSend);
	  	}
		} else if (cmd === "601") { // Zone alarm
			pluginApi.publishValue("Z"+payload.slice(1), "alarm");
		} else if (cmd === "602") { // Zone alarm restore
			pluginApi.publishValue("Z"+payload.slice(1), "alarmRestore");
		} else if (cmd === "603") { // Zone tamper
			pluginApi.publishValue("Z"+payload.slice(1), "tamper");
		} else if (cmd === "604") { // Zone tamper restore
			pluginApi.publishValue("Z"+payload.slice(1), "tamperRestore");
		} else if (cmd === "605") { // Zone fault
			pluginApi.publishValue("Z"+payload, "fault");
		} else if (cmd === "606") { // Zone fault restore
			pluginApi.publishValue("Z"+payload, "faultRestore");
		} else if (cmd === "609") { // Zone open
			pluginApi.publishValue("Z"+payload, "open");
		} else if (cmd === "610") { // Zone restored
			pluginApi.publishValue("Z"+payload, "restored");
		} else if (cmd === "650") { // Partition ready
			pluginApi.publishValue("P"+payload, "ready");
		} else if (cmd === "651") { // Partition not ready
			pluginApi.publishValue("P"+payload, "notReady");
		} else if (cmd === "652") { // Partition armed
			var partition = payload.slice(0,1),
					mode = payload.slice(1);

			pluginApi.publishValue("P"+partition, "armed");
		} else if (cmd === "653") { // Partition ready - force arming enabled
			pluginApi.publishValue("P"+payload, "readyForceArming");
		} else if (cmd === "654") { // Partition in alarm
			pluginApi.publishValue("P"+payload, "alarm");
		} else if (cmd === "655") { // Partition disarmed
			pluginApi.publishValue("P"+payload, "disarmed");
		} else if (cmd === "656") { // Exit delay in progress
			pluginApi.publishValue("P"+payload, "exitDelay");
		} else if (cmd === "657") { // Entry delay in progress
			pluginApi.publishValue("P"+payload, "entryDelay");
		} else if (cmd === "900") { // Code required

		}
	};

	function sendData (socket, data) {
		console.log("Sending %s", data);
		socket.write(data+"\r\n");		  		  		
	};

	// Build command to send to Envisalink
	function createCommand (cmd, payload)
	{
		return cmd + payload + checksum(cmd+payload);
	};

	// Create a checksum for the passed in data
	function checksum (data) {
		var chksum = 0;
		for (var i=0;i<data.length;i++) {
			chksum += data.charCodeAt(i);
		}
		chksum = chksum & 0xFF;

		var chksumString = chksum.toString(16).toUpperCase();
		
		// If the checksum length is one, add a leading zero
		if (chksumString.length === 1) {
			chksumString = "0" + chksumString;
		}

		return chksumString;
	};

	// Validate checksum of data received from Envisalink
	function isValidData (data) {
		var bareData = data.substring(0,data.length-2);
		var chksum = data.substring(data.length-2);
		return chksum === checksum(bareData);
	}

	return {
		init: init,
		destroy: destroy
	}
};
