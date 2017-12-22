// keep global scope clean
var MS = {};

MS.CANVAS_SIZE = 256;
MS.CELL_SIZE = 16;
MS.FIELD_SIZE = 9;
MS.BOMB_COUNT = 10;

MS.preload = function() {
    MS.app = new PIXI.Application(MS.CANVAS_SIZE, MS.CANVAS_SIZE, {backgroundColor : 0xa0a0a0});    
    document.body.appendChild(MS.app.view);
    
    MS.root = new PIXI.Container();    
    MS.app.stage.addChild(MS.root);    
    
    // loading text
    var textStyle = new PIXI.TextStyle({fill:"#ffffff"});
    var loadingText = new PIXI.Text("Loading...", textStyle);    
    loadingText.x = (MS.CANVAS_SIZE - loadingText.width) / 2;
    loadingText.y = (MS.CANVAS_SIZE - loadingText.height) / 2;
    MS.root.addChild(loadingText);
                  
    // center canvas
    MS.resize();
    window.addEventListener('resize', function(){MS.resize();}, false);
        
    PIXI.loader
        .add("img/sprites.json")        
        .load(MS.setup);
};

MS.resize = function() {    
	var screenWidth = window.innerWidth;
	var screenHeight = window.innerHeight;	
			
	MS.app.view.style.left = (screenWidth - MS.CANVAS_SIZE) / 2 + 'px';
	MS.app.view.style.top = (screenHeight - MS.CANVAS_SIZE) / 2 + 'px';	
};

MS.setup = function() {
    MS.root.removeChildren();
    MS.board = new MS.Board(MS.CELL_SIZE, PIXI.loader.resources["img/sprites.json"].textures);
    MS.root.addChild(MS.board.container);
    MS.level = new MS.Level(MS.FIELD_SIZE, MS.FIELD_SIZE, MS.BOMB_COUNT);
    
    // prevent context menu from showing up
    // toggle flagged status instead    
    MS.app.view.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        MS.board.handleContextMenu(event);
    });
    
    MS.newGame();
    
    // menu hooks
    // field size
    var select = document.querySelector("#fieldSizeSelect");
    for (var i = 6; i < 12; i++) {
        if (i == MS.FIELD_SIZE) {
            select.options.add(new Option(i + "x" + i, i, true, true));
        }
        else {
            select.options.add(new Option(i + "x" + i, i));
        }
    }
    
    select.addEventListener("change", function(){
        var size = select.options[select.selectedIndex].value;
        MS.level.setSize(size, size);
        MS.newGame();
    });

    // bomb count
    var bombCountInput = document.querySelector("#bombCountInput");
    bombCountInput.value = MS.level.bombCount;
    var bombCountFeedback = document.querySelector("#bombCountFeedback");
    document.querySelector("#bombCountButton").addEventListener("click", function(){
        var bombCount = parseInt(bombCountInput.value);
        if (isNaN(bombCount)) {
            bombCount = MS.BOMB_COUNT;
        }
        bombCount = Math.max(1, bombCount);
        
        var finalBombCount = MS.level.setBombCount(bombCount);
        if (finalBombCount == 1) {
            bombCountFeedback.innerHTML = finalBombCount + " bomb set!";
        }
        else {
            bombCountFeedback.innerHTML = finalBombCount + " bombs set!";
        }
        
        MS.newGame();
    });
        
    // tweak & export
    document.querySelector("#tweakBombsButton").addEventListener("click", function(){
        MS.board.enableTweakMode();
    });
    document.querySelector("#exportLevelButton").addEventListener("click", function(){
        MS.level.export();
    });
    
    // import 
    var importLevelFeedback = document.querySelector("#importLevelFeedback");
    document.querySelector("#importLevel").addEventListener("change", function(event){
        var files = event.target.files;
        
        for (var i = 0, f; f = files[i]; i++) {
            // make sure it's json
            if (!f.type.match("application/json")) {
                continue;
            }
        
            var reader = new FileReader();
            reader.onload = function(loadedEvent){
                try {
                    MS.level.import(JSON.parse(loadedEvent.target.result));
                    MS.board.loadLevel(MS.level);   
                    MS.root.removeChildren();
                    MS.root.addChild(MS.board.container);
                    MS.board.center(MS.CANVAS_SIZE, MS.CANVAS_SIZE);
                    bombCountInput.value = MS.level.bombCount;
                    importLevelFeedback.innerHTML = "Level imported!";
                }
                catch(e) {
                    alert("Failed to load level!");
                    console.log(e);
                }
            };

            reader.readAsText(f);
        }
    });
    
    // show menu once the game is loaded
    document.querySelector("#menu").style.display = "block";
};

MS.newGame = function() {
    // every new game bomb positions are reset
    MS.level.reset();
    MS.board.loadLevel(MS.level);   
    MS.board.center(MS.CANVAS_SIZE, MS.CANVAS_SIZE);
};

MS.randomInt = function(number) {
    return Math.floor(Math.random() * number);
};

document.addEventListener('DOMContentLoaded', function(){
    MS.preload();
}, false);