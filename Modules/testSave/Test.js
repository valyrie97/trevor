class Test {
	Setup(com, fun) {
		//this function is typically used to allow the entity/module to handle any internal setup
		//procedures prior to being connected to by other entities/modules
		// log.i("in Setup about to save stuff to par");
		// this.Par.TestPar = "this Par has just been saved";
		// this.save(
		// 	(err, path) => {
		// 		if (err) log.e("Save Error", err);
				fun(null, com);
		// 	}
		// );
	}

	Start(com, fun) {
		//this function is typically used to allow the entity/module to handle any external setup
		//procedures
		log.i("get a start");
		this.send({ Cmd: "SaveNonApex" }, this.Par.Pal, (err, com) => {

			log.i("doneskis!!!!");
			fun(null, com);
		})
	}

	SaveNonApex(com, fun) {
		log.i("in SaveNonApex function");
		this.Par.NewTestPar = "this is the saved nonApex Par";
		this.save((err, path) => {

			fun(err, com);
		});
	}
}