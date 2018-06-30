class SelfDelete {

	async Start(com, fun) {
		log.i("We're here, but will be gone in 10 seconds");
		//we can return while we wait for modules to get zipped and shipped
		fun(null, com);


		setTimeout(()=>{this.deleteEntity((err, pid)=>{
			log.i("Gone!---------");
		})}, 10000);
	}
}
