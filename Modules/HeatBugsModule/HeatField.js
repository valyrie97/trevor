(function HeatField() {

	var dispatch = {
		Setup: Setup,
		UpdateField: UpdateField,

	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		log.v('--HeatField/Setup');

		let Par = this.Par;
		let Vlt = this.Vlt;

		let range = Par.FieldDimension;
		log.v("from", 0, "to", range);

		__HeatField = [];

		Vlt.material = new THREE.PointsMaterial({ size: 2.5, vertexColors: true });
		Vlt.material.name = "FieldMaterial";
		Vlt.material.transparent = true;
		Vlt.material.depthWrite = false;
		Vlt.material.opacity = 0.01;
		Vlt.material.alpha = 0.01;

		Vlt.material.blending = THREE.CustomBlending;
		Vlt.material.blendEquation = THREE.MaxEquation; //default
		Vlt.material.blendSrc = THREE.SrcAlphaFactor; //default
		Vlt.material.blendDst = THREE.DstAlphaFactor; //default

		Vlt.MaxFieldTemp = 1;
		Vlt.MinFieldTemp = 0;

		if (fun)
			fun();
	}

	function xyzToIdx(x, y, z, range) {
		return (range * range * x + range * y + z);
	}

	function idxToXyz(idx, range) {
		return ({
			"x": Math.floor(idx / (range * range)),
			"y": Math.floor((idx % (range * range)) / range),
			"z": idx % range
		})
	}

	function UpdateField(com, fun) {
		//log.v("--HeatField/UpdateField");
		let Vlt = this.Vlt;
		let Par = this.Par;
		//we need to update the field
		let range = Par.FieldDimension;

		let bugvertices = com.vertices;
		let bugoutput = com.outputTemps;
		let vertex, updatedTemp, idx;

		for (let i = 0; i < bugvertices.length; i++) {
			vertex = bugvertices[i];
			idx = xyzToIdx(vertex.x, vertex.y, vertex.z, range);
			updatedTemp = __HeatField[idx] + bugoutput[i] || bugoutput[i];
			__HeatField[idx] = updatedTemp;
		}
		let TempField = [];

		for (let idx in __HeatField) {
			TempField[idx] = __HeatField[idx] * (1 - Par.Diffusion);
		}
		let nbhd = Par.Nbhd;

		for (let key in __HeatField) {
			vertex = idxToXyz(key, range);

			for (let n = 0; n < nbhd.x.length; n++) {

				if (vertex.x + nbhd.x[n] < 0 || vertex.x + nbhd.x[n] >= range) {
					continue;
				}
				if (vertex.y + nbhd.y[n] < 0 || vertex.y + nbhd.y[n] >= range) {
					continue;
				}
				if (vertex.z + nbhd.z[n] < 0 || vertex.z + nbhd.z[n] >= range) {
					continue;
				}
				idx = xyzToIdx(vertex.x + nbhd.x[n], vertex.y + nbhd.y[n], vertex.z + nbhd.z[n], range);

				if (isNaN(idx))
					debugger;

				if (TempField[idx]) {
					TempField[idx] += __HeatField[key] * (Par.Diffusion / nbhd.x.length);
				}
				else {
					TempField[idx] = __HeatField[key] * (Par.Diffusion / nbhd.x.length);
				}
			}
		}

		let newtemp;
		Vlt.MinFieldTemp = 100000;
		Vlt.MaxFieldTemp = 0;
		for (let key in TempField) {
			newtemp = TempField[key] * (1 - Par.Cooling);
			if (newtemp > Vlt.MaxFieldTemp)
				Vlt.MaxFieldTemp = newtemp;
			if (newtemp < Vlt.MinFieldTemp)
				Vlt.MinFieldTemp = newtemp;

			TempField[key] = newtemp;
		}

		let color, l;
		__HeatField = [];
		Vlt.geometry = new THREE.Geometry();
		Vlt.geometry.name = "FieldGeometry";

		for (let key in TempField) {
			vertex = idxToXyz(key, range);

			l = ((TempField[key] - Vlt.MinFieldTemp)
				/ (Vlt.MaxFieldTemp - Vlt.MinFieldTemp));

			if (l < 0.01) {
				l = 0;
			}

			let particle = new THREE.Vector3(vertex.x, vertex.y, vertex.z);

			color = new THREE.Color();
			color.setHSL(.17, 1, l);

			if (l == 0) {
				continue;
			}

			Vlt.geometry.vertices.push(particle);
			Vlt.geometry.colors.push(color);

			__HeatField[key] = TempField[key];
		}

		com.System = { "geometry": Vlt.geometry, "material": Vlt.material };

		if (fun)
			fun(null, com);
	}

})();