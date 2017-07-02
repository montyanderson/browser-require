(() => {

	const root = location.pathname;
	const cache = {};

	function get(path) {
		const request = new XMLHttpRequest();
		request.open("GET", path, false);
		request.send(null);

		return request;
	}

	function _require(file, dir) {
		let path, directory;

		if(file.slice(0, 2) == "./") {
			let split = dir.split("/");

			split.pop();
			split.push(file);

			path = split.join("/");
			split.pop();
			directory = split.join("/") + "/";
		} else {
			if(file.split("/").length == 1) {
				const moduleName = file.split("/")[0];
				directory = root + "/node_modules/" + file + "/";
				const p = root + "/node_modules/" + moduleName + "/";

				const request = get(p + "package.json");

				if(request.status != 200) {
					throw new Error(`Failed to get package.json for module '${file}'`);
				}

				const package = JSON.parse(request.responseText);

				path = directory + (package.main || "index.js");
			} else {
				directory = root + "/node_modules/" + file.split("/").slice(0, -1).join("/");

				path = root + "/node_modules/" + file;
			}
		}

		console.log(directory, path);

		if(typeof cache[path] == "undefined") {
			let request;

			request = get(path);

			if(request.status != 200) {
				request = get(path + ".js");
			}

			if(request.status != 200) {
				request = get(path + "/index.js");
			}

			const module = {
				exports: {}
			};

			const { exports } = module;

			eval(`(require, module, exports, process) => {
				${request.responseText}
			}`)(file => _require(file, directory), module, exports, {
				env: {
					NODE_ENV: "production"
				}
			});

			cache[path] = module.exports;
		}

		return cache[path];
	}

	window.require = file => _require(file, location.pathname);

})();
