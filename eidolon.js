
// Eidolon, a Javascript Canvas graphics library intended for games or other such animated applications.

// usage:
// initialize Eidolon object
// give a list of images to be loaded, and a function to be called once the loading is done
// in that "once the loading is done" function: start Eidolon object
// Eidolon runs an animation timer. A provided game function is called every frame. That function uses Eidolon functions to draw images, text, etc.. At the end of the timer frame Eidolon draws the image to the screen.
// Eidolon also keeps track of mouse state, position and clicking. The game function can simply look at the Eidolon object fields to see the mouse state and do what it likes.


class Eidolon
{

	/**
	* Constructs the Eidolon graphics and animation manager.
	* @param {string} canvasid - Id of the canvas element in the HTML.
	* @param {number} gamewidth - Width of the animated application, in pixels. If this doesn't match the canvas width, scaling will occur.
	* @param {number} gameheight - Height of the animated application, in pixels. If this doesn't match the canvas height, scaling will occur.
	*/
	constructor(canvasid, gamewidth, gameheight)
	{
		// initialize Eidolon object and return it
		// display h/w are taken from the canvas object on the HTML.
		// gamewidth and gameheight may be different, resulting in scaling
		let tcelement = document.getElementById(canvasid);
		if (!tcelement)
		{
			console.log("initEidolon error 1: Could not get canvas with given ID");
			return null;
		}
		tcelement.addEventListener("click", this);
		tcelement.addEventListener("keydown", this);
		tcelement.addEventListener("mousedown", this);
		tcelement.addEventListener("mouseup", this);
		tcelement.addEventListener("mousemove", this);
		// We have two contexts, On and Off, meaning Onscreen and Offscreen. Graphics are drawn to Offscreen and then Offscreen is copied to Onscreen.
		this.contextOn = tcelement.getContext("2d");
		this.canvaswidth = tcelement.width;
		this.canvasheight = tcelement.height;
		this.canvasOff = document.createElement("canvas");
		this.canvasOff.width = gamewidth;
		this.canvasOff.height = gameheight;
		if (!this.canvasOff.getContext)
		{
			console.log("initEidolon error 2: Could not create offscreen context");
			return null;
		}
		this.contextOff = this.canvasOff.getContext("2d");
		this.scalex = this.canvaswidth / gamewidth;
		this.scaley = this.canvasheight / gameheight;
		// single-pixel operation image data object
		this.imagedata = this.contextOff.createImageData(1, 1);
		// object to hold canvas objects for images
		this.imgcanvas = new Object();
		this.pixel = this.imagedata.data;
		this.mousex = 0;
		this.mousey = 0;
		this.mouseclicked = false;
		this.mousedown = false;
		this.images = new Object();
		//this.handleEvent = handleEvent;
	}

	/**
	* Kicks off the image-loading process.
	* @param {Array} pimages - An array of strings of image names.
	* @param {function} pendfunc - A function to be called once all images are finished loading.
	*/
	loadImages(pimages, pendfunc)
	{
		// pimages is an array of image names
		this.images = new Object();
		this.imagesloaded = pendfunc;
		for (let timgname of pimages)
		{
			let timg = new Object();
			timg.loaded = false;
			timg.image = new Image();
			timg.image.src = timgname;
			timg.image.addEventListener("load", this);
			this.images[timgname] = timg;
		}
	}

	/**
	* Tests if all images are loaded and thus we can move on.
	*/
	imageLoadTest()
	{
		let tstatus = true;
		for (let timg in this.images)
		{
			tstatus = tstatus && this.images[timg].loaded;
		}
		if (tstatus)
		{
			this.imagesloaded();
		}
	}

	/**
	* General event handler. Assigned as every event handler, decides what to do based on event type.
	* It wasn't designed to be called by users, not that I can stop you.
	* @param {Event} pevent - Passed event.
	*/
	handleEvent(pevent)
	{
		let mousepos = false;
		if (pevent.type === "click")
		{
			// mouse click; record info
			this.mouseclicked = true;
			mousepos = true;
		}
		else if (pevent.type === "keydown")
		{
			//this.mousedown = true;
			//mousepos = true;
			console.log("eHandleEvent keydown: " + pevent);
		}
		else if (pevent.type === "mousedown")
		{
			this.mousedown = true;
			mousepos = true;
		}
		else if (pevent.type === "mouseup")
		{
			this.mousedown = false;
			mousepos = true;
		}
		else if (pevent.type === "mousemove")
		{
			this.mousemoved = true;
			mousepos = true;
		}
		else if (pevent.type === "load")
		{
			// Image has been loaded
			for (let timg in this.images)
			{
				if (pevent.target == this.images[timg].image)
				{
					this.images[timg].loaded = true;
				}
			}
			this.imageLoadTest();
		}
		// Do we have to update mouse position?
		if (mousepos)
		{
			this.mousex = pevent.offsetX / this.scalex;
			this.mousey = pevent.offsetY / this.scaley;
		}
	}

