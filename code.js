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
	}
	
	sdf(p) {
		if (this.shape == 0) {
			return this.distance(p) - this.r
		}
	}
	
	pointOnCircuference(t) {
		let p = new Vec2();
		
		
		if (this.shape == 0) {
			p.x = Math.cos(t*6.28)*this.r + this.x;
			p.y = Math.sin(t*6.28)*this.r + this.y;
		}
		
		return p;
	}
	tFromPointOnCircumference(p) {
		let t;
		
		if (this.shape == 0) {
			t = Math.atan2((p.y - this.y)/this.r, (p.x - this.x)/this.r);
			//if (t < 0) t = 1 - abs(t);
			t /= 6.28;
		}
		
		return t;
	}
	
	show() {
		let c = [0,0,255]
		if (this.source) c = [255, 0, 0];
		fill(c);
		
		if (this.shape == 0) {
			circle(this.x, this.y, this.r*2);
		}
		
		let length = 0.5 *this.r;
		
		strokeWeight(5);
		line(this.x - length, this.y, this.x + length, this.y);
		if (this.source) {
			line(this.x, this.y - length, this.x, this.y + length);
		}
		strokeWeight(STROKE_WEIGHT);
	}

}

function calculate_v(p) {
	let v = new Vec2()
	for (let pole of allPoles) {
		let r = p.copy();
		r.subtract(pole);
		
		if (r.isEqual(zeroVec)) {
			return zeroVec.copy()
		}
		
		let F = (1/pole.distance(p)**2); //* 8.987*10**9
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

function fieldLine(p, poleList) {
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
		
		if ((!inBounds) && (i > 0)) v.scale(OUTOFBOUNDS_MULTIPLIER);
		
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
			}
			
			if (i == iterations - 1) {
				if (!inBounds) return false;
				
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
		}
		else if((justGotOutOfBounds) && (i > 20)) {
			justGotOutOfBounds = false;
			
			let diff = v.copy();
			diff.subtract(old_v);
			//console.log(diff.length());
			if (diff.length() < 0.002) {
				return false;
			}
		}

		
		if (last || (i == MAX_ITERATIONS)) break;
		
		old_v = v;
		p = p2.copy();
		
	}
	return false;
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
let ACCURACY = 5;
let OUTOFBOUNDS_MULTIPLIER = 17;

let ARROW_DENSITY = 10;
let ARROW_LENGTH = 10;

let MAX_ITERATIONS = 1000;

let STROKE_WEIGHT = 1;

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
			fieldLine(p, minusPoles);
		}
		pole.show();
	}
	
	
	for (let pole of minusPoles) {
		/*
		for(let i=0;i<pole.hits.length;i++) {
			let hit0 = pole.hits[i];
			let hit1;
			if (i == pole.hits.length -1) {
				hit1 = pole.hits[0];
			}
			else {
				hit1 = pole.hits[i+1];
			}
			
			let t0 = pole.tFromPointOnCircumference(hit0);
			let t1 = pole.tFromPointOnCircumference(hit1);
			
			if (Math.abs(t0 - t1) <= DENSITY) continue;
			
			while (t0 < t1) {
				circle(hit0.x, hit0.y, 10);
				circle(hit1.x, hit1.y, 10);
				t0 += DENSITY;
				if (t1 - t0 > DENSITY) {
					let p = pole.pointOnCircuference(t0);
					fieldLine(p, plusPoles);
				}
			}
		}
		*/
		pole.hits = [];
		pole.show();		
	}
	
	/*
	line(mouse.x, mouse.y, minusPoles[0].x, minusPoles[0].y);
	let p = mouse.copy();
	p.subtract(minusPoles[0]);
	p.normalize();
	p.scale(minusPoles[0].r);
	p.add(minusPoles[0]);
	let t = minusPoles[0].tFromPointOnCircumference(p);
	console.log(t);
	*/
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


// Handling the the dragging of the poles with the mouse (and touch)
let mouseDrag;
let draggedPole;
document.ontouchmove = function(event) {
	event.preventDefault();
}

function mousePressed() {
	for (let pole of allPoles) {
		if (pole.sdf(mouse) <= 0) {
			draggedPole = pole;
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