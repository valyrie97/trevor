(function SceneManager() {

	let dispatch = {
		Start: Start,
		Setup: Setup
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------rgbToHex
	function rgbToHex(r, g, b) {
		return (r << 16) + (g << 8) + b;
	}

	//-----------------------------------------------------Setup
	async function Setup(com, fun) {
		log.v('--SceneManager/Setup');

		//setups need to be manaually sent to all not Apex entities
		let setupArray = [
			new Promise((resolve, reject) => {
				this.send({ Cmd: "Setup" }, this.Par.HeatField, resolve);
			}),
			new Promise((resolve, reject) => {
				this.send({ Cmd: "Setup" }, this.Par.BugArray, resolve);
			})
		];

		var Vlt = this.Vlt;
		let Par = this.Par;
		let that = this;
		Vlt.Active = false;
		Vlt.Mouse = {};
		Vlt.Mouse.Mode = 'Idle';
		Vlt.Mouse.inPanel = true;

		//this is the old way of creating brower side divs for an easier approach look into xGraph Views
		var div = Vlt.div;
		div.id = 'Grok';
		div.style.height = '100%';
		document.getElementsByTagName('body')[0].appendChild(div);

		$("body").css('overflow', 'hidden');
		var Grok = $('#Grok');

		//this is the old way of utilizing mouse interaction for a modern approach look at 3DView.js
		Grok.mouseenter(function (evt) {
			mouseEnter(evt, that);
		});
		Grok.mouseleave(function (evt) {
			mouseLeave(evt, that);
		});
		Grok.bind('mousewheel DOMMouseScroll', function (evt) {
			mouseWheel(evt, that);
		});
		Grok.mousedown(function (evt) {
			mouseDown(evt, that);
		});
		Grok.mousemove(function (evt) {
			mouseMove(evt, that);
		});
		Grok.mouseup(function (evt) {
			mouseUp(evt, that);
		});
		window.addEventListener('keydown', function (evt) {
			switch (evt.keyCode) {
				case 113:
					if (Vlt.Active)
						Vlt.Active = false;
					else
						Vlt.Active = true;
					Vlt.knt = 0;
					break;
				case 32:
					if (Vlt.Active)
						Vlt.Active = false;
					else
						Vlt.Active = true;
					Vlt.knt = 0;
					break;
				default:
			}
		});

		window.alert("Press the Spacebar or F2 key to toggle operation");

		var div = document.getElementById("Grok");
		Vlt.Render = new THREE.WebGLRenderer({ antialias: true });

		Vlt.Render.setSize(div.scrollWidth, div.scrollHeight);
		div.appendChild(Vlt.Render.domElement);

		Vlt.Scene = new THREE.Scene();
		Vlt.Focus = new THREE.Vector3(Par.Focus[0], Par.Focus[1], Par.Focus[2]);

		Vlt.Camera = new THREE.PerspectiveCamera(45,
			div.scrollWidth / div.scrollHeight, 0.1, 2000000);
		Vlt.Camera.position.x = 175;
		Vlt.Camera.position.y = 175;
		Vlt.Camera.position.z = 175.0;
		Vlt.Camera.up.set(0.0, 0.0, 1.0);
		Vlt.Camera.lookAt(Vlt.Focus);
		Vlt.Camera.updateProjectionMatrix();
		Vlt.Ray = new THREE.Raycaster();
		Vlt.Mouse.Mode = 'Idle';

		var axes = new THREE.AxisHelper(100);
		axes.position.z = 0.01;
		Vlt.Scene.add(axes);

		Resize(Vlt);
		renderLoop(Vlt);

		//dont return until all other setups are complete
		await Promise.all(setupArray);

		if (fun) {
			fun(null, com);
		}

		//-----------------------------------------------------Render
		function renderLoop(vault) {
			Vlt = vault;
			loop();

			function loop() {
				Vlt.Render.render(Vlt.Scene, Vlt.Camera);
				requestAnimationFrame(loop);
			}
		}
	}


	function Start(com, fun) {
		log.v("--SceneManager/Start");
		let Vlt = this.Vlt;
		let Par = this.Par;
		let that = this;

		let delay = Par.Delay || 20;
		log.v("Delay is ", delay);
		Vlt.Pulse = setInterval(step, delay);

		function step() {
			if (Vlt.Active) {

				let q = { "Cmd": "MoveBugs" };

				if (Vlt.Scene.getObjectByName("heatField")) {
					q.heatField = true;
				}

				that.send(q, Par.BugArray, updateBugs);

				function updateBugs(err, com) {
					//returned from bug update
					if (err)
						log.v("--Error: ", err);
					if (Vlt.Scene.getObjectByName("bugSystem")) {
						Vlt.Scene.getObjectByName("bugSystem").geometry = com.System.geometry;
						Vlt.Scene.getObjectByName("bugSystem").geometry.verticesNeedUpdate = true;
					} else {
						let system = new THREE.Points(com.System.geometry, com.System.material);
						system.name = "bugSystem";
						system.sortParticles = true;
						Vlt.Scene.add(system);
					}

					let q = { "Cmd": "UpdateField" };
					if (Vlt.Scene.getObjectByName("bugSystem")) {
						q.vertices = Vlt.Scene.getObjectByName("bugSystem").geometry.vertices;
						q.outputTemps = Vlt.Scene.getObjectByName("bugSystem").geometry.outputTemps;
					}

					that.send(q, Par.HeatField, updateField);

					function updateField(err, com) {
						//returned from the field update
						if (err)
							log.v("--Error: ", err);
						if (Vlt.Scene.getObjectByName("heatField")) {
							Vlt.Scene.getObjectByName("heatField").geometry = com.System.geometry;
							Vlt.Scene.getObjectByName("heatField").geometry.colorsNeedUpdate = true;


						} else {
							let system = new THREE.Points(com.System.geometry, com.System.material);
							system.name = "heatField";
							system.sortParticles = true;
							Vlt.Scene.add(system);
							log.v(Vlt.Scene.children);
						}
						if (Vlt.knt % 100 == 0)
							log.v("Count is ", Vlt.knt);
						Vlt.knt++;
					}
				}
			} else {
				log.v("--sim not running--");
			}
		}


		if (fun)
			fun(null, com);
	}


	//-----------------------------------------------------Resize
	function Resize(vault) {
		var div = document.getElementById("Grok");
		var w = div.scrollWidth;
		var h = div.scrollHeight;
		var Vlt = vault;
		var parent = div;
		var styles = getComputedStyle(parent);
		div.style.overflow = 'hidden';
		var w = parseInt(styles.getPropertyValue('width'), 10);
		var h = parseInt(styles.getPropertyValue('height'), 10);
		Vlt.Mouse.Mode = 'Idle';
		Vlt.Render.setSize(w, h);
		Vlt.Camera.aspect = w / h;
		Vlt.Camera.updateProjectionMatrix();
	}

	//-----------------------------------------------------mouseEnter
	function mouseEnter(evt, context) {
	}

	//-----------------------------------------------------mouseLeave
	function mouseLeave(evt, context) {
	}

	//-----------------------------------------------------mouseDown
	function mouseDown(evt, context) {
		var vlt = context.Vlt;
		var info = mouseRay(evt, vlt);
		if (info == null)
			info = {};
		info.Mouse = {};
		info.Mouse.x = evt.clientX;
		info.Mouse.y = evt.clientY;
		switch (evt.which) {
			case 1:	// Left mouse
				info.Action = 'LeftMouseDown';
				break;
			case 3: // Right mouse
				info.Action = 'RightMouseDown';
				break;
			default:
				return;
		}
		Dispatch(info, context);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseUp
	function mouseUp(evt, context) {
		var info = {};
		switch (evt.which) {
			case 1: // Left mouse
				info.Action = 'LeftMouseUp';
				break;
			case 3: // Right mouse
				info.Action = 'RightMouseUp';
				break;
			default:
				return;
		}
		Dispatch(info, context);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseWheel
	function mouseWheel(evt, context) {
		var fac;

		var evt = evt.originalEvent;

		var direction = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
		fac = direction;

		var info = {};
		info.Action = 'Wheel';
		info.Factor = fac;
		Dispatch(info, context);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseMove
	function mouseMove(evt, context) {
		var vlt = context.Vlt;
		var info = mouseRay(evt, vlt);
		if (!info)
			return;
		info.Action = 'Move';
		info.Mouse = {};
		info.Mouse.x = evt.clientX;
		info.Mouse.y = evt.clientY;
		Dispatch(info, context);
		evt.stopPropagation();
		evt.returnValue = false;
	}

	//-----------------------------------------------------mouseRay
	function mouseRay(evt, vlt) {
		var info = {};
		vlt.Ray.precision = 0.00001;
		container = document.getElementById("Grok");
		var w = container.clientWidth;
		var h = container.clientHeight - 2 * container.clientTop;
		var vec = new THREE.Vector2();
		vec.x = 2 * (evt.clientX - container.offsetLeft) / w - 1;
		vec.y = 1 - 2 * (evt.clientY - container.offsetTop) / h;
		vlt.Ray.setFromCamera(vec, vlt.Camera);
		var hits = vlt.Ray.intersectObjects(vlt.Scene.children, true);
		var hit;
		var obj;
		return info;
	}

	//-----------------------------------------------------Dispatch
	function Dispatch(info, context) {
		var vlt = context.Vlt;
		var dispatch;
		if ('Dispatch' in vlt) {
			dispatch = vlt.Dispatch;
		} else {
			vlt.Dispatch = {};
			dispatch = vlt.Dispatch;
			harvest(Translate);
			harvest(Rotate);
			harvest(Zoom);
		}
		var key = vlt.Mouse.Mode + '.' + info.Action;
		if ('Type' in info)
			key += '.' + info.Type;
		info.Key = key;
		if (key in dispatch) {
			var proc = dispatch[key];
			proc(info, context);
		}

		function harvest(proc) {
			var q = {};
			q.Action = 'Harvest';
			q.Keys = [];
			proc(q, context);
			for (var i = 0; i < q.Keys.length; i++) {
				var key = q.Keys[i];
				dispatch[key] = proc;
			}
		}
	}

	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	function Zoom(info, context) {
		if (info.Action == 'Harvest') {
			info.Keys.push('Idle.Wheel');
			return;
		}
		var v = new THREE.Vector3();
		v.fromArray(context.Vlt.Camera.position.toArray());
		var vfoc = new THREE.Vector3();
		vfoc.fromArray(context.Vlt.Focus.toArray());
		v.sub(vfoc);
		var fac;
		if (info.Factor > 0)
			fac = 0.95 * info.Factor;
		else
			fac = -1.05 * info.Factor;
		v.multiplyScalar(fac);
		var vcam = vfoc.clone();
		vcam.add(v);
		context.Vlt.Camera.position.fromArray(vcam.toArray());
		context.Vlt.Camera.lookAt(context.Vlt.Focus);
		context.Vlt.Camera.updateProjectionMatrix();

	}
	//-----------------------------------------------------Translate
	// Move in a plane perpendicular to the view vector
	function Translate(info, context) {
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
			var mouse = context.Vlt.Mouse;
			mouse.Mode = 'Translate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function move() {
			var mouse = context.Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(context.Vlt.Camera.position.toArray());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(context.Vlt.Focus.toArray());
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
			context.Vlt.Camera.position.fromArray(vcam.toArray());
			context.Vlt.Focus.fromArray(vfoc.toArray());
			context.Vlt.Camera.lookAt(context.Vlt.Focus);
			context.Vlt.Camera.updateProjectionMatrix();

			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			var vlt = context.Vlt;
			vlt.Mouse.Mode = 'Idle';
		}
	}


	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	function Rotate(info, context) {
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
			var mouse = context.Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			var mouse = context.Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(context.Vlt.Camera.position.toArray());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(context.Vlt.Focus.toArray());
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
			context.Vlt.Camera.position.fromArray(vcam.toArray());
			context.Vlt.Camera.lookAt(context.Vlt.Focus);
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			var vlt = context.Vlt;
			vlt.Mouse.Mode = 'Idle';
		}
	}


})();
