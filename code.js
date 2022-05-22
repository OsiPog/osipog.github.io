class Vec2 {
	
	constructor(x = 0,y = 0) {
		this.x = x;
		this.y = y;
	}
	
	distance (p) {
		return sqrt((this.x - p.x)**2 + (this.y - p.y)**2);
	}
	
	length() {
		return sqrt(this.x**2 + this.y**2)
	}
	
	normalize() {
		let len = this.length();
		this.x /= len;
		this.y /= len;
	}
	
	dot(v) {
		return this.x*v.x + this.y*v.y;
	}
	
	abs() {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
	}
	
	add(p) {
		this.x += p.x;
		this.y += p.y;
	}
	
	subtract(p) {
		this.x -= p.x;
		this.y -= p.y;	
	}
	
	scale(f) {
		this.x *= f;
		this.y *= f;
	}
	
	become(p) {
		this.x = p.x;
		this.y = p.y;
	}
	
	copy() {
		return new Vec2(this.x, this.y);
	}
	
	isEqual(v) {
		return (this.x == v.x) && (this.y == v.y);
	}
	
	isInRange(minX, minY, maxX, maxY) {
		return 	(this.x >= minX) &&
				(this.x <= maxX) &&
				(this.y >= minY) &&
				(this.y <= maxY)
	}
}

class Pole extends Vec2 {
	constructor(x, y, source, r = 20, d = 10, shape = 0) {
		super(x, y);
		
		this.source = source;
		this.r = r;
		this.d = d
		this.shape = shape;
		this.hits = [];
		
		this.p2;
	}
	
	closestPoint(p) {
		if (this.shape == 0) return this.copy();
		if (this.shape == 1) {
			let dir = this.p2.copy()
			dir.subtract(this);
			
			let len = dir.length();
			
			let pThis = this.copy();
			pThis.subtract(p);
			
			let p2This = this.copy();
			p2This.subtract(this.p2);
			
			
			let h = min(1,max(0,pThis.dot(p2This)/(len**2)))
			
			//if (p.isEqual(mouse)) console.log(h);
			
			dir.scale(h);
			dir.add(this);
			
			return dir;
		}
	}
	
	sdf(p) {
		if (this.shape == 0) {
			return this.distance(p) - this.r;
		}
		if (this.shape == 1) {
			let closest = this.closestPoint(p);
			return closest.distance(p) - this.r;
		}
	}
	
	pointOnCircuference(t) {
		let p = new Vec2();
		
		
		if (this.shape == 0) {
			p.x = Math.cos(t*6.28)*this.r + this.x;
			p.y = Math.sin(t*6.28)*this.r + this.y;
		}
		
		else if(this.shape == 1) {
			let mid = this.p2.copy();
			mid.subtract(this);
			mid.scale(0.5);
			mid.add(this);
			
			let ring = new Vec2();
			ring.x = Math.cos(t*6.28)*(this.distance(this.p2)+this.r)/2 + mid.x;
			ring.y = Math.sin(t*6.28)*(this.distance(this.p2)+this.r)/2 + mid.y;
			
			let closest = this.closestPoint(ring);
			let dir = ring.copy();
			dir.subtract(closest);
			dir.normalize();
			dir.scale(this.r);
			
			closest.add(dir);
			p = closest;
		}
		
		return p;
	}
	tFromPointOnCircumference(p) {
		let t;
		
		if (this.shape == 0) {
			t = Math.atan2((p.y - this.y)/this.r, (p.x - this.x)/this.r)/6.28;			
			
			if (t < 0) t = 1 - abs(t);
		}
		else if (this.shape == 1) {
			let mid = this.p2.copy();
			mid.subtract(this);
			mid.scale(0.5);
			mid.add(this);
			
			let dir = p.copy();
			dir.subtract(mid);
			dir.normalize();
			
			t = Math.atan2(dir.y, dir.x)/6.28;
		}
		
		return t;
	}
	
	tNextHitTo(p) {
		let t0 = this.tFromPointOnCircumference(p);
		let t1 = 1;
		
		let closestToZero = 1;
		
		for(let hit of this.hits) {
			let hitT = this.tFromPointOnCircumference(hit);

			if (hitT > t0) {
				if (hitT-t0 < t1-t0) t1 = hitT;
			}
			if (hitT < closestToZero) closestToZero = hitT;
		}
		if (t1 == 1) {
			return closestToZero + 1;
		}
		
		return t1
	}
	
