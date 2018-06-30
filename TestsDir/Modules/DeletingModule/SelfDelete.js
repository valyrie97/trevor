class SelfDelete {

	async Start(com, fun) {
		log.i("SelfDelete :: Start\n");
		log.i("Save Apex First: ", this.Par.SaveApexFirst);
		log.i("Delete Apex: ", this.Par.DeleteApex, "\n");

		log.v("First save the Entities");
		if (this.Par.SaveApexFirst) {
			log.v("Apex is doing its own save");
			await new Promise((resolve, reject) => {
				this.save((err, pid) => {
					if (err) return reject();
					resolve();
				});
			});
		}

		await new Promise((resolve, reject) => {
			this.send({ Cmd: "SaveNonApex" }, this.Par.NonApexEntity, (err, pid) => {
				if (err) return reject();
				resolve();
			});
		});

		fun(null, com);


		//commence deleting 
		if (this.Par.DeleteApex) {
			log.i("Deleting the apex in 10 seconds - all entities should be removed.")
			setTimeout(() => {
				this.deleteEntity((err, pid) => {
					log.i("Gone!---------");
				});
			}, 10000);
		} else {
			log.i("Deleting the nonApex in 10 seconds - only the nonApex Entity should be removed.")
			setTimeout(() => {
				this.send({ Cmd: "DeleteNonApex" }, this.Par.NonApexEntity, (err, pid) => {
					log.i("Gone!---------");
				});
			}, 10000);
		}
	}


	async SaveNonApex(com, fun) {
		log.i("SelfDelete :: SaveNonApex");
		await new Promise((resolve, reject) => {
			this.save((err, pid) => {
				if (err) return reject();
				resolve();
			})
		});
		fun()
	}

	async DeleteNonApex(com, fun) {
		log.i("SelfDelete :: DeleteNonApex");
		this.deleteEntity(fun);
	}
}
