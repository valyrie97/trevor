//# sourceURL='TestBroker.js'
(function TestBroker() {
	//-----------------------------------------------------dispatch
	var dispatch = {
		GetModule: GetModule
	};

	return {
		dispatch: dispatch
	};

	async function GetModule(com, fun) {
		log.v('--TestBroker/GetModule');
		let Path = this.require("path");
		let jszip = this.require("jszip");
		let fs = this.require("fs");
		let zipmod = new jszip();

		let Vlt = this.Vlt;
		let Par = this.Par;
		let that = this;

		if (typeof this.Par.Source == "string") {
			let modnam = com.Name.replace(/\./g, Path.sep);
			let ModPath = Path.join(this.Par.Source, modnam);

			//read the module from path in the local file system
			//create the Module.json and add it to ModCache

			//recursively zip the module
			await zipDirChidren(zipmod, ModPath);

			zipmod.generateAsync({ type: "uint8array" }).then((dat, fail) => {
				if (fail) {
					let err = "Genesis failed to create zip.";
					log.w(err);
					fun(err)
					return;
				}

				log.v(`${modnam} returned from local file system`);
				com.Module = dat;
				fun(null, com);
			});


			async function zipDirChidren(ziproot, contianingPath) {
				let files;
				try {
					files = fs.readdirSync(contianingPath);
				} catch (err) {
					err += 'Module <' + contianingPath + '? not available'
					log.e(err);
					fun(err);
					return;
				}
				if (!files) {
					err += 'Module <' + contianingPath + '? not available'
					log.e(err);
					fun(err);
					return;
				}
				for (let ifile = 0; ifile < files.length; ifile++) {
					var file = files[ifile];
					var path = contianingPath + '/' + file;
					let stat = await new Promise(async (res, rej) => {
						fs.lstat(path, (err, stat) => {
							if (err) rej(err)
							else res(stat);
						})
					});

					if (stat) {
						if (!stat.isDirectory()) {
							try {
								var dat = fs.readFileSync(path);
							} catch (err) {
								log.e(`loadModuleFromDisk: error reading file ${path}: ${err}`);
							}
							ziproot.file(file, dat);
						} else {
							await zipDirChidren(ziproot.folder(file), path)
						}
					}
				}
			}


		} else {
			var tmp = new Buffer(2);
			tmp[0] = 2;
			tmp[1] = 3;
			var str = tmp.toString();
			Vlt.STX = str.charAt(0);
			Vlt.ETX = str.charAt(1);

			let port = this.Par.Source.Port;
			let host = this.Par.Source.Host;

			if (!host) {
				var err = 'Local Broker requires host if its to connect to a Broker';
				log.e(err);
				fun(err);
				return;
			}
			Vlt.Buf = '';
			Vlt.State = 0;
			var sock = new net.Socket();

			connectLoop();

			function connectLoop() {
				sock.removeAllListeners();
				sock.connect(port, host, function () { log.i("Local Broker :: trying to connect") });

				sock.on('connect', function () {

					log.v(com.Cmd, 'Local Broker - Connected to Broker at host:' + host + ', port:' + port);
					Vlt.Sock = sock;

					var msg = Vlt.STX + JSON.stringify(com) + Vlt.ETX;
					sock.write(msg);
				});

				sock.on('error', (err) => {
					log.e('ERR:Local Broker: ' + err);
					if (Par.Poll) {
						if (!("Timer" in Vlt) && "Timeout" in Par) {
							Vlt.Timer = setTimeout(() => {
								log.e("Error: Local Broker " + Par.Pid + " connection timeout. Last Attempt.");
								Par.Poll = false;
							}, Par.Timeout);
						}
						log.v("Local Broker " + Par.Pid + " is Polling");
						if ("Sock" in Vlt)
							delete Vlt["Sock"];
						setTimeout(connectLoop, 3000);
					} else {
						//else hard fail
						fun("connection declined", com);
					}
				});

				sock.on('disconnect', (err) => {
					log.i(' ** Local Broker disconnected:' + err);

					if (Par.Poll) {
						if ("Sock" in Vlt)
							delete Vlt[Sock];
						setTimeout(connectLoop, 3000);

					} else {
						//Return a hard fail. Should be only called once.
						fun("Connection Declined");
					}
				});


				sock.on('data', function (data) {
					var nd = data.length;
					var i1 = 0;
					var i2;
					var STX = 2;
					var ETX = 3;
					if (Vlt.State == 0)
						Vlt.Buf = '';
					for (let i = 0; i < nd; i++) {
						switch (Vlt.State) {
							case 0:
								if (data[i] == STX) {
									Vlt.Buf = '';
									Vlt.State = 1;
									i1 = i + 1;
								}
								break;
							case 1:
								i2 = i;
								if (data[i] == ETX)
									Vlt.State = 2;
								break;
						}
					}
					switch (Vlt.State) {
						case 0:
							break;
						case 1:
							Vlt.Buf += data.toString('utf8', i1, i2 + 1);
							break;
						default:
							Vlt.Buf += data.toString('utf8', i1, i2);
							Vlt.State = 0;
							let com = JSON.parse(Vlt.Buf);
							if (!("Module" in com)){
								fun("error retrieving module form broker",com);
							}else{
								fun(null, com);
							}
							break;
					}
				});
			}
		}
	}
})();