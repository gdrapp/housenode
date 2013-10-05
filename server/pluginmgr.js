
var fs = require('fs'),
		config = require('../config');

exports.pluginModules = {};

// Load all plugins
exports.loadPlugins = function (cb) {
	fs.readdir('./server/plugins', function (err, files) {
		if (err) {
			throw err;
		}

		for (var i = 0; i < files.length; i++) {
			if (files[i].charAt(0) !== '.' && files[i] !== 'pluginapi.js') {
				console.log("Found plugin file " + files[i]);
				var pluginModule = loadPlugin(files[i]);

				if (typeof pluginModule !== 'undefined' && pluginModule !== null) {
					exports.pluginModules[pluginModule.info.name] = pluginModule;
				} else {
					console.warn("Error loading plugin module in file %s", files[i])
				}
			}
		}

		cb();
	})		
};

exports.initPlugins = function (cb) {
	for (var pluginName in config.plugins) {
		var pluginModule = exports.pluginModules[pluginName];

		for (var instance in config.plugins[pluginName]) {
			var instanceConfig = config.plugins[pluginName][instance];
			if ('undefined' !== typeof instanceConfig.enabled && instanceConfig.enabled === true) {
				var plugin = new pluginModule.plugin();
				console.info("Initializing instance %s of %s plugin with config %s", instance, pluginModule.info.friendlyName, JSON.stringify(instanceConfig));
				plugin.init(instance, instanceConfig.options);				
			} else {
				console.info("Instance %s of %s plugin is not enabled and will not be initialized", instance, pluginModule.info.friendlyName);
			}
		}
	}

	cb();
};

// Load a plugin
var loadPlugin = function (filename) {
	var module = require("./plugins/"+filename);

	if (typeof module.info !== 'undefined') {
		console.info("Loading plugin %s", module.info.friendlyName);
		return module;
	} else {
		return null;
	}
};