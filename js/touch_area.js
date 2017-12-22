// responsible for longpress events on mobile, because simple context menu doesn't work for some reason?
MS.TouchArea = function(x, y, width, height) { 
    var area = new PIXI.Container();
    area.interactive = true;
    area.hitArea = new PIXI.Rectangle(x, y, width, height);
    
    area.on("touchstart", this.onStart, this); 
    area.on("touchcancel", this.onEnd, this);
    area.on("touchend", this.onEnd, this);    
    area.on("touchendoutside", this.onEnd, this);
           
    this.area = area;  
   
    this.state = MS.TouchArea.StateEnum.DEFAULT;
    this.onLongPress = function(){};
}

MS.TouchArea.StateEnum = {
    DEFAULT: 0,
    PRESSED: 1    
};

MS.TouchArea.prototype.onStart = function(event) {
    if (this.state === MS.TouchArea.StateEnum.DEFAULT) {
        this.state = MS.TouchArea.StateEnum.PRESSED;
        this.timeout = setTimeout(this.onLongPress, 1000);
    }      
};

MS.TouchArea.prototype.onEnd = function(event) {
    if (this.state === MS.TouchArea.StateEnum.PRESSED) {
        this.state = MS.TouchArea.StateEnum.DEFAULT;
        clearTimeout(this.timeout);
    }      
};