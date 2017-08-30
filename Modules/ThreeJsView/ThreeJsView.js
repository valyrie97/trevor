//# sourceURL=ThreeJsView/ThreeJsView
(function ThreeJsView() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		SetPosition: SetPosition,
		DOMLoaded: DOMLoaded,
		DispatchEvent:DispatchEvent
	};

	return Viewify(dispatch);

	function Setup(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--View3D/Setup');
			let div = this.Vlt.div;
			var View = {};
			this.Vlt.div.data('View', View);

			View.Renderer = new THREE.WebGLRenderer({ antialias: true });
			//View.Render.setClearColor(0xBEDCF7, 1);
			View.Renderer.setSize(div.scrollWidth, div.scrollHeight);
			View.Scene = new THREE.Scene();
			View.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
			View.Camera = new THREE.PerspectiveCamera(45,
				div.scrollWidth / div.scrollHeight, 0.1, 40000);
			div.append(View.Renderer.domElement);
			// View.Light = new THREE.DirectionalLight(0xFFFFFF);
			// View.Light.position.set(-40, 60, 100);
			// View.Scene.add(View.Light);
			//View.Ambient = new THREE.AmbientLight(0x808080);
			//View.Scene.add(View.Ambient);
			//var axes = new THREE.AxisHelper(100);
			//axes.position.z = 0.01;
			//View.Scene.add(axes);
			View.Camera.position.x = 20;
			View.Camera.position.y = 1;
			View.Camera.position.z = 6;
			View.Camera.up.set(0.0, 0.0, 1.0);
			View.Camera.lookAt(View.Focus);
			View.Camera.updateProjectionMatrix();


			View.geometry = new THREE.SphereGeometry( 0.25, 32, 32 );
			if (!("materials" in View))
				View.materials={};
			
			
			this.send({Cmd: "GetNetwork"}, this.Par.Server, (err, cmd)=>{

				this.Vlt.Network = cmd.Network;
				let sphere,position;

				let ids = Object.keys(this.Vlt.Network)
				for (let i=0; i<ids.length;i++){
					let key = ids[i];
					if (!this.Vlt.Network.hasOwnProperty(key))
						continue;

					if (!(`material_${this.Vlt.Network[key].Color}`in View.materials))
						View.materials[`material_${this.Vlt.Network[key].Color}`] = 
							new THREE.MeshBasicMaterial( {color: this.Vlt.Network[key].Color} );
					
					sphere = new THREE.Mesh( View.geometry, View.materials[`material_${this.Vlt.Network[key].Color}`] );
					position = this.Vlt.Network[key].Position;

					sphere.position.x = position[0];
					sphere.position.y = position[1];
					sphere.position.z = position[2];
					
					View.Scene.add( sphere );
				}

				console.log(View)			
			});

			loop();

			fun(null, com);

			function loop() {
				View.Renderer.render(View.Scene, View.Camera);
				requestAnimationFrame(loop);
			}
		});
	}

	function Start(com, fun) {
		console.log('--View3D/Start');

		this.genModule({
			"Module": 'Scrapyard:Modules/Mouse',
			"Par": {
				"Handler": this.Par.Pid
			}
		}, (err, pidApex)=>{
			this.send({Cmd:"SetDomElement", "DomElement": this.Vlt.div.data("View").Renderer.domElement}, pidApex, (err, cmd)=>{
				console.log("GenModed the Mouse and set the DomElement");
				fun(null, com);
			});
		});
	}


	function DOMLoaded(com, fun) {
		this.super(com, (err, cmd) => {
			let View = this.Vlt.div.data('View');
			View.Renderer.setSize(this.Vlt.div[0].scrollWidth, this.Vlt.div[0].scrollHeight);
			View.Camera.aspect = this.Vlt.div[0].scrollWidth / this.Vlt.div[0].scrollHeight
			View.Camera.updateProjectionMatrix();
			fun(null, com);
		});
	}

	//-------------------------------------------------SetPosition
	function SetPosition(com, fun) {
	//	console.log('--SetPositon');
		var Par = this.Par;
		var View = this.Vlt.div.data('View');
		obj3d = View.Inst[com.Instance];
		if('Instance' in com) {
			if(obj3d) {
				if('Position' in com) {
					var pos = com.Position;
					obj3d.position.x = pos[0];
					obj3d.position.y = pos[1];
					obj3d.position.z = pos[2];
				}
				if('Axis' in com && 'Angle' in com) {
					var axis = new THREE.Vector3(...com.Axis);
					var angle = Math.PI*com.Angle/180.0;
					obj3d.setRotationFromAxisAngle(axis, angle);
				}
			}
		}
		if(fun)
			fun(null, com);
	}


	//-----------------------------------------------------Dispatch
	function DispatchEvent(com, fun) {
		console.log("--ThreeJsView/DispatchEvent");
		let info = com.info;
		let Vlt= this.Vlt;
		Vlt.Mouse= com.mouse;

		var dispatch;
		if ('Dispatch' in Vlt) {
			dispatch = Vlt.Dispatch;
		} else {
			Vlt.Dispatch = {};
			dispatch = Vlt.Dispatch;
			harvest(Translate);
			harvest(Rotate);
			harvest(Zoom);
		}
		var key = Vlt.Mouse.Mode + '.' + info.Action;
		if ('Type' in info)
			key += '.' + info.Type;
		info.Key = key;
		console.log('Dispatch', key);
		if (key in dispatch) {
			var proc = dispatch[key];
			//proc(info, Vlt);
		}

		function harvest(proc) {
			var q = {};
			q.Action = 'Harvest';
			q.Keys = [];
			proc(q, Vlt);
			for (var i = 0; i < q.Keys.length; i++) {
				var key = q.Keys[i];
				dispatch[key] = proc;
				//	console.log('key', key);
			}
		}
	}

	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	// TBD: Remove Three.js dependancy
	function Zoom(info, Vlt) {
		if (info.Action == 'Harvest') {
			info.Keys.push('Idle.Wheel');
			return;
		}
		var v = new THREE.Vector3();
		v.fromArray(Vlt.Vlt.Camera.position.toArray());
		var vfoc = new THREE.Vector3();
		vfoc.fromArray(Vlt.Vlt.Focus.toArray());
		v.sub(vfoc);
		var fac;
		if (info.Factor > 0)
			fac = 0.95 * info.Factor;
		else
			fac = -1.05 * info.Factor;
		v.multiplyScalar(fac);
		var vcam = vfoc.clone();
		vcam.add(v);
		Vlt.Vlt.Camera.position.fromArray(vcam.toArray());
		Vlt.Vlt.Camera.lookAt(Vlt.Vlt.Focus);
		Vlt.Vlt.Camera.updateProjectionMatrix();
	}

	//-----------------------------------------------------Translate
	// Move in a plane perpendicular to the view vector
	// TBD: Remove Three.js dependancy
	function Translate(info, Vlt) {
		var dispatch = {
			'Idle.LeftMouseDown.Terrain': start,
			'Idle.LeftMouseDown': start,
			'Translate.Move': move,
			'Translate.Move.Terrain': move,
			'Translate.LeftMouseUp': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}
		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			//	console.log('..Translate/start', info.Key);
			var mouse = Vlt.Vlt.Mouse;
			mouse.Mode = 'Translate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function move() {
			//	console.log('..Translate/move', info.Key);
			var mouse = Vlt.Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(Vlt.Vlt.Camera.position.toArray());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(Vlt.Vlt.Focus.toArray());
			var v1 = new THREE.Vector3(0.0, 0.0, 1.0);
			var v2 = vcam.clone();
			v2.sub(vfoc);
			v2.normalize();
			var v3 = new THREE.Vector3();
			v3.crossVectors(v1, v2);
			var v4 = new THREE.Vector3();
			v4.crossVectors(v1, v3);
			var fac = 0.2 * (mouse.x - info.Mouse.x);
			v3.multiplyScalar(fac);
			vcam.add(v3);
			vfoc.add(v3);
			var fac = 1.0 * (mouse.y - info.Mouse.y);
			v4.multiplyScalar(-fac);
			vcam.add(v4);
			vfoc.add(v4);
			Vlt.Vlt.Camera.position.fromArray(vcam.toArray());
			Vlt.Vlt.Focus.fromArray(vfoc.toArray());
			Vlt.Vlt.Camera.lookAt(Vlt.Vlt.Focus);
			Vlt.Vlt.Camera.updateProjectionMatrix();

			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			//	console.log('..Translate/stop', info.Key);
			var Vlt = Vlt.Vlt;
			Vlt.Mouse.Mode = 'Idle';
		}
	}


	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	// TBD: Remove Three.js dependancy
	function Rotate(info, Vlt) {
		var dispatch = {
			'Idle.RightMouseDown.Terrain': start,
			'Idle.RightMouseDown': start,
			'Rotate.Move': rotate,
			'Rotate.Move.Terrain': rotate,
			'Rotate.RightMouseUp': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}
		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			//	console.log('..Rotate/start', info.Key);
			var mouse = Vlt.Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			//	console.log('..Rotate/move', info.Key);
			var mouse = Vlt.Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(Vlt.Vlt.Camera.position.toArray());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(Vlt.Vlt.Focus.toArray());
			var v1 = new THREE.Vector3(0.0, 0.0, 1.0);
			var v2 = vcam.clone();
			v2.sub(vfoc);
			var v3 = new THREE.Vector3();
			v3.crossVectors(v1, v2);
			v3.normalize();
			var ang = 0.003 * (mouse.x - info.Mouse.x);
			v2.applyAxisAngle(v1, ang);
			ang = 0.003 * (mouse.y - info.Mouse.y);
			v2.applyAxisAngle(v3, ang);
			vcam.copy(vfoc);
			vcam.add(v2);
			Vlt.Vlt.Camera.position.fromArray(vcam.toArray());
			Vlt.Vlt.Camera.lookAt(Vlt.Vlt.Focus);
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			//	console.log('..Translate/stop', info.Key);
			var Vlt = Vlt.Vlt;
			Vlt.Mouse.Mode = 'Idle';
		}
	}

})();