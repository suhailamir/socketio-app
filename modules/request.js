module.exports = {
    // links to their according header codes
    error_code: {
        _403: "views/error/403.ejs",
        _404: "views/error/404.ejs"
    },
    parse:(url) => {
        // remove any "../"es
        while(url.indexOf("../") != -1)
            url.replace("../", "")

        let extension = '.ejs';

        if(
            url.substr(url.length - 4) == extension ||
            url.substr(url.length - 5) == "index"
        )
            return this.error_code._404;
        
        // whether the url is not the root
        if(url.length !== 1){
            if(url.slice(-1) != '/')    // whether the url ends with a "/"
                return "www/" + url.substring(1);
            else
                return "www/" + url.substring(1) + 'index' + extension;

        } else if(url == "/")  
            return "www/demo/" + url.substring(1) + 'index' + extension;
    },
    validate:(url) => {
        let extension = url.split('.').pop();
        if(extension == url || extension == 'ejs')     // this means we should serve an index
            return true;

        return false;
    }
}