class CommonItems{
    /** creates a switch
     *  @param {String} id Selector, only occuring once on the page
     *  @param {Boolean} checked Sets the state of the switch
     */
    switch(id, checked = false){
        let html = `
        <label class="common-switch">
            <input id="${id}" type="checkbox"${checked ? " checked" : ""}>
            <span></span>
        </label>
        `;

        return html;
    }

    /** creates an input field
     *  @param {String} id Selector, only occuring once on the page
     *  @param {String} placeholder Text which appears in the input 
     *  @param {String} attributes Attributes of the input, like type="text" (default), type="password" or autofocus
     *  @param {String} classes Extra styling options, seperated by a space. Allows custom classes. Preset: stripe, shadow
     */
    input(id, placeholder = "", attributes = "", classes = ""){
        if(attributes == "") attributes = "type='text'";
        
        let html =  `
        <label class="common-input ${classes}">
            <input id="${id}" ${attributes} ${placeholder == "" ? "" : "placeholder='" + placeholder + "'"}>
            <span></span>
        </label>
        `;

        return html;
    }

    /** creates an select
     *  @param {String} id Selector, only occuring once on the page
     *  @param {Array} items Array with specified items
     *  @param {String} classes Extra styling options, seperated by a space. Allows custom classes. Presets: list-only, bar-only
     */
    select(id, items, classes = ""){
        let select_items = "";
        for(let i = 0; i < items.length; i++)
            select_items += `<li>${items[i]}</li>`;

        let html = `
        <div id="${id}" class="common-select ${classes}">
            <span class="selected">
                <input placeholder="search"></input>
            </span>
            <ul>
                ${select_items}
            </ul>
            <span class="selector"></span>
        </div>
        `;

        return html;
    }

    /** creates a button
     *  @param {String} id Selector, only occuring once on the page
     *  @param {String} attributes Attributes of the button, like type="submit", disabled or autofocus
     *  @param {Object} button Object with key as text. Link and target (optional) as value, seperated by "::".
     *  @param {String} classes Extra styling options, seperated by a space. Allows custom classes. No presets available
     */
    button(id, button, attributes = "", classes = ""){
        if(Object.keys(button).length !== 1){
            console.warn("Multiple button were given. If this was meant to be, please use 'common.buttons', not 'common.button'");
            return "<br><br><div style='color:red'>Incorrect function call</div>"
        }

        let text = Object.keys(button)[0];                                     // get the key
        let value = button[Object.keys(button)[0]];                            // get the value

        if(value.indexOf('::') != -1){                                                                      // check whether the "::" are present
            var url = value.substring(0, value.indexOf('::')).replace(/\s+/g, ''),                          // url : read untill "::" and remove spaces 
            target = "target='" + value.slice(value.indexOf("::") + 2).replace(/\s+/g, '') + "'";           // target : read after "::" and remove spaces
        } else
            var url = value, target = "";                                   

        var html = `<a id="${id}" ${attributes} href="${url}" '${target}' class="common-button primary">${text}</a>`;

        return html;
    }

    /** creates a group of buttons, of which the first one will be primary
     *  @param {String} id Selector, only occuring once on the page
     *  @param {Object} buttons Object with key as text. Link and target (optional) as value, seperated by "::".
     *  @param {String} classes Extra styling options, seperated by a space. Allows custom classes. No presets available
     */
    buttons(id, buttons, classes = ""){
        if(Object.keys(buttons).length == 1){
            console.warn("Only one button was given. If this was meant to be, please use 'common.button', not 'common.buttons'");
            return "<br><br><div style='color:red'>Incorrect function call</div>"
        }

        let button_list = "";
        let btype = "";
        let keys = Object.keys(buttons);
        
        for(let k = 0; k < keys.length; k++){                                   // for every key in buttons
            if(Object.keys(buttons)[0] == keys[k])                              // if the key is equal to the key of the first one
                btype = " primary";                                             // it is the first one, so make it primary
            else btype = "";

            let text = Object.keys(buttons)[k];                                 // get the key
            let value = buttons[keys[k]];                                       // get the value

            if(value.indexOf('::') != -1){                                                                      // check whether the "::" are present
                var url = value.substring(0, value.indexOf('::')).replace(/\s+/g, ''),                          // url : read untill "::" and remove spaces 
                    target = " target='" + value.slice(value.indexOf("::") + 2).replace(/\s+/g, '') + "'";      // target : read after "::" and remove spaces
            } else 
                var url = value, target = "";  

            button_list += `<a href="${url}"${target} class="common-button${btype}">${text}</a>`;
        }

        var html = `
        <div id="${id}" class="common-buttongroup ${classes}">
            ${button_list}
        </div>
        `;

        return html;
    }

    /** creates an select
     *  @param {String} id Selector, only occuring once on the page
     *  @param {Object} griditems Object with key as text. Link text and extra text beneath seperated by "::". Link and target (optional) as value, seperated by "::".
     *  @param {String} classes Extra styling options, seperated by a space. Allows custom classes. Presets: grid, animation
     */
    list(id, griditems, classes = ""){
        let grid_items = "";
        let keys = Object.keys(griditems);

        for(let k = 0; k < keys.length; k++){                               // for every key in griditems
            let key = Object.keys(griditems)[k];                            // get the key
            let value = griditems[keys[k]];                                 // get the value

            if(key.indexOf('::') != -1){                                                                        // check whether the "::" are present
                var text = key.substring(0, key.indexOf('::')),                                                 // url : read untill "::" and remove spaces 
                    description = "<br>" + key.slice(key.indexOf("::") + 2);                                    // target : read after "::" and remove spaces
            } else {
                var text = key, description = "";
            }

            if(value.indexOf('::') != -1){                                                                      // check whether the "::" are present
                var url = value.substring(0, value.indexOf('::')).replace(/\s+/g, ''),                          // url : read untill "::" and remove spaces 
                    target = " target='" + value.slice(value.indexOf("::") + 2).replace(/\s+/g, '') + "'";      // target : read after "::" and remove spaces
            } else 
                var url = value, target = "";  

            // prevent an error with an empty url
            url = url == "" ? "javascript:void(0)" : url;

            // <li><a href="play.html?id=0">Asteroids</a> <br>(has multiplayer)</li>
            grid_items += `<li><a href="${url}"${target}>${text}</a><span>${description}</span></li>`;
            // grid_items += `<a ${id} href="${url}" ${target} class="common-button ${btype}">${text}</a>`;

        }

        let html = `
            <ul id="${id}" class="common-list ${classes}">
                ${grid_items}
            </ul>
        `;

        return html;
    }

    /** creates an input field
     *  @param {String} id Selector, only occuring once on the page
     *  @param {String} placeholder Text which appears in the input 
     *  @param {String} attributes Attributes of the input, like autofocus, rows, or maxlength
     *  @param {String} classes Extra styling options, seperated by a space. Allows custom classes. Preset: stripe, shadow
     */
    textarea(id, placeholder = "", attributes = "", classes = ""){
        let html = `
            <textarea id="${id}" class="common-textarea ${classes}" ${attributes} ${placeholder == "" ? "" : "placeholder='" + placeholder + "'"}></textarea>
        `;

        return html;
    }
}

module.exports = CommonItems;