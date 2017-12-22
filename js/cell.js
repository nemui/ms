MS.Cell = function(row, col, x, y, defaultTexture, emptyTexture, board) {
    this.row = row;
    this.col = col;
    
    // button is responsible for toggling default/pressed sprites and invoking click events
    var button = new MS.Button(x, y, defaultTexture, emptyTexture);
    button.onClick = this.reveal.bind(this, true);
    this.button = button;
    this.sprite = button.sprite;
    
    // touch area is responsible for invoking longpress events on mobile
    var touchArea = new MS.TouchArea(0, 0, this.sprite.width, this.sprite.height);
    touchArea.onLongPress = this.toggleFlag.bind(this);
    this.sprite.addChild(touchArea.area);
    
    this.state = MS.Cell.StateEnum.DEFAULT;    
    this.board = board;
    this.hasBomb = false;    
};

MS.Cell.StateEnum = {
    DEFAULT: 0, // initial
    FLAGGED: 1, // flagged by user
    REVEALED: 2,// revealed either by user or board (win/lose/tweaking bomb position)
    DEFUSED: 3, // successfully discovered bombs
    EXPLODED: 4,// less successfully discovered bombs
    MISSED: 5   // undiscovered bombs
};

MS.Cell.prototype.reveal = function(userInitiated) {
    if (this.hasBomb) {
        // reveal can be triggered by user or by the board
        if (userInitiated) {            
            this.board.finishGame(false);
            this.state = MS.Cell.StateEnum.EXPLODED;
        }
        else {
            if (this.state === MS.Cell.StateEnum.FLAGGED) {
                this.state = MS.Cell.StateEnum.DEFUSED;
            }
            else {
                this.state = MS.Cell.StateEnum.MISSED;
            }
        }
    }
    else {
        this.state = MS.Cell.StateEnum.REVEALED;
        
        // find neighbours with bombs
        var neighbours = this.board.getNeighbours(this);
        var bombsNearby = 0;
        for (var i = 0; i < neighbours.length; i++) {
            if (neighbours[i].hasBomb) {
                bombsNearby++;
            }
        }
        // recursively reveal neighbours
        if (bombsNearby == 0) {
            for (var i = 0; i < neighbours.length; i++) {
                // skip already revelaed cells and flagged cells when the reveal is initiated by user
                if (neighbours[i].state === MS.Cell.StateEnum.REVEALED
                    || (neighbours[i].state === MS.Cell.StateEnum.FLAGGED && userInitiated)) {
                    continue;
                }
                neighbours[i].reveal(true);
            }
        }        
        // remember the number of bombs so that the board can set an appropriate sprite
        this.bombsNearby = bombsNearby;
    }
    // ignore button interactions after cell is revealed
    this.button.setInteractive(false);
    // request a new sprite
    this.board.updateCell(this);
};

MS.Cell.prototype.toggleFlag = function() {
    if (this.state === MS.Cell.StateEnum.DEFAULT) {  
        // can we put more flags?
        if (!this.board.canFlag()) {
            return;
        }
        this.state = MS.Cell.StateEnum.FLAGGED;
        // increase flag count by 1
        this.board.modifyFlags(1, this.hasBomb);
        this.board.updateCell(this);        
        this.button.setInteractive(false);
    }
    else if (this.state === MS.Cell.StateEnum.FLAGGED) {
        this.state = MS.Cell.StateEnum.DEFAULT;
        // decrease flag count by 1
        this.board.modifyFlags(-1, this.hasBomb);
        this.board.updateCell(this);        
        this.button.setInteractive(true);
    }
};