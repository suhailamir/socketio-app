/**
 * A constructor for the page, enabling the addition of files to a page
 */
class PageConfig{
    constructor(){
        this.extra_css = [];
        this.extra_js = [];
    }
    
    addfile(url){
        let extension = url.split('.').pop();
        url = url.indexOf("/") == 0 ? url : "/" + url;  // make sure the url has a "/" at the beginning
        if(extension == "css")
            this.extra_css.push('<link rel="stylesheet" type="text/css" href="/demo/css' + url + '">')

        if(extension == "js")
            this.extra_js.push('<script src="/demo/js' + url + '" type="application/javascript"></script>')
    }
}

module.exports = PageConfig;