	show() {
		let c = [0,0,255]
		if (this.source) c = [255, 0, 0];
		fill(c);
		
		let signPos;
		
		if (this.shape == 0) {
			circle(this.x, this.y, this.r*2);
			signPos = this.copy();
		}
		else if (this.shape == 1) {
			let dir = this.p2.copy();
			dir.subtract(this);
			
			dir.scale(0.5)
			
			signPos = this.copy();
			signPos.add(dir);
			
			dir.normalize();
			let n = new Vec2(dir.y, -dir.x)
			n.scale(this.r);
			
			let A = this.copy();
			A.add(n);
			let B = this.copy();
			B.subtract(n);
			let C = this.p2.copy();
			C.add(n);
			let D = this.p2.copy();
			D.subtract(n);
			

			beginShape();
			vertex(A.x, A.y);
			stroke(0);
			vertex(C.x, C.y);
			vertex(D.x, D.y);
			stroke(1);
			vertex(B.x, B.y);
			endShape();
			circle(this.x, this.y, this.r*2);
			circle(this.p2.x, this.p2.y, this.r*2);
		}
		
		let length = 0.5 *this.r;
		
		strokeWeight(5);
		line(signPos.x - length, signPos.y, signPos.x + length, signPos.y);
		if (this.source) {
			line(signPos.x, signPos.y - length, signPos.x, signPos.y + length);
		}
		strokeWeight(STROKE_WEIGHT);
	}

}

function calculate_v(p) {
	let v = new Vec2()
	for (let pole of allPoles) {
		let r = p.copy();
		r.subtract(pole.closestPoint(p));
		
		if (r.isEqual(zeroVec)) {
			return zeroVec.copy()
		}
		
		let F = (1/(pole.sdf(p)+pole.r)**2); //* 8.987*10**9
		let Fv = r
		Fv.normalize()
		Fv.scale(F);
		
		if (!pole.source) {
			Fv.scale(-1)
		}
		
		v.add(Fv);
	}
	
	return v
	
}

function fieldLine(p, poleList, breakOnOutOfBounds = false) {
	let iterations = MAX_ITERATIONS/2
	let old_v = new Vec2()
	let justGotOutOfBounds;
	let inBounds;
	let direction = 1;
	if (poleList == plusPoles) direction = -1;
	
	for (let i=0;i<iterations; i++) {
		
		v = calculate_v(p);
		v.normalize();
		v.scale(ACCURACY*direction);
		
		let p2 = p.copy()
		p2.add(v);
		v.normalize();
		
		inBounds =		(p.isInRange(0 - TRANSLATION.x,
										0 - TRANSLATION.y,
										width - TRANSLATION.x,
										height - TRANSLATION.y) || 
							p2.isInRange(0 - TRANSLATION.x,
										0 - TRANSLATION.y,
										width - TRANSLATION.x,
										height - TRANSLATION.y))
		
		let last = false;
		let hitPole;
		for (let pole of poleList) {
			
			let sd = pole.sdf(p2)
			
			if (sd < ACCURACY) {
				v.scale(-sd)
				p2.subtract(v);
				last = true;
				
				let hit = p2.copy();
				hit.subtract(pole);
				hit.normalize();
				hit.scale(pole.r);
				hit.add(pole);
				pole.hits.push(hit);
				
				hitPole = pole;
			}
			
			if (i == iterations - 1) {
				if (!inBounds) return;
				
				let toPole = p2.copy()
				toPole.subtract(p);
				toPole.normalize();

				if (1 - toPole.dot(v) < 0.01 ) {
					iterations += 10;
				}
				
			}
		}
		
		if  (inBounds){
			
			justGotOutOfBounds = true;
			
			line(p.x, p.y, p2.x, p2.y);
			
			if ((i % ARROW_DENSITY == 0) && (!last) && (i != 0)) {
				let n = new Vec2(v.y, -v.x);
				let a1 = v.copy();
				let a2 = v.copy();
				a1.add(n);
				n.scale(-1);
				a2.add(n);
				a1.scale(-0.5*ARROW_LENGTH*direction)
				a2.scale(-0.5*ARROW_LENGTH*direction)
				
				line(p2.x, p2.y, p2.x + a1.x, p2.y + a1.y);
				line(p2.x, p2.y, p2.x + a2.x, p2.y + a2.y);
			}
		} else if (breakOnOutOfBounds) return false;
		
		if (last || (i == MAX_ITERATIONS)) return hitPole;
		
		old_v = v;
		p = p2.copy();
		
	}
	return;
}

function updateMousePos() {
	mouse = new Vec2(mouseX - TRANSLATION.x, mouseY - TRANSLATION.y);
}





let plusPoles = [];
let minusPoles = [];
let allPoles = [];

let mouse;
let zeroVec = new Vec2();

let densitySlider;
let accuracySlider;

let TRANSLATION;

let DENSITY;
let ACCURACY = 4;

let ARROW_DENSITY = 15;
let ARROW_LENGTH = 10;

let MAX_ITERATIONS = 500;

let STROKE_WEIGHT = 1;

