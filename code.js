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
		
		let F = 8.987*10**9 * (1/pole.distance(p)**2);
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

function line_to_sink(p) {
	for (let i=0;i<2000; i++) {
		
		v = calculate_v(p);
		v.normalize();
		v.scale(ACCURACY);
		
		let p2 = p.copy()
		p2.add(v);
		
		let last = false;
		for (let pole of minusPoles) {
			
			let sd = pole.sdf(p2)
			
			if (sd < ACCURACY) {
				v.normalize();
				v.scale(-sd)
				p2.subtract(v);
				last = true;
			}
		}
		
		if (p.isInRange(0 - TRANSLATION.x,
						0 - TRANSLATION.y,
						width - TRANSLATION.x,
						height - TRANSLATION.y) || 
			p2.isInRange(0 - TRANSLATION.x,
						0 - TRANSLATION.y,
						width - TRANSLATION.x,
						height - TRANSLATION.y)) {
		
			line(p.x, p.y, p2.x, p2.y);
			
			if ((i % ARROW_DENSITY == 0) && (!last) && (i != 0)) {
				v.normalize();
				let n = new Vec2(v.y, -v.x);
				let a1 = v.copy();
				let a2 = v.copy();
				a1.add(n);
				n.scale(-1);
				a2.add(n);
				a1.scale(-0.5*ARROW_LENGTH)
				a2.scale(-0.5*ARROW_LENGTH)
				
				line(p2.x, p2.y, p2.x + a1.x, p2.y + a1.y);
				line(p2.x, p2.y, p2.x + a2.x, p2.y + a2.y);
			}
		}

		
		if (last) break;
		
		p = p2.copy();
		
	}
	
}




let plusPoles;
let minusPoles;
let allPoles;

let mouse;
let zeroVec = new Vec2();

let densitySlider;
let accuracySlider;

let TRANSLATION;

let DENSITY;
let ACCURACY = 5;

let ARROW_DENSITY = 10;
let ARROW_LENGTH = 10;

let STROKE_WEIGHT = 1;

function setup() {
	createCanvas(1280, 720);
	
	optionsDiv = createDiv("")
	.position(0,0)
	.class("optionsDiv");

	densityLabel = createDiv("Liniendichte ")
	.parent(optionsDiv);	

	densitySlider = createSlider(10, 30, 15, 1)
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
		new Pole(-width * 0.25, 0, true),
	]
	minusPoles = [
		new Pole(width * 0.25, 0, false),
	]
}

function draw() {
	resizeCanvas(window.innerWidth, window.innerHeight, true)
	background(240);
	
	TRANSLATION = new Vec2(width/2, height/2)
	
	allPoles = [...plusPoles, ...minusPoles];
	
	translate(TRANSLATION.x, TRANSLATION.y);
	
	mouse = new Vec2(mouseX - TRANSLATION.x, mouseY - TRANSLATION.y);
	DENSITY = 1/densitySlider.value();	
	

	for (let pole of plusPoles) {
		for (let t=0;t<1;t+=DENSITY) {
			if (1-t < 0.0001) break; 
			let p = pole.pointOnCircuference(t);
			line_to_sink(p);
		}
	}
	
	
	for (let pole of allPoles) {
		pole.show();		
	}
}


// Button actions

function addPlus() {
	plusPoles.push(new Pole(0,0,true))
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


// Handling the the dragging of the poles with the mouse
let mouseDrag;
let draggedPole;

function mousePressed() {
	for (let pole of allPoles) {
		if (pole.sdf(mouse) <= 0) {
			draggedPole = pole;
			mouseDrag = true;
		}
	}
}

function mouseReleased() {
	mouseDrag = false;
}

function mouseDragged() {
	if (mouseDrag) {
		draggedPole.become(mouse);
	}
}