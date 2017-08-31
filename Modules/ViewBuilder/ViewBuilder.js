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
			



			//for the 3 layer grid wth gradient color by z axis
			//
			//
			// this.Vlt.zRange = [0, 3];
			// this.Vlt.Noise = [0.2,0.2,0.2];
			// this.Vlt.zStep = 1; //in minimum of single units
			// this.Vlt.xStep = 1; //in minimum of single units
			// this.Vlt.yStep = 1; //in minimum of single units
			// this.Vlt.xRadius = 5;
			// this.Vlt.zRadius = 3;
			// this.Vlt.yRadius = 5;
			// this.Vlt.probRange = [.3, 0];
			// this.Vlt.connRange = [.2, 0];
			//this.Vlt.gradientColor = true;
			









			this.Vlt.zRange = [0, 1];
			this.Vlt.Noise = [0.2,0.2,0.2];
			this.Vlt.zStep = 1; //in minimum of single units
			this.Vlt.xStep = 1; //in minimum of single units
			this.Vlt.yStep = 1; //in minimum of single units
			this.Vlt.xRadius = 1;
			this.Vlt.zRadius = 1;
			this.Vlt.yRadius = 1;
			this.Vlt.probRange = [.5, .5];
			this.Vlt.connRange = [.2, .2];
			this.Vlt.gradientColor = false;
			this.Vlt.colorSet = [[255,0,0],[0,255,0],[255,255,0],[255,0,255],[0,255,255]];
			this.Vlt.colorScheme = (this.Vlt.GradientColor? ((x,y,z) =>{
				console.log([x,y,z], (1-((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])))*255);
				let r = (Math.floor((1- ((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])))*255) << 16) & 0xFF0000;
				let g = (Math.floor((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])*255) <<  8) & 0x00FF00;
				let b = (0& 0x0000ff);//(Math.floor((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0])*255)      ) & 0x0000FF;
				
				return (r+g+b);
			}):((x,y,z)=>{
				let rgb = this.Vlt.colorSet[Math.floor(Math.random()*this.Vlt.colorSet.length)];
				return ((rgb[0]<<16&0xff0000)+(rgb[1]<<8&0xffff)+(rgb[2]&0xff));
			}));

			this.send({Cmd:"BuildNetwork"}, this.Par.Pid);

			fun(null, com);
		}

		BuildNetwork(com, fun){
			console.log("ViewBuilder/BuildNetwork");
			
			if (!("ConnData" in this.Vlt))
				this.Vlt.ConnData = {};
			if (!("Locs" in this.Vlt))
				this.Vlt.Locs = [];
			if (!("Levels" in this.Vlt))
				this.Vlt.Levels = {};
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
						Position: location.map( (num,idx)=>{return (num+(Math.random()*2*this.Vlt.Noise[idx] - this.Vlt.Noise[idx]));}),
						Color: this.Vlt.colorScheme(...location),
						Connections:[]
					}

					if (!(location[2] in this.Vlt.Levels))
						this.Vlt.Levels[[location[2]]] = [];
					this.Vlt.Levels[location[2]].push(i);
					
				}
			}

			console.log("There are ", this.Vlt.nodeCount, " nodes");
 			console.log("Levels: ",this.Vlt.Levels);


			//determing the connection numbers between layers;
			let connPercent,connNum;
			for (let z in this.Vlt.Levels){
				if (! this.Vlt.Levels.hasOwnProperty(z))
					continue;
				console.log("z is ", z, ((z-1)<this.Vlt.zRange[0]?this.Vlt.zRange[0]:(z-1)));
				connPercent =  this.Vlt.connRange[0] + (this.Vlt.connRange[1]-this.Vlt.connRange[0])*((z-this.Vlt.zRange[0])/(this.Vlt.zRange[1]-this.Vlt.zRange[0]));
				let index = (((z-1)<this.Vlt.zRange[0]?this.Vlt.zRange[0]:(z-1)) in this.Vlt.Levels?((z-1)<this.Vlt.zRange[0]?this.Vlt.zRange[0]:(z-1)): (1+ ((z-1)<this.Vlt.zRange[0]?this.Vlt.zRange[0]:(z-1))));
				connNum = (Math.floor(this.Vlt.Levels[index].length*connPercent)<1?1:(Math.floor(this.Vlt.Levels[index].length*connPercent)));
				this.Vlt.ConnData[z] = {
					PercentBelow: connPercent,
					NumberBelow: connNum
				}
			}
			//console.log(this.Vlt.ConnData);


			//add the connections to each node
			for (let key in this.Vlt.Nodes){
				if (! this.Vlt.Nodes.hasOwnProperty(key))
					continue;
				let z  = ((this.Vlt.Locs[key][2]-1)<this.Vlt.zRange[0]?this.Vlt.zRange[0]:(this.Vlt.Locs[key][2]-1));
				//copy the array to select from 
				let cpy = this.Vlt.Levels[z].map((value)=>{return value});
				do {
					let idx = Math.floor(Math.random()*cpy.length);
					this.Vlt.Nodes[key].Connections.push(cpy.splice(idx,1)[0]);
				}
				while (this.Vlt.Nodes[key].Connections.length<this.Vlt.ConnData[z+1].NumberBelow)
			}

			//console.log(this.Vlt.Nodes);








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