MS.Bot = function() {
    // we don't really keep any state
};

MS.Bot.prototype.step = function(board) {
    if (board.state != MS.Board.StateEnum.DEFAULT) {
        return;
    }
    
    var numberedCells = [];
    var defaultCells = [];
    for (var key in board.cells.getTable()) {  
        var cell = board.cells.getRaw(key);
        if (cell.state === MS.Cell.StateEnum.REVEALED) {
            numberedCells.push(cell);
        }    
        else if (cell.state === MS.Cell.StateEnum.DEFAULT) {
            defaultCells.push(cell);
        }
    }
    
    // beginning of the game, choose randomly along the upper edge
    if (numberedCells.length === 0) {
        var row = 0;
        var col = MS.randomInt(board.cols);
        board.cells.get({row: 0, col: col}).reveal(true);
        return;
    }
    
    // try to find guaranteed mines/empty cells
    var decisionMade = false;
    for (var i = 0; i < numberedCells.length; i++) {
        if (this.processCell(numberedCells[i], board)) {
            decisionMade = true;
            break;
        }
    }
    
    if (decisionMade) {
        return;
    }
    
    // choose among remaining cells
    var minBombsNearby = 100;
    var cellIndex = 0;
    var sortOfSafeCells = [];
    
    for (var i = 0; i < defaultCells.length; i++) {
        var cell = defaultCells[i];
        
        var neighbours = board.getNeighbours(cell);
        var bombsNearby = 0;
        for (var j = 0; j < neighbours.length; j++) {
            var neighbour = neighbours[j];
            if (neighbour.state === MS.Cell.StateEnum.REVEALED) {
                bombsNearby += neighbour.bombsNearby;
            }
        }
        
        if (bombsNearby === 0) {
            sortOfSafeCells.push(cell);
        } 
        else if (bombsNearby < minBombsNearby) {
            minBombsNearby = bombsNearby;
            cellIndex = i;
        }
    }
   
    // we have cell unadjacent to any number cells, pick one of those
    if (sortOfSafeCells.length > 0) {
        sortOfSafeCells[MS.randomInt(sortOfSafeCells.length)].reveal(true);
    }
    // simply pick the one with the least chance to be a bomb
    else {
        defaultCells[cellIndex].reveal(true);
    }
};

MS.Bot.prototype.solve = function(board) {
    while (board.state === MS.Board.StateEnum.DEFAULT) {
        this.step(board);
    }
};

MS.Bot.prototype.processCell = function(cell, board) {
    var bombsNearby = cell.bombsNearby;
    var defaultCells = [];
    var neighbours = board.getNeighbours(cell);
    
    var defaultCells = [];
    var flaggedCells = 0;
    for (var i = 0; i < neighbours.length; i++) {
        var neighbour = neighbours[i];
        if (neighbour.state === MS.Cell.StateEnum.DEFAULT) {
            defaultCells.push(neighbour);
        }
        else if (neighbour.state === MS.Cell.StateEnum.FLAGGED) {
            flaggedCells++;
        }
    }
    
    // basic pattern - found a bomb
    if (defaultCells.length > 0 && (bombsNearby - flaggedCells) >= defaultCells.length) {
        defaultCells[0].toggleFlag();
        return true;
    }
    
    // basic pattern - guaranteed empty cell
    if (defaultCells.length > 0 && flaggedCells >= bombsNearby) {
        defaultCells[0].reveal(true);
        return true;
    }
    
    return false;
}