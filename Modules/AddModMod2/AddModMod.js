//# sourceURL=AddModMod.js
(function AddModMod() {
	class AddModMod {

		async Start(com, fun) {
			log.i("--AddModMod/Start");
			let PromiseArray = [];
			let Modules = {};

			let ModNames = [
				"trevor.Modules.testSave",
			];

			for (let idx = 0; idx < ModNames.length; idx++) {
				log.i(`GetModule on ${ModNames[idx]}`);
				PromiseArray.push(new Promise((res, rej) => {
					this.send({ Cmd: "GetModule", Name: ModNames[idx] }, this.Par.Broker, (err, com) => {
						if (err){
							log.e(err);
							return;
						}
						Modules[ModNames[idx].split(".")[2]] = com.Module;
						res();
					});
				}));
			}

			//we can return while we wait for modules to get zipped and shipped
			fun(null, com);

			await Promise.all(PromiseArray);

			log.i("all modules received");
			PromiseArray = [];

			for (let mod in Modules) {
				PromiseArray.push(new Promise((res, rej)=>{
					this.addModule(mod, Modules[mod], (err, path) => {
						if (err){
							log.e(err);
							process.exit(1);
						}else{
							log.i("module loaded at ", path);
						}
						res();
					});
				}));
			}

			await Promise.all(PromiseArray);

			this.genModule({
				"Ping": {
					"Module": "testSave",
					"Par": {
					}
				}
			})

		}
	}
	return { dispatch: AddModMod.prototype }
})();