	/**
	* Set up an image for pixel manipulation. Which means, give it a canvas object.
	* @param {string} pimage - An already-loaded image, a string index into the images Object.
	*/
	imageSetUpPixels(pimage)
	{
		if (!this.images[pimage] === undefined)
		{
			console.log("imageSetUpPixels: error, image not found! " + pimage);
			return;
		}
		// Canvas already set up? This really isn't bad but w/e
		if (this.imgcanvas[pimage])
		{
			console.log("imageSetUpPixels: Warning, tried to set up canvas but it was already set up: " + pimage);
			return;
		}
		// Now actually set it up
		let tcanvas = document.createElement("canvas");
		tcanvas.width = this.images[pimage].image.width;
		tcanvas.height = this.images[pimage].image.height;
		if (!tcanvas.getContext)
		{
			console.log("imageSetUpPixels error 2: Could not create canvas context: " + pimage);
			return null;
		}
		let tcontext = tcanvas.getContext("2d");
		tcontext.drawImage(this.images[pimage].image, 0, 0);
		this.images[pimage].imagedata = tcontext.getImageData(0, 0, tcanvas.width, tcanvas.height);
	}

	/**
	* Start the animation timer.
	* @param {function} pgamefunc - The user-provided function to be called every game tick
	* @param {number} pticktime - The time (msec) waited between ticks.
	*/
	startAnimation(pgamefunc, pticktime = 30)
	{
		// tick time is milliseconds
		this.ticktime = pticktime;
		this.gamefunc = pgamefunc;
		this.stopped = false;
	
		this.lasttime = Date.now();
		this.timeout = setTimeout(this.eTick, this.ticktime, this);
	}

	/**
	* Do something every frame. Call user-provided function, also do housekeeping.
	* This function interfaces with setTimeout and reworks the parameter so "this" gets the right value.
	* Not intended to be called by the user.
	* @param {Object} - The object of this class that is being used.
	*/
	eTick(eidolonobj)
	{
		eidolonobj.eTickFull()
	}

	/**
	* Do something every frame. Call user-provided function, also do housekeeping.
	*/
	eTickFull()
	{
		if (this.stopped)
		{
			// stopped, do nothing.
			return;
		}
		let ttime = this.lasttime;
		let ctime = Date.now();
		// in gamefunc, "this" should be this, I think
		// gamefunc is called with the number of msec since last call
		this.gamefunc(ctime - ttime);
		// Now, after gamefunc is called, we finalize the graphics
		this.finalizeGraphics();
		// And now some housekeeping on the Eidolon object
		this.lasttime = ctime;
		this.timeout = setTimeout(this.eTick, this.ticktime, this);
		this.mouseclicked = false;
		this.mousemoved = false;
	}

	/**
	* Stop animation timer.
	*/
	stopEidolon()
	{
		this.stopped = true;
	}
	
	/**
	* Finalize graphics each frame. In other words, switch the canvases to display the drawn-on one.
	*/
	finalizeGraphics()
	{
		this.contextOn.drawImage(this.canvasOff, 0, 0, this.canvasOff.width, this.canvasOff.height, 0, 0, this.canvaswidth, this.canvasheight);
	}
	
	// drawing functions
	// intended to be called every frame within the gamefunc
	/**
	* Fill the entire canvas with a color.
	* @param {string} pcolor - A color name.
	*/
	fillCanvas(pcolor)
	{
		this.contextOff.fillStyle = pcolor;
		this.contextOff.fillRect(0, 0, this.canvasOff.width, this.canvasOff.height);
	}

	/**
	* Draw a previously-loaded image at a given location.
	* @param {string} imgname - A string index into the Object of previously-loaded images.
	* @param {number} px - x position for the image to be drawn.
	* @param {number} py - y position for the image to be drawn.
	*/
	drawImage(imgname, px, py)
	{
		// draws the entire image at location px, py
		// imgname = filename, used as index into images
		let timage = this.images[imgname].image;
		this.contextOff.drawImage(timage, 0, 0, timage.width, timage.height, px, py, timage.width, timage.height);
	}

	/**
	* Draw a previously-loaded image at a given location. This function is more complete, allows more control over drawing parts of an image, perhaps getting from a "sprite sheet".
	* @param {string} imgname - A string index into the Object of previously-loaded images.
	* @param {number} px - x position for the image to be drawn in destination image.
	* @param {number} py - y position for the image to be drawn in destination image.
	* @param {number} spriteposx - x position to take image from in the source image.
	* @param {number} spriteposy - y position to take image from in the source image.
	* @param {number} spritew - width of sprite taken from the source image.
	* @param {number} spriteh - height of sprite taken from the source image.
	*/
	drawImageFull(imgname, px, py, spriteposx, spriteposy, spritew, spriteh, destwidth = 0, destheight = 0)
	{
		// imgname = filename, used as index into images
		// destwidth and destheight are the amount to copy to. 0 is interpreted as default, same width and height so no stretching.
		if (destwidth <= 0)
		{
			destwidth = spritew;
		}
		if (destheight <= 0)
		{
			destheight = spriteh;
		}
		let timage = this.images[imgname].image;
		this.contextOff.drawImage(timage, spriteposx, spriteposy, spritew, spriteh, px, py, destwidth, destheight);
	}

	/**
	* Draw a line on the canvas.
	* @param {number} sx - Line start, x.
	* @param {number} sy - Line start, y.
	* @param {number} tx - Line end, x.
	* @param {number} ty - Line end, y.
	*/
	drawLine(sx, sy, tx, ty)
	{
		// uses stroke style
		this.contextOff.lineWidth = 4;
		this.contextOff.beginPath();
		this.contextOff.moveTo(sx, sy);
		this.contextOff.lineTo(tx, ty);
		this.contextOff.stroke();
	}

	/**
	* Set a pixel to a given color.
	* @param {number} px - Pixel pos x.	
	* @param {number} py - Pixel pos y.	
	* @param {number} pr - Color red value.
	* @param {number} pg - Color green value.
	* @param {number} pb - Color blue value.
	* @param {number} pa - Color alpha value.
	*/
	setPixel(px, py, pr, pg, pb, pa = 255)
	{
		this.pixel[0] = pr;
		this.pixel[1] = pg;
		this.pixel[2] = pb;
		this.pixel[3] = pa;
		this.contextOff.putImageData(this.imagedata, px, py);
	}

	/**
	* Get the current color value of a pixel.
	* Image needs to have been set up with imageSetUpPixels.
	* @param {string} pimage - An already-loaded image, a string index into the images Object.
	* @param {number} px - Pixel pos x.	
	* @param {number} py - Pixel pos y.	
	*/
	getPixel(pimage, px, py)
	{
		let ta = new Array();
		let tnum = ((py * this.images[pimage].image.width) + px) * 4;
		for (let ti = 0; ti < 4; ++ti)
		{
			ta[ti] = this.images[pimage].imagedata[tnum + ti];
		}
		return ta;
	}
	/**
	* Get the canvas, if you really want to manipulate it yourself.
	* @returns HTMLElement - The created canvas element.
	*/
	get canvas()
	{
		return this.contextOff;
	}
	/**
	* Set fillstyle, which usually means the color of the text, or other elements.
	* @param {string} textcolor - A color; can be hex, or "red", etc..
	*/
	set fillstyle(textcolor)
	{
		this.contextOff.fillStyle = textcolor;
	}
	/**
	* Set the font for creating text.
	* @param {string} fontname - The font name.
	* @param {string} fontsize - The font size. Could be a number; it gets concatenated with "px".
	*/
	setFillFont(fontname, fontsize)
	{
		this.contextOff.font = fontsize + "px " + fontname;
	}

	/**
	* Create some text, specifying various parameters.
	* @param {string} fontname - The font name.
	* @param {string} fontsize - The font size. Could be a number; it gets concatenated with "px".
	* @param {string} textcolor - A text color; can be hex, or "red", etc..
	* @param {string} text - The text to display.
	* @param {number} textx - Text position x.
	* @param {number} texty - Text position y.
	*/
	fillText(fontname, fontsize, textcolor, text, textx, texty)
	{
		this.fillstyle = textcolor;
		this.setFillFont(fontname, fontsize);
		this.fillTextB(text, textx, texty);
	}

	/**
	* Create some text. This version simply uses the previously defined (or default) parameters.
	* @param {string} text - The text to display.
	* @param {number} textx - Text position x.
	* @param {number} texty - Text position y.
	*/
	fillTextB(text, textx, texty)
	{
		this.prevtext = text;
		this.prevtextx = textx;
		this.prevtexty = texty;
		this.contextOff.fillText(text, textx, texty);
	}

	/**
	* Set strokestyle, the color of outlines. Currently strokes are only used in Eidolon for drawing stroked text.
	* @param {string} textcolor - A color; can be hex, or "red", etc..
	*/
	set strokestyle(textcolor)
	{
		this.contextOff.strokeStyle = textcolor;
	}

	/**
	* Draw strokes (outlines) on previously filled (drawn solid) text.
	* @param {string} textcolor - A color; can be hex, or "red", etc..
	* @param {number} linewidth - Width of stroke.
	*/
	strokePrevText(textcolor, linewidth)
	{
		this.strokestyle = textcolor;
		this.contextOff.lineWidth = linewidth;
		this.contextOff.strokeText(this.prevtext, this.prevtextx, this.prevtexty);
	}

	/**
	* Measure text. Uses Javascript's measureText function to return an object containing information about how the text would look if it were to be drawn. (The text is not drawn.)
	* @param {string} text - The text to measure.
	* @returns {TextMetrics} - An object with various bits of information, look it up in the Javascript docs.
	*/
	measureText(text)
	{
		return this.contextOff.measureText(text);
	}

}
// end Eidolon class definition


