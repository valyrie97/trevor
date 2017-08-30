//# sourceURL=ViewBuilder.js
//jshint esversion: 6
(function ViewBuilder() {

	class ViewBuilder {
		Setup(com, fun) {
			console.log("ViewBuilder/Setup");
			this.Vlt.Nodes = {};
			/* 
			Nodes object will be structured as 
			{
				Position: [
					x,
					y,
					z
				],
				Color:"stringColor",
				Connections:[
					"idOfConnectedNodes"
				]
			}
			*/
			this.Vlt.Directory = this.Par.Directory ||`${process.cwd()}/Data/`;

			//this.Vlt.xRange = [-5,5];
			//this.Vlt.yRange = [-5,5];
			this.Vlt.zRange = [0, 3];
			this.Vlt.zStep = 1; //in minimum of single units
			this.Vlt.xStep = 1; //in minimum of single units
			this.Vlt.yStep = 1; //in minimum of single units
			this.Vlt.xRadius = 3;
			this.Vlt.zRadius = 3;
			this.Vlt.yRadius = 3;
			this.Vlt.probRange = [.3, .05];
			this.Vlt.colorScheme = (x,y,z) =>{
				let r = (255<<16)&0xff0000;//(Math.floor((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])*255) << 16) & 0xFF0000;
				let g = (Math.floor((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])*255) <<  8) & 0x00FF00;
				let b = 0//(Math.floor((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])*255)      ) & 0x0000FF;
				
				return (r+g+b);
			}

			this.send({Cmd:"BuildNetwork"}, this.Par.Pid);

			fun(null, com);
		}
		BuildNetwork(com, fun){
			console.log("ViewBuilder/BuildNetwork");
			
			if (!("Locs" in this.Vlt))
				this.Vlt.Locs = [];

			//discretize the populatable area
			for (let z = Math.round(this.Vlt.zRange[0]); 
				z <= this.Vlt.zRange[1]; 
				z += Math.floor(this.Vlt.zStep)
			){
				for (let x = Math.round(-1*Math.sqrt((this.Vlt.xRadius*this.Vlt.xRadius)*(1-(z*z)/(this.Vlt.zRadius*this.Vlt.zRadius)))); 
					x <= Math.sqrt((this.Vlt.xRadius*this.Vlt.xRadius)*1-(z*z)/(this.Vlt.zRadius*this.Vlt.zRadius));
					x += Math.floor(this.Vlt.xStep)
				){
					for (let y = Math.round(-1*Math.sqrt((this.Vlt.yRadius*this.Vlt.yRadius)*(1-(z*z)/(this.Vlt.zRadius*this.Vlt.zRadius)-(x*x)/(this.Vlt.xRadius*this.Vlt.xRadius))));
						y <= Math.sqrt((this.Vlt.yRadius*this.Vlt.yRadius)*(1-(z*z)/(this.Vlt.zRadius*this.Vlt.zRadius)-(x*x)/(this.Vlt.xRadius*this.Vlt.xRadius)));
						y += Math.floor(this.Vlt.yStep)
					){
						//console.log([x,y,z]);
						this.Vlt.Locs.push([x,y,z]);
					}
				}
			}
			this.Vlt.nodeCount = 0; 
			//based on the heigh determine where nodes actually exist and push them to the Nodes array in this.Vlt
			for (let i = 0; i<this.Vlt.Locs.length; i ++){
				let location = this.Vlt.Locs[i];
				let locProb = this.Vlt.probRange[0] + (this.Vlt.probRange[1]-this.Vlt.probRange[0])*((location[2]-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0]));
				//console.log(location, locProb)
				if (Math.random()<(this.Vlt.probRange[0] + locProb)){
					//we will add this location
					this.Vlt.nodeCount++;
					this.Vlt.Nodes[i] = {
						Position: location,
						Color: this.Vlt.colorScheme(...location),
						Connections:[
							"idOfConnectedNodes"
						]
					}
				}
			}

			console.log("There are ", this.Vlt.nodeCount, " nodes");

			fun(null,com);
		}
		SaveNetwork(com, fun) {
			this.Vlt.Par.Nodes = this.Par.Vlt.Nodes;
			this.SaveNetwork();
			
			fun(null, com);
		}
		GetNetwork(com, fun){
			console.log("--ViewBuilder/GetNetwork");
			com.Network = this.Vlt.Nodes;

			fun(null, com);
		}
	}

	return {
		dispatch: ViewBuilder.prototype
	};

})();