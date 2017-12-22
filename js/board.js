MS.Board = function(cellSize, textures) {         
    this.cellSize = cellSize;
    this.textures = textures;    
    
    this.cellDefaultTexture = textures["cell_default.png"];
    this.cellEmptyTexture = textures["cell_empty.png"];
    this.bombNumbers = ["cell_empty.png"];
    for (var i = 1; i < 9; i++) {
        this.bombNumbers.push("cell_" + i + ".png");
    }
    this.cells = new MS.HashTable();        
    this.container = new PIXI.Container();
    
    // we need to track user interactions on board to update smiley accordingly
    this.buttonContainer = new PIXI.Container();
    this.buttonContainer.interactive = true;
    this.buttonContainer.on("pointerdown", this.onDown, this); 
    this.buttonContainer.on("pointerup", this.onUp, this);
    this.buttonContainer.on("pointercancel", this.onUp, this);
    this.buttonContainer.on("pointerupoutside", this.onUp, this);
    this.container.addChild(this.buttonContainer);
    
    var button = new MS.Button(0, 0, textures["smiley_default.png"], textures["smiley_pressed.png"]);
    button.onClick = function() {
        MS.newGame();
    };    
    this.buttonSprite = button.sprite;
    this.container.addChild(this.buttonSprite);
    
    this.tweakMode = false;
}
// used for neighbours lookup
MS.Board.DIFFS = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]];

MS.Board.prototype.loadLevel = function(level) {
    this.level = level;
    this.buttonContainer.removeChildren();
   
    var rows = level.rows;
    var cols = level.cols;
    
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            this.addCell(row, col, false);
        }
    }
    
    this.bombCount = 0;
    for (var key in level.bombs.getTable()) {        
        this.cells.getRaw(key).hasBomb = true;
        this.bombCount++;
    }
    this.difusedBombCount = 0;
    this.flagCount = 0;
    
    this.rows = rows;
    this.cols = cols;
    
    // position smiley in the upper center of the board
    this.buttonSprite.position.set(
        (this.cellSize * this.cols - this.buttonSprite.width) / 2
        , -this.buttonSprite.height);
    this.buttonSprite.texture = this.textures["smiley_default.png"];
    
    this.tweakMode = false;
    this.selectedCell = null;
};

MS.Board.prototype.addCell = function(row, col, hasBomb) {
    var cell = new MS.Cell(row
    , col
    , col * this.cellSize
    , row * this.cellSize
    , this.cellDefaultTexture
    , this.cellEmptyTexture
    , this);
    this.cells.put({row: row, col: col}, cell);
    this.buttonContainer.addChild(cell.sprite);
};

MS.Board.prototype.getNeighbours = function(cell) {
    var result = [];
    var row = cell.row;
    var col = cell.col;
    for (var i = 0; i < MS.Board.DIFFS.length; i++) {
        var cellPosition = {row: row + MS.Board.DIFFS[i][1], col: col + MS.Board.DIFFS[i][0]};
        // chech for out of bounds neighbours (e.g. negative row)
        if (this.cells.contains(cellPosition)) {
            result.push(this.cells.get(cellPosition));
        }
    }
    return result;
};

MS.Board.prototype.canFlag = function() {    
    return this.flagCount < this.bombCount;
};

MS.Board.prototype.modifyFlags = function(diff, hasBomb) { 
    this.flagCount += diff;
    if (hasBomb) {
        this.difusedBombCount += diff;
    }
    // did the user guess all the bombs? it's a win!
    if (this.difusedBombCount === this.bombCount) {
        this.finishGame(true);
    }
};

MS.Board.prototype.finishGame = function(hasWon) {        
    this.buttonSprite.texture = hasWon ? this.textures["smiley_won.png"] : this.textures["smiley_lost.png"];
    
    for (var key in this.cells.getTable()) {        
        this.cells.getRaw(key).reveal(false);            
    }
};

