class TouchInterface {
    /**
     * Creates a new listner around the specified element
     * @param {String or HTML Object} element element to which to listen for touches
     * @param {Boolean} checkChildren allow checking children of the given element 
     * @param {Boolean} preventDefault disable the preventDefault 
     */
    constructor(element, checkChildren = true, preventDefault = true) {
        this.preventDefault = preventDefault;
        this.checkChildren = checkChildren;
        // check if the element is already an element or just a string
        // nodeType should be 1, which can be interpreted as true
        if(element.nodeType) 
            this.element = element;
        else if(element.indexOf("#") === 0){
            element = element.split("#").join("")
            if(typeof document.getElementById(element) !== "undefined" && document.getElementById(element) !== null && document.getElementById(element).nodeType)           
                this.element = document.getElementById(element) 
            else this.element = false;
        } else if(element.indexOf(".") === 0){
            element = element.split(".").join("")
            if(typeof document.getElementsByClassName(element)[0] !== "undefined" && document.getElementsByClassName(element)[0] !== null && document.getElementsByClassName(element)[0].nodeType)           
                this.element = document.getElementsByClassName(element)[0]
            else this.element = false;
        } else {
            if(typeof document.getElementsByTagName(element)[0] !== "undefined" && document.getElementsByTagName(element)[0] !== null && document.getElementsByTagName(element)[0].nodeType)           
                this.element = document.getElementsByTagName(element)[0]
            else this.element = false;
        }

        if(!this.element)
            return console.log("TouchInterface: Failed getting element, try inserting the element directly");       

        // active positions of all touches
        this.activeTouches = [];

        
        this._ontouch;
        this._onmove;
        this._onrelease;
        this._outofbounds;
    }

    /**
     * When the touch starts
     * @param {function} func
     */
    set ontouch(func){
        this._ontouch = func;
        this.element.addEventListener("touchstart", event => this.touchStart(event), false);
    } get ontouch(){return this._ontouch;}

    /**
     * When the touch moves
     * @param {function} func
     */
    set onmove(func){
        this._onmove = func;
        this.element.addEventListener("touchmove", event => this.touchMove(event), false);
    } get onmove(){return this._onmove;}

    /**
     * When the touch has ended
     * @param {function} func
     */
    set onrelease(func){
        this._onrelease = func;
        this.element.addEventListener("touchend", event => this.touchEnd(event), false);
    } get onrelease(){return this._onrelease;}

    /**
     * When the touch leaves the associated element
     * @param {function} func
     */
    set oncancel(func){
        this._outofbounds = func;
        this.element.addEventListener("touchcancel", event => this.touchCancel(event), false);
    } get oncancel(){return this._outofbounds;}

    touchStart(event) {
        if(!this.preventDefault)
            event.preventDefault();
        
        if(event.target != this.element && !this.checkChildren)
            return;

        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            // first touch, add to the array
            this.activeTouches.push(this.copyTouch(touches[i]));

            // execute the function
            this._ontouch(event);
        }
    }

    touchMove(event) {
        if(!this.preventDefault)
            event.preventDefault();
        
        if(event.target != this.element && !this.checkChildren)
            return;

        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            // get the array associated with the touch
            var idx = -1;
            for (var t = 0; t < this.activeTouches.length; t++)
                if (this.activeTouches[t].identifier == touches[i].identifier)
                    idx = t;


            if (idx >= 0) {
                // swap in the new touch record
                this.activeTouches.splice(idx, 1, this.copyTouch(touches[i]));  

                // execute the given function
                this._onmove(event);
            } else {
                console.log("lost track of touch with ID:" + touches[i].identifier);
            }
        }
    }

    touchEnd(event) {
        if(!this.preventDefault)
            event.preventDefault();
        
        if(event.target != this.element && !this.checkChildren)
            return;

        var touches = event.changedTouches;
      
        for (var i = 0; i < touches.length; i++) {
            // get the array associated with the touch
            var idx = -1;
            for (var t = 0; t < this.activeTouches.length; t++)
                if (this.activeTouches[t].identifier == touches[i].identifier)
                    idx = t;
        
            if (idx >= 0) {
                // remove the touch from the array
                this.activeTouches.splice(idx, 1);

                // execute the given function
                this._onrelease(event);
            } else {
                console.log("lost track of touch with ID:" + touches[i].identifier);
            }
        }
    }

    touchCancel(event) {
        if(!this.preventDefault)
            event.preventDefault();
        
        if(event.target != this.element && !this.checkChildren)
            return;

        var touches = event.changedTouches;
        
        for (var i = 0; i < touches.length; i++) {
            // get the array associated with the touch
            var idx = -1;
            for (var t = 0; t < this.activeTouches.length; t++)
                if (this.activeTouches[t].identifier == touches[i].identifier)
                    idx = t;

            // remove the touch from the array
            this.activeTouches.splice(idx, 1);

            // execute the given function
            this._outofbounds(event);
        }
    }

    copyTouch(touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
    }
}