const page = {
    content: document.getElementById("content"),
    scrollable: document.getElementById('scrollable'),
    footer: document.getElementsByTagName("footer")[0],

    has_scrollable: false,
    has_commonselect: false,
}
// check that if we move the footer up, we don't collide with the content
if(page.content.offsetHeight - page.footer.offsetHeight == window.innerHeight - 124)
    page.content.style.marginBottom = "-124px"

if(page.content.offsetHeight - page.footer.offsetHeight == window.innerHeight - 182)
    page.content.style.marginBottom = "-182px";


if(typeof page.scrollable !== "undefined" && page.scrollable !== null && page.scrollable.nodeType === 1)
    page.has_scrollable = true;
if(document.getElementsByClassName('common-select').length !== 0)
    page.has_commonselect = true;


if(page.has_scrollable){
    window.addEventListener('scroll', () => {
        // make the scollable item move slower than the scroll
        page.scrollable.style.top = (window.pageYOffset / 1.5) + "px";
    });
} else {
    document.getElementById('navBar').classList.add("navBarBackground");
    document.getElementsByTagName("main")[0].classList.add("adjust-main"); // if no background is given, the main must be pushed down a little
}

if(page.has_scrollable || page.has_commonselect){
    window.addEventListener('click', function(event){   
        if(page.has_scrollable)
            if (!document.getElementsByClassName('common-container')[0].contains(event.target))
                document.getElementById('popupToggle').checked = false;

        if(page.has_commonselect)
            close_all_selectElements(event);
    });
}


    
// mobile support
contentTouch = new TouchInterface('#content');
contentTouch.ontouch = function(event){   
    if(page.has_scrollable)
        if(document.getElementById('popupToggle').checked)
            document.getElementById('popupToggle').checked = false;
    
    if(page.has_commonselect)
        close_all_selectElements(event);

};

if(page.has_scrollable)
    contentTouch.onmove = function(){  
        // make the scollable item move slower than the scroll
        page.scrollable.style.top = (window.pageYOffset / 1.5) + "px";
    };


function close_all_selectElements(event = null){
    // check whether the parent of the parent node has two classes,
    // if not, we did not click on a select, thus we should close the open ones
    if(page.has_commonselect){
        if(event == null || !event.target.parentNode.parentNode.classList.contains("open")){
            for(var s = 0; s < document.getElementsByClassName('common-select').length; s++)
                if(document.getElementsByClassName('common-select')[s].classList.contains("open")){
                    let div = document.getElementsByClassName('common-select')[s];
                    div.classList.remove("open")
                    div.children[1].removeAttribute("style")
                    for(let i = 0; i < div.children[1].children.length; i++)
                        if(typeof div.children[1].children[i].attributes[1] !== "undefined")
                            div.children[1].children[i].removeAttribute(div.children[1].children[i].attributes[1].name);
                }
        }
    }
}