// assign an appropriate sprite for the cell depending on its state
MS.Board.prototype.updateCell = function(cell) {    
    var textureName;
    switch(cell.state) {
        case MS.Cell.StateEnum.DEFAULT:
            textureName = "cell_default.png"
            break;
        case MS.Cell.StateEnum.FLAGGED:
            textureName = "cell_flagged.png"
            break;        
        case MS.Cell.StateEnum.REVEALED:
            textureName = this.bombNumbers[cell.bombsNearby];            
            break;
        case MS.Cell.StateEnum.DEFUSED:
            textureName = "cell_bomb_defused.png"
            break;
        case MS.Cell.StateEnum.EXPLODED:
            textureName = "cell_bomb_exploded.png"
            break;
        case MS.Cell.StateEnum.MISSED:
            textureName = "cell_bomb.png"
            break;
    }    
    
    cell.sprite.texture = this.textures[textureName];        
};

// center itself in the parent
MS.Board.prototype.center = function(parentWidth, parentHeight) {    
    this.container.x = (parentWidth - this.cellSize * this.cols) / 2;
    this.container.y = (parentHeight - this.cellSize * this.rows) / 2;
};

// toggle flagged state where context menu was supposed to be shown
MS.Board.prototype.handleContextMenu = function(event) {
    this.handleCellEvent(event, function(cell){
        cell.toggleFlag();
    });     
};

// translates event coordinates into row and cell numbers, then calls cellProcessor
// on the appropriate cell
MS.Board.prototype.handleCellEvent = function(event, cellProcessor) {
    var x = event.x - MS.app.view.offsetLeft;
    var y = event.y - MS.app.view.offsetTop;
    var position = this.container.toGlobal(new PIXI.Point(0, 0));    
    
    var row = Math.floor((y - position.y) / this.cellSize);
    var col = Math.floor((x - position.x) / this.cellSize);
    
    var cellPosition = {row: row, col: col};
    
    if (this.cells.contains(cellPosition)) {
        cellProcessor.call(this, this.cells.get(cellPosition));
    }
};

MS.Board.prototype.onDown = function(event) {
    // skip right clicks
    if (event.data.button === 2) {
        return;
    }
    
    if (this.tweakMode) {
        this.handleCellEvent(event.data.originalEvent, function(cell){
            // if cell contains a bomb, select it
            if (cell.hasBomb) {
                this.selectCell(cell);
            }
            // otherwise move the bomb here (provided user selected a bomb previously)
            else if (this.selectedCell != null) {
                this.moveBomb(cell);
            }
        });
    }
    else {
        // in case user just won/lost the game, we do not want to change smiley's sprite
        if (this.buttonSprite.texture === this.textures["smiley_default.png"]) {
            this.buttonSprite.texture = this.textures["smiley_almost_there.png"];
        }
    }
};

MS.Board.prototype.onUp = function(event) {
    // skip right clicks
    if (event.data.button === 2) {
        return;
    }
    
    if (this.tweakMode === false) {
        // in case user just won/lost the game, we do not want to change smiley's sprite
        if (this.buttonSprite.texture === this.textures["smiley_almost_there.png"]) {
            this.buttonSprite.texture = this.textures["smiley_default.png"];
        }
    }
};

MS.Board.prototype.enableTweakMode = function() {
    for (var key in this.cells.getTable()) {        
        this.cells.getRaw(key).reveal(false);            
    }
    this.tweakMode = true;
    this.selectedCell = null;
    this.buttonSprite.texture = this.textures["smiley_default.png"];
};

MS.Board.prototype.selectCell = function(cell) {
    if (this.selectedCell != null) {
        // unselect already selected cell
        this.selectedCell.sprite.tint = 0xffffff;
        if (cell.row === this.selectedCell.row && cell.col === this.selectedCell.col) {
            this.selectedCell = null;
            return;
        }
    }
    this.selectedCell = cell;
    this.selectedCell.sprite.tint = 0x00ff00;
};

MS.Board.prototype.moveBomb = function(cell) {
    cell.hasBomb = true;
    // update level's bomb data
    var from = {row: this.selectedCell.row, col: this.selectedCell.col};
    var to = {row: cell.row, col: cell.col};
    this.level.moveBomb(from, to);
    // update board's appearance
    this.selectedCell.sprite.tint = 0xffffff;
    this.selectedCell.hasBomb = false;
    this.selectedCell = null;
    
    for (var key in this.cells.getTable()) {
        var c = this.cells.getRaw(key);
        c.state = MS.Cell.StateEnum.DEFAULT;
        c.reveal(false);            
    }
};