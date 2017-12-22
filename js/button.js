// responsible for clicky events and default/pressed sprites both on desktop and mobile
MS.Button = function(x, y, defaultTexture, pressedTexture) {  
    this.defaultTexture = defaultTexture;
    this.pressedTexture = pressedTexture;
    
    var sprite = new PIXI.Sprite(defaultTexture);
    sprite.x = x;
    sprite.y = y;
    sprite.interactive = true;
    
    sprite.on("pointerdown", this.onDown, this); 
    sprite.on("pointerover", this.onOver, this); 
    sprite.on("pointerout", this.onOut, this);
    sprite.on("pointerup", this.onUp, this);
    sprite.on("pointercancel", this.onOut, this);
    sprite.on("pointerupoutside", this.onOut, this);
           
    this.sprite = sprite;    
   
    this.state = MS.Button.StateEnum.DEFAULT;
    this.onClick = function(){};
}

MS.Button.StateEnum = {
    DEFAULT: 0,
    PRESSED: 1    
};

MS.Button.prototype.setInteractive = function(isInteractive) {
    this.state = MS.Button.StateEnum.DEFAULT;
    this.sprite.interactive = isInteractive;    
}

MS.Button.prototype.onDown = function(event) {
    // skip right clicks
    if (event.data.button === 2) {
        return;
    }     
    
    if (this.state === MS.Button.StateEnum.DEFAULT) {
        this.state = MS.Button.StateEnum.PRESSED;
        this.sprite.texture = this.pressedTexture;
    }      
};

MS.Button.prototype.onOver = function(event) {
    // skip when left button isn't pressed
    // doesn't work in Safari (no "buttons" property)
    if (event.data.pointerId === "MOUSE" && event.data.buttons != 1) {
        return;
    }    
    
    if (this.state === MS.Button.StateEnum.DEFAULT) {
        this.state = MS.Button.StateEnum.PRESSED;
        this.sprite.texture = this.pressedTexture;
    }    
};

MS.Button.prototype.onOut = function(event) {     
    if (this.state === MS.Button.StateEnum.PRESSED) {
        this.state = MS.Button.StateEnum.DEFAULT;
        this.sprite.texture = this.defaultTexture;
    }      
};

MS.Button.prototype.onUp = function(event) { 
    // skip right clicks
    if (event.data.button === 2) {
        return;
    }
    
    if (this.state === MS.Button.StateEnum.PRESSED) {
        this.state = MS.Button.StateEnum.DEFAULT;
        this.sprite.texture = this.defaultTexture;
        this.onClick();
    }      
};