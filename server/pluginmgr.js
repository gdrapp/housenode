
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
			if (files[i].charAt(0) !== '.') {
				console.log("Found plugin file " + files[i]);
				var pluginModule = loadPlugin(files[i]);

				if (typeof pluginModule !== 'undefined') {
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
			var plugin = new pluginModule.plugin();
			var instanceConfig = config.plugins[pluginName][instance];
			console.info("Initializing instance of plugin %s with config %s", pluginModule.info.friendlyName, JSON.stringify(instanceConfig));
			plugin.init(instance, instanceConfig);
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
	}
};