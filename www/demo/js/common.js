(() => {
    for (let e = 0; e < document.getElementsByClassName('common-select').length; e++){
        let div = document.getElementsByClassName('common-select')[e];

        // if an default selected is passed through, we should make it the selected one
        let selectedID = 0;
        let has_selectedID = false;
        for (let i=0, l=div.classList.length; i<l; ++i) {
            if(/selected-.*/g.test(div.classList[i])) {
                // if the selected attribute gives a higher number than present children, select the last one
                selectedID = parseInt(div.classList[i].replace(/selected-/g,'')) <= div.children[1].children.length - 1 ? parseInt(div.classList[i].replace(/selected-/g,'')) : div.children[1].children.length - 1;
                has_selectedID = true
                break;
            }
        }

        if(!has_selectedID)
            div.classList.add("selected-0");

        // add the selected attribute to the given selected item, and remove it from the rest
        for(let c = 0; c < div.children[1].children.length; c++){
            if(c == selectedID){
                div.children[1].children[c].classList.add("selected")
                div.children[2].style.top = 31 * c + "px";
            } else 
                div.children[1].children[c].classList.remove("selected")
        }

        // give the div an event listener for its children
        div.children[1].addEventListener("click", (event) => {
            if (event.target && event.target.matches("li")) {
                close_all_selectElements(event);

                let div = event.target.parentElement.parentElement;
                let ul = div.children[1];
                let selector = div.children[2]; 
                div.children[0].children[0].value = "";

                if(ul.style.transform == ""){
                    let c = 0;
                    for(c; c < ul.children.length; c++)
                        if(ul.children[c] == event.target)
                            break;
                                         
                    // change the position of the span, even not visible, to fix a resize incorrect selector position
                    if(getComputedStyle(selector).display == "none"){                             
                        // if there are more items than the height of the list allows
                        if(31 * ul.children.length > getComputedStyle(ul).maxHeight.replace(/px/,'')){
                            // add a searchbar
                            div.children[0].children[0].onkeydown = function(event){
                                var valid = 
                                    (event.keyCode > 47 && event.keyCode < 58)   || // number keys
                                    (event.keyCode > 64 && event.keyCode < 91)   || // letter keys
                                    (event.keyCode > 95 && event.keyCode < 112)  || // numpad keys
                                    (event.keyCode > 185 && event.keyCode < 193) || // ;=,-./` (in order)
                                    (event.keyCode > 218 && event.keyCode < 223);   // [\]' (in order)
                                if(valid){
                                    // remove if exist the "not-found" class
                                    div.children[0].children[0].removeAttribute("class")
                                    for(let s = 0; s < ul.children.length; s++){
                                        ul.children[s].removeAttribute("style") // relieve all children of their style
                                        if(ul.children[s].innerHTML.toLowerCase().startsWith((this.value + event.key).toLowerCase()) && this.value + event.key !== ""){
                                            ul.children[s].style.background = "#e5e8f0";
                                            ul.scrollTop = s * 34 - (getComputedStyle(ul).height.replace(/px/,'') / 2);
                                            break;
                                        }  
                                        // if the loop did end and not got a hit, add a not found class to the searchbar
                                        if(s == ul.children.length - 1)
                                            div.children[0].children[0].classList.add("not-found");
                                    }
                                }

                                // if we hit enter we should apply the change and clean up
                                if(event.keyCode == 13){
                                    div.children[0].children[0].value = "";
                                    close_all_selectElements();
                                    if(!div.children[0].children[0].classList.contains("not-found"))
                                        for(let s = 0; s < ul.children.length; s++){
                                            if(ul.children[s].style.background !== ""){
                                                ul.children[s].classList.add("selected")
                                                ul.children[s].removeAttribute("style")
                                                // update the selected ID indicator
                                                div.classList.replace("selected-" + selectedID, "selected-" + s);
                                                selectedID = s;
                                            } else {
                                                ul.children[s].removeAttribute("class")
                                            }
                                        }
                                }                         
                            }

                            // position the actual list 1 item below the fake selected item
                            ul.style.top = "34px";
                            ul.style.transform = "translateY(0)";
                        } else {
                            // the + 0.5 * selectedID is to fix a positioning error
                            div.children[0].style.display = "none";
                            ul.style.transform = "translateY(calc(-" + 100 * ((c + 1) / ul.children.length - 1 / ul.children.length) + "% - " + 0.5 * c + "px))";
                        }

                        div.classList.add("open");
                        div.children[0].children[0].focus();
                        ul.scrollTop = c * 34 - (getComputedStyle(ul).height.replace(/px/,'') / 2);  
                    } else {
                        selector.style.top = 31 * c + "px";
                        // since if the select in list form does not have a popup, apply the change immediately
                        for(let o = 0; o < ul.children.length; o++)
                            ul.children[o].removeAttribute("class");

                        ul.children[c].classList.add("selected");

                        // update the selected ID indicator
                        div.classList.replace("selected-" + selectedID, "selected-" + c);
                        selectedID = c;

                        div.children[0].style.display = "none";
                    }
                } else if(ul.style.transform !== ""){
                    for(let c = 0; c < ul.children.length; c++){
                        ul.children[c].removeAttribute("class");
                        ul.children[c].removeAttribute("style")
                        
                        // 31 is the height of a list element
                        if(ul.children[c] == event.target){
                            selector.style.top = 31 * c + "px";

                            // update the selected ID indicator
                            div.classList.replace("selected-" + selectedID, "selected-" + c);
                            selectedID = c;
                        } else   
                            while(ul.children[c].attributes.length > 0)
                                ul.children[c].removeAttribute(ul.children[c].attributes[0].name)
                    }
                    
                    event.target.className = "selected";
                    ul.removeAttribute("style");
                    div.children[0].removeAttribute("style");
                    if(getComputedStyle(selector).display == "none"){
                        div.classList.remove("open");
                    }
                }
            }
        });
    }

    // every list item should execute its link on click
    for (let e = 0; e < document.getElementsByClassName('common-list').length; e++){
        let ul = document.getElementsByClassName('common-list')[e];

        ul.addEventListener("click", (event) => {
            if (event.target && event.target.matches("li") 
                && typeof event.target.children[0].href !== "undefined" 
                && event.target.children[0].href !== "")
                    window.location.href = event.target.children[0].href;
        });
    };
})();