
// This is the eidolontest.js file.
// It shows the basics of how to use the eidolon.js library.
// The code may be sloppy, but it's just meant to get the point across.

var eidolObj;
var gameObj;

function testEidolon()
{
	console.log("testEidolon called");
	// gameObj will, in theory, contain all the information about the "game state", like positions of objects.
	gameObj = new Object();
	gameObj.basev = 2;
	gameObj.framecount = 0;
	gameObj.frame = 0;
	// check is 70 x 70, random start position
	let tx = Math.floor(Math.random() * (640 - 70));
	let ty = Math.floor(Math.random() * (480 - 70));
	moveIcon(tx, ty);
	// HTML should have a canvas element with id id_canvas
	eidolObj = new Eidolon("id_canvas", 640, 480);
	eidolObj.loadImages(["check1.png", "abcd0.png"], testStart);
}

function moveIcon(px, py)
{
	// Utility function updating the check mark position.
	gameObj.x = px;
	gameObj.y = py;
	gameObj.vx = gameObj.basev;
	gameObj.vy = gameObj.basev;
	if (Math.random() > .5)
	{
		gameObj.vx *= -1;
	}
	if (Math.random() > .5)
	{
		gameObj.vy *= -1;
	}
}
function testStart()
{
	// This is a separate function because it's called as a callback after all the images are loaded.
	console.log("testStart called");
	// Specify a function to call every frame.
	eidolObj.startAnimation(testGameFunc);
}

function testGameFunc()
{
	// Update check mark's position. If you click, it will follow the cursor, otherwise it will bounce around.
	if (this.mousemoved && this.mousedown)
	{
		console.log("mouse moved");
		moveIcon(this.mousex, this.mousey);
	}
	else
	{
		gameObj.x += gameObj.vx;
		gameObj.y += gameObj.vy;
	}
	if (gameObj.x < 0)
	{
		gameObj.x = 0;
		gameObj.vx = gameObj.basev;
	}
	else if (gameObj.x >= 570) // 640 - 70
	{
		gameObj.x = 569;
		gameObj.vx = -1 * gameObj.basev;
	}
	if (gameObj.y < 0)
	{
		gameObj.y = 0;
		gameObj.vy = gameObj.basev;
	}
	else if (gameObj.y >= 410) // 480 - 70
	{
		gameObj.y = 409;
		gameObj.vy = -1 * gameObj.basev;
	}
	gameObj.framecount++;
	if (gameObj.framecount >= 16)
	{
		gameObj.framecount = 0;
		gameObj.frame++;
		if (gameObj.frame >= 4)
		{
			gameObj.frame = 0;
		}
	}

	// Gray background.
	eidolObj.fillCanvas("gray");

	// Find the text's height and width so we can center it.
	let textmetrics = eidolObj.measureText("Eidolon Test Program");
	let textwidth = textmetrics.actualBoundingBoxLeft + textmetrics.actualBoundingBoxRight;
	let textheight = textmetrics.actualBoundingBoxAscent - textmetrics.actualBoundingBoxDescent;

	// Draw text.
	eidolObj.fillText("Georgia", 48, "dodgerblue", "Eidolon Test Program", (640 - textwidth) / 2, (480 - textheight) / 2);
	eidolObj.strokePrevText("black", 2);

	// Draw an animated image using the abcd0.png "sprite sheet".
	eidolObj.drawImageFull("abcd0.png", 64, 64, gameObj.frame * 32, 0, 32, 32, 96, 64);
	// Draw the check mark bouncing around.
	eidolObj.drawImage("check1.png", gameObj.x, gameObj.y);
}

