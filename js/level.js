MS.Level = function(rows, cols, bombCount) {
    this.rows = rows;
    this.cols = cols;
    this.bombCount = bombCount;
    this.bombs = new MS.HashTable();
};

MS.Level.prototype.setSize = function(rows, cols) {
    this.rows = rows;
    this.cols = cols;
};

MS.Level.prototype.setBombCount = function(bombCount) {
    // cannot have more bombs than there is cells
    this.bombCount = Math.min(bombCount, this.rows * this.cols);
    return this.bombCount;
};

MS.Level.prototype.reset = function() {
    this.bombs = new MS.HashTable();
    // place bombs randomly
    var bombsToPlace = this.bombCount;
    while(bombsToPlace > 0) {
        var bomb = {row: MS.randomInt(this.rows), col: MS.randomInt(this.cols)};
        if (this.bombs.contains(bomb)) {
            continue;
        }
        this.bombs.put(bomb, 1);
        bombsToPlace--;
    }
};

MS.Level.prototype.moveBomb = function(from, to) {
    this.bombs.remove(from);
    this.bombs.put(to, 1);
};

MS.Level.prototype.export = function() {
    var dataStr = JSON.stringify(this);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    let exportFileDefaultName = 'level.json';
    
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

// adding methods to MS.Level was a mistake
MS.Level.prototype.import = function(levelData) {
    this.rows = levelData.rows;
    this.cols = levelData.cols;
    this.bombCount = levelData.bombCount;
    this.bombs = new MS.HashTable();
    for (k in levelData.bombs.table) {
        this.bombs.putRaw(k, 1);
    }
};