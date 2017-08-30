//# sourceURL=Mouse
(function Mouse() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		SetDomElement:SetDomElement
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Start
	function SetDomElement(com, fun) {
		console.log('--Mouse/SetDomElement');
		let Vlt = this.Vlt;
		Vlt.domElement = $(com.DomElement);
		Vlt.Active = false;
		Vlt.Mouse = {};
		Vlt.Mouse.Mode = 'Idle';
		Vlt.Mouse.inPanel = true;
		domElement = Vlt.domElement

		domElement.on("mouseenter",(evt) => {
		});
		domElement.on("mouseleave", (evt) => {
		});
		domElement.on("wheel", (evt) =>{
			var evt = evt.originalEvent;
			var fac = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
			var info = {};
			info.Action = 'Wheel';
			info.Factor = fac;
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("mousedown", (evt) => {
			var info = mouseRay(evt, Vlt);
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
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("mousemove", (evt) =>{
			var info = mouseRay(evt, Vlt);
			if (!info)
				return;
			info.Action = 'Move';
			info.Mouse = {};
			info.Mouse.x = evt.clientX;
			info.Mouse.y = evt.clientY;
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});
		domElement.on("mouseup", (evt) => {
			var info = {};
			switch (evt.which) {
				case 1:	// Left mouse
					info.Action = 'LeftMouseUp';
					break;
				case 3: // Right mouse
					info.Action = 'RightMouseUp';
					break;
				default:
					return;
			}
			this.send({Cmd:"DispatchEvent", info:info, mouse:Vlt.Mouse}, this.Par.Handler);
			evt.stopPropagation();
			evt.returnValue = false;
		});

		domElement.on('keydown', function (evt) {
			switch (evt.code) {
				case 'F10':
					evt.preventDefault();
					openCLI();
					break;
				case 'F2':
					if (Vlt.Active)
						Vlt.Active = false;
					else
						Vlt.Active = true;
					Vlt.knt = 0;
				default:
			}
		});

	}

	//-----------------------------------------------------mouseRay
	function mouseRay(evt, Vlt) {
		var info = {};
		//Vlt.Ray.precision = 0.00001;
		//container = document.getElementById("domElement");
		let container = Vlt.domElement;
		var w = container.width;
		var h = container.height;
		var vec = new THREE.Vector2();
		vec.x = 2 * (evt.clientX - container.offsetLeft) / w - 1;
		vec.y = 1 - 2 * (evt.clientY - container.offsetTop) / h;
		// Vlt.Ray.setFromCamera(vec, Vlt.Camera);
		// var hits = Vlt.Ray.intersectObjects(Vlt.Scene.children, true);
		// var hit;
		// var obj;
		//console.log('Hits length is', hits.length);
		// for (var i = 0; i < hits.length; i++) {
		// 	hit = hits[i];
		// 	obj = hit.object;
		//
		// 	var pt;
		// 	while (obj != null) {
		//
		// 		//	console.log('hit', hit);
		// 		//	console.log('mouseRay', data);
		//
		// 		switch (obj.name) {
		// 			case 'heatField':
		//
		// 				info.Type = 'heatField';
		// 				info.Point = hit.point;
		// 				break;
		//
		// 			case 'bugSystem':
		// 				info.Type = 'bugSystem';
		// 				info.Point = hit.point;
		// 				break;
		// 		}
		// 		pt = hit.point;
		//
		//
		// 		obj = obj.parent;
		// 	}
		// }

		return info;
	}



})();