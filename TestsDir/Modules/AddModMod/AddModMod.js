//# sourceURL=AddModMod.js
(function AddModMod() {
	class AddModMod {

		async Start(com, fun) {
			log.i("--AddModMod/Start");
			let PromiseArray = [];
			let Modules = {};

			let ModNames = this.Par.Modules;

			for (let idx = 0; idx < ModNames.length; idx++) {
				log.v(`GetModule on ${ModNames[idx]}`);
				PromiseArray.push(new Promise((res, rej) => {
					this.send({ Cmd: "GetModule", Name: ModNames[idx] }, this.Par.Broker, (err, com) => {
						Modules[ModNames[idx]] = com.Module;
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
					this.addModule(mod, Modules[mod], () => {
						res();
					});
				}));
			}

			await Promise.all(PromiseArray);

			this.genModule(this.Par.TestSystem);

		}
	}
	return { dispatch: AddModMod.prototype }
})();