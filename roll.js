function isNormalInteger(str) {
    return /^[0-9]\d*$/.test(str);
}

function getPlayerId(msg) {
    var player_id;
    try {
        player_id = 
            getObj('player', msg.playerid).get('speakingas').split("|",2)[1];
        if(player_id == null) {
			player_id = msg.playerid;
		}
    }
    catch (e) {
        player_id = msg.playerid;
    }
    log("got player_id: "+player_id);
    return player_id;
}

function getCharacterId(msg) {
    var char_id;
    try {
        //log("character for "+getPlayerId(msg)+": "
        //    +JSON.stringify(findObjs({type: 'character',
        //                              controlledby: getPlayerId(msg)},
        //             {caseInsensitive: true})));
        char_id = findObjs({type: 'character',
                            controlledby: getPlayerId(msg)},
                           {caseInsensitive: true})[0].id;
        if(char_id == null) {
			char_id = msg.playerid;
		}
    }
    catch (e) {
        char_id = msg.playerid;
    }
    log("got char_id: "+char_id);
    return char_id;
}

function getPlayerName(msg) {
    var name;
    try {
        name = msg.who;
    }
    catch (e) {
        name = getObj('player', msg.playerid).get('speakingas');
    }
    log("got player name: "+name);
    return name;
}

function getAttrValueByRegex(character_id,
                             attribute_regex) {
    var attributes=
        findObjs({type: 'attribute', characterid: character_id},
                 {caseInsensitive: true});
    var index,len,attr_value=0,attribute_name="";
    var patt = new RegExp(attribute_regex, 'i');
    for (index=0, len=attributes.length; index<len; ++index) {
        if (patt.test(attributes[index].get("name"))) {
            attr_value = attributes[index].get('current');
            attribute_name = attributes[index].get("name");
            log ("found attribute "+attribute_name+ " for "
                 +attribute_regex+": "+attr_value);
            break;
        }
    }
    return [ attribute_name, attr_value ];
}

function getAttrSum(character_id, attributes) {
    var params = attributes.split("+", 3);
    var attr_sum=0;
    var attr_string=[];
	for(var i=0; i<3; i++) {
        if(isNormalInteger(params[i])) {
            attr_string.push(params[i]);
            attr_sum += Number(params[i]);
        }
        else if(typeof params[i] === 'string') {
            var attr_name_value = getAttrValueByRegex(character_id,params[i]);
            attr_string.push(attr_name_value[0]);
            attr_sum += Number(attr_name_value[1]);
        }
    }
    return [ attr_string.join('+'), attr_sum ];
}

function getAttrValueByName(character_id,
                            attribute_name,
                            attribute_default_value) {
    var attribute_default_value=attribute_default_value || '';
    var attribute=attribute_default_value;
    //log("get value for player " + character_id + " " + attribute_name  + " (" + attribute_default_value + ")");
    log("get value for player " + character_id + " " + attribute_name
        + " (" + attribute_default_value + ")");
    try {     
        attributes=
            findObjs({type: 'attribute',
                      characterid: character_id,
                      name: attribute_name},
                     {caseInsensitive: true});
        //log("found attribute: "+JSON.stringify(attributes));
        var index,len;
        for (index=0, len=attributes.length; index<len; ++index) {
            if (attributes[index].get('current') !== "") {
                return attributes[index].get('current');
            }
        }
    }
    catch (e) {
        // log("attribute not found");
    }
    log("set default value for player " + character_id + " " + attribute_name
        + " (" + attribute_default_value + ")");
    createObj(
        'attribute', 
        { characterid: character_id,
          name: attribute_name,
          current: attribute_default_value 
        }
    );
    return attribute_default_value;
}

function sendRollMsg(who, speak, text, nb_dice, difficulty) {
    var message = speak + " " + text 
      	+ " [[{" + nb_dice[1] + "d10!}>" + difficulty + "f1]]"
      	+ "  ("+nb_dice[0]+" diff "+difficulty+")";
    log("envoi au chat : " + message);
    sendChat(who, message);
}

on("chat:message", function(msg) {
    // is it a special message?
    if(msg.type == "api") {
        var is_roll=false;
        var speak;
        log("rcv from "+msg.playerid+": "+msg.content);
        var char_id = getCharacterId(msg);
        if (msg.content.match(/^!at/) !== null) {
            log("trouvé at");
            var param = msg.content.split(" ", 8);
            var attr = getAttrSum(char_id,param[1]);
            sendChat(msg.who, "/w "+msg.who+" "+attr[0]+": "+attr[1]);
        }
        if (msg.content.match(/^!sr/) !== null) {
            log("trouvé sr");
            speak="/em";
            is_roll=true;
        }
        if (msg.content.match(/^!gr/) !== null) {
            log("trouvé gr");
            speak="/w conteur";
            is_roll=true;
        }
        if (is_roll){
            var difficulty=getAttrValueByName(char_id,"dflt_difficulty","6");
            var nb_dice=getAttrValueByName(char_id,"dflt_nb_dice","4");
            var text=getAttrValueByName(char_id,"dflt_text","mon action");
            var param = msg.content.split(" ", 10);
            var is_sane = true;
            if(param[1]!==undefined) {
                difficulty = getAttrSum(char_id,param[1])[1];
                if (difficulty === 0) { is_sane = false; }
                if(param[2]!==undefined) {
            		nb_dice = getAttrSum(char_id,param[2]);
                    if (nb_dice[1] === 0) { is_sane = false; }
                    if(param[3]!==undefined) {
                        text = "";
            			for(var i=3; i<10; i++) {
            				if(param[i] !== undefined) {
            				    log(""+param[i]+": "+typeof param[i]);
            					text += param[i] + " ";
            				}
            			}
            		}
            	}
            }
            if (is_sane) {
                sendRollMsg(msg.who, speak, text, nb_dice, difficulty);
            }
        }
    }
});
