// mettre la difficulté collé avec la commande '!sr5 dex+art il danse bien :)'

// !sr6 intel+computer je tente de faire marcher mon script
// /em Zach [[{4d10!}>6f1]] mon action

// [[{3d10!}>6f1]]

// sheet
// https://github.com/Roll20/roll20-character-sheets/tree/master/CWOD-M20

// display:block;width:40px;float:left;margin-right:10px;text-align:center

// <span original-title="<img src=&quot;/images/quantumrollwhite.png&quot; class=&quot;inlineqroll&quot;> Rolling {6d10!}>6f1 = {(<span class=&quot;basicdiceroll&quot;>8</span>+<span class=&quot;basicdiceroll&quot;>2</span>+<span class=&quot;basicdiceroll critsuccess &quot;>10</span>+<span class=&quot;basicdiceroll critfail &quot;>1)}" class="inlinerollresult showtip tipsy-n importantroll">4</span>

// showtip tipsy-n : importantroll | fullcrit | fullfail | 
// <span class=&quot;basicdiceroll critsuccess &quot;>
// <span class=&quot;basicdiceroll&quot;>
// <span class=&quot;basicdiceroll critfail &quot;>

//<span class="userscript-dice_tooltip" title="7+10+8+9+10+4" style="background-color: #fef68e ; padding: 0 3px 0 3px ; font-weight: bold ; cursor: help ; font-size: 1.1em ; border: 2px solid #3fb315">5</span>

// on('ready',function(){
//     'use strict';
//     var players=findObjs({_type:'player'});
//     _.each(players,function (obj){
//         log('Player '+obj.get('displayname')+' has id: '+obj.get('id'));
//     });
// });

//style=\"background: #fff ; border: solid 1px #f00 ; border-collapse: separate ; border-radius: 10px ; overflow: hidden ; width: 10%\" border=\"solid 5px #f00\"

//<table style="background: #fff ; border: solid 1px #000 ; border-collapse: separate ; border-radius: 10px ; overflow: hidden ; width: 100%" border="solid 5px #f00"><thead style="background: #000 ; color: #fff ; font-weight: bold"><tr><th>IT'S A TRAP!</th></tr></thead><tbody><tr><td>This is a test.</td></tr></tbody></table>

function isNormalInteger(str) {
		'use strict';
		return (/^[0-9]\d*$/).test(str);
}

function getPlayerId(msg) {
		'use strict';
    var player_id;
    //log("playerid: "+msg.playerid+", obj.player: "+JSON.stringify(getObj('player', msg.playerid))+", speakingas: "+getObj('player', msg.playerid).get('speakingas')+", player_id: "+getObj('player', msg.playerid).get('speakingas').split("|",2)[1]);
    try {
        player_id = 
            getObj('player', msg.playerid).get('speakingas').split("|",2)[1];
        if(player_id === undefined) {
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
		'use strict';
    var char_id;
    //log("character for "+getPlayerId(msg)+": "+JSON.stringify(findObjs({type: 'character',controlledby: getPlayerId(msg)},{caseInsensitive: true})));
    try {
        char_id = findObjs({type: 'character',
                            controlledby: getPlayerId(msg)},
                           {caseInsensitive: true})[0].id;
        if(char_id === undefined) {
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
		'use strict';
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
		'use strict';
    var attributes=
        findObjs({type: 'attribute', characterid: character_id},
                 {caseInsensitive: true});
    var index,len,attr_value=0,attribute_name="";
    var patt = new RegExp(attribute_regex, 'i');
    for (index=0, len=attributes.length; index<len; index++) {
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
		'use strict';
    var params = attributes.split("+", 3);
    var attr_sum=Number(getAttrValueByRegex(character_id,"Health")[1]);
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
	'use strict';
    var attribute_default_value=attribute_default_value || '';
    var attribute=attribute_default_value;
    var attributes;
    //log("get value for player " + character_id + " " + attribute_name + " (" + attribute_default_value + ")");
    try {
        attributes=
            findObjs({type: 'attribute',
                      characterid: character_id,
                      name: attribute_name},
                     {caseInsensitive: true});
        //log("found attributes: "+JSON.stringify(attributes));
        _.each(attributes, function (obj){
                log('attribute '+obj.get('name')+': '+obj.get('current'));
                if (obj.get('current') !== undefined) {
                    if (attribute === attribute_default_value) {
                      attribute = obj.get('current');
                    }
                }
               });
    }
    catch (e) {
        log("attribute not found");
        log("error for attributes: "+JSON.stringify(attributes));
    }
    if (attributes.length === 0){
        log("set default value for player " + character_id + " " + attribute_name + " (" + attribute_default_value + ")");
        try {
            createObj(
                'attribute', 
                { characterid: character_id,
                  name: attribute_name,
                  current: attribute_default_value 
                }
            );
        }
        catch (e) {
            log("impossible to set attribute: "+attribute_name+" to char_id "+character_id);
        }
    }
    return attribute;
}

function sendRollMsg(who, speak, text, nb_dice, difficulty) {
	'use strict';
    var message = speak + " " + text 
      	+ " [[{" + nb_dice[1] + "d10!}>" + difficulty + "f1]]"
      	+ "  ("+nb_dice[0]+" diff "+difficulty+")";
    log("envoi au chat " + who + ": " + message);
    sendChat(who, message);
}

on("chat:message", function(msg) {
		'use strict';
    // is it a special message?
    if(msg.type == "api") {
        //log("msg: "+JSON.stringify(msg));
        var is_roll=false;
        var speak; // chat command to use
				var command; // the sent command
        log("rcv from "+msg.playerid+": "+msg.content);
        var char_id = getCharacterId(msg);
        if (msg.content.match(/^!at/) !== null) {
            log("trouvé at");
            var param = msg.content.split(" ", 8);
            var attr = getAttrSum(char_id,param[1]);
            sendChat(msg.who, "/w "+msg.who+" "+attr[0]+": "+attr[1]);
        }
				
        if (msg.content.match(/^!sr/) !== null) {
						command = "!sr";
            speak="/em";
            is_roll=true;
        }
        if (msg.content.match(/^!mr/) !== null) {
						command = "!mr";
            speak="/w Zach";
            is_roll=true;
        }
        if (msg.content.match(/^!gr/) !== null) {
						command = "!gr";
            speak="/w gm";
            is_roll=true;
        }
        log("found command: "+command);
        if (is_roll){
            var difficulty=getAttrValueByName(char_id,"dflt_difficulty","6");
            //log("difficulty: "+difficulty);
            var nb_dice=getAttrSum(char_id,getAttrValueByName(char_id,"dflt_nb_dice","4"));
            //log("nb_dice: "+nb_dice);
            var text=getAttrValueByName(char_id,"dflt_text","mon action");
            //log("text: "+text);
            var param = msg.content.split(" ", 10);
            var is_sane = true;
            var first_param = param[0].replace(command, "").replace(/ /g,'');
            if((first_param===undefined) || (first_param === "")) {
                first_param = difficulty;
            }
            difficulty = getAttrSum(char_id,first_param)[1];
            if (difficulty === 0) { is_sane = false; }
            if(param[1]!==undefined) {
            	nb_dice = getAttrSum(char_id,param[1]);
                if (nb_dice[1] === 0) { is_sane = false; }
                if(param[2]!==undefined) {
                    text = "";
            		for(var i=2; i<10; i++) {
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
            if (command === "!gr") {
                // whisper to gm, echo the command (without the roll)
                sendChat(msg.who, "/w "+msg.who+" exécute "+text+" - "+nb_dice[0]+" ("+nb_dice[1]+"d)"+" diff "+difficulty);
            }
        }
    }
}
);