let sendSort = true;
function setup() {
	createCanvas(1280, 720);
	
	optionsDiv = createDiv("")
	.position(0,0)
	.class("optionsDiv");

	densityLabel = createDiv("Liniendichte")
	.parent(optionsDiv);	

	densitySlider = createSlider(5, 40, 18, 1)
	.style("width", "60%")
	.style("height", "30px")
	.parent(optionsDiv);

	addPlusPoleButton = createButton("Pluspol hinzuf&#252gen")
	.class("sliderText")
	.parent(optionsDiv)
	.mouseClicked(addPlus);
	
	addMinusPoleButton = createButton("Minuspol hinzuf&#252gen")
	.class("sliderText")
	.parent(optionsDiv)
	.mouseClicked(addMinus);
	/*
	changePlusPoleButton = createButton("Pluspol &#228ndern")
	.class("sliderText")
	.parent(optionsDiv)
	.mouseClicked(changePlus);

	changeMinusPoleButton = createButton("Minuspol &#228ndern")
	.class("sliderText")
	.parent(optionsDiv)
	.mouseClicked(changeMinus);
	*/
	removePlusPoleButton = createButton("Pluspol entfernen")
	.class("sliderText")
	.parent(optionsDiv)
	.mouseClicked(removePlus);

	removeMinusPoleButton = createButton("Minuspol entfernen")
	.class("sliderText")
	.parent(optionsDiv)
	.mouseClicked(removeMinus);
	
	plusPoles = [
		new Pole(-width * 0.05, 0, true),
	];
	minusPoles = [
		new Pole(width * 0.05, 0, false),
	];
}

function draw() {
	// little hack to avoid scroll bars
	resizeCanvas(window.innerWidth - 3, window.innerHeight - 3, true)
	background(240);
	
	TRANSLATION = new Vec2(width/2, height/2);
	
	allPoles = [...plusPoles, ...minusPoles];
	
	translate(TRANSLATION.x, TRANSLATION.y);
	
	updateMousePos();
	DENSITY = 1/densitySlider.value();	

	for (let pole of plusPoles) {
		for (let t=0;t<1;t+=DENSITY) {
			if (1-t < 0.0001) break; 
			let p = pole.pointOnCircuference(t);
			let hit = fieldLine(p, minusPoles);
		}
		pole.show();
	}
	
	// line(mouse.x, mouse.y, minusPoles[0].x, minusPoles[0].y);
	// let p = mouse.copy();
	// p.subtract(minusPoles[0]);
	// p.normalize();
	// p.scale(minusPoles[0].r);
	// p.add(minusPoles[0]);
	// let t = minusPoles[0].tNextHitTo(p);
	// let hit = minusPoles[0].pointOnCircuference(t);
	// fill([255,0,0]);
	// circle(hit.x, hit.y,10);
	// console.log(t, minusPoles[0].tFromPointOnCircumference(p));
	
	for (let pole of minusPoles) {
		
		for (let hit of pole.hits) {
			let t0 = pole.tFromPointOnCircumference(hit);
			let t1 = pole.tNextHitTo(hit);
			
			while (t1-t0 > DENSITY) {
				t0 += DENSITY;
				if (t1-t0 <= DENSITY*0.5) break;
				let p = pole.pointOnCircuference(t0);
				fieldLine(p, plusPoles, true);
			}
		}
		pole.hits = [];
		pole.show();		
	}
	
}


// Button actions

function addPlus() {
	plusPoles.push(new Pole(0,0,true));
}

function removePlus() {
	plusPoles.pop();
}

function addMinus() {
	minusPoles.push(new Pole(0,0,false))
}

function removeMinus() {
	minusPoles.pop();
}

function changePlus() {
	changePole(plusPoles);
}
function changeMinus() {
	changePole(minusPoles);
}

function changePole(poleList) {
	let lastPole = poleList[plusPoles.length -1]
	if (lastPole.shape == 0) {
		if (!lastPole.p2) {
			lastPole.p2 = new Vec2(lastPole.x, lastPole.y + 200);
		}
		lastPole.shape = 1;
		return;
	}
	else if (lastPole.shape == 1) {
		lastPole.shape = 0;
		return;
	}
}


// Handling the the dragging of the poles with the mouse (and touch)
let mouseDrag;
let draggedPole;
document.ontouchmove = function(event) {
	event.preventDefault();
}

function mousePressed() {
	for (let pole of allPoles) {
		let mouseInP2 = false;
		if (pole.shape == 1) {
			controlPole = new Pole(pole.p2.x, pole.p2.y)
			mouseInP2 = controlPole.sdf(mouse) <= 0;
		}
		if ((pole.sdf(mouse) <= 0) || mouseInP2) {
			draggedPole = pole;
			if (mouseInP2) draggedPole = pole.p2;
			mouseDrag = true;
			return;
		}
	}
	mouseDrag = false;
}
function touchStarted() {
	updateMousePos();
	mousePressed();
}

function mouseReleased() {
	mouseDrag = false;
}
function touchEnded() {
	mouseDrag = false;
}

function mouseDragged() {
	if (mouseDrag) {
		draggedPole.become(mouse);
	}
}
function touchMoved() {
	mouseDragged();
}