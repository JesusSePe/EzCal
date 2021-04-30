const Discord = require("discord.js");
const sanitizer = require("string-sanitizer"); // NPM string sanitizer
var dateFormat = require("dateformat"); // Dateformat package
const schedule = require("./schedule.js"); // Schedule function.
module.exports = {
    /*##### PING #####*/
    ping: function (message){
        const timeTaken = Date.now() - message.createdTimestamp;
        message.channel.send(`<:ping_pong:835918245403951105>¡Pong! ¡Hay una latencia de ${timeTaken}ms entre Discord y este bot!`);
    },
    /*##### VERSION #####*/
    version: function (message, ver){
        message.channel.send(`La version actual es ${ver}`);
    },
    /*##### INVITE #####*/
    invite: function (message, inv){
        message.channel.send(new Discord.MessageEmbed().addField("Siéntete libre de añadirme a tu servidor con", `[este link](${inv})`));
    },
    /*##### TEST #####*/
    test: function(message) {
        message.channel.send(`${message.author.id}`);
    },
    /*##### ADD EVENT #####*/
    add: function(message, args, mysql, pool, prefix, user, client) {
        if (args[0] == null) {
            message.channel.send(`Para añadir un evento sigue la estructura \`${prefix}\` add <nombre>`);
        } else {
            var name = sanitizer.sanitize.keepSpace(args.join(' ')); // Name 

            // Await get messages.
            try {
                // Get description message
                message.channel.send(`Descripción del evento: `);
                message.channel.awaitMessages(m => m.author.id == message.author.id, 
                    {max: 1, time: 60000, errors: ['time']})
                    .then(collected => {
                        var desc = sanitizer.sanitize.keepSpace(collected.first().content); // Description
                        message.channel.send(`Fecha del evento en formato MM/DD/YYYY hh:mm:ss(Hora opcional. Los datos se guardan en zona horaria GMT +00:00))`);
                        // Get event date message
                        message.channel.awaitMessages(m => m.author.id == message.author.id,
                            {max: 1, time: 30000, error: ['time']})
                            .then(collected2 => {
                                try {
                                    if (Date.parse(collected2.first().content) != 'NaN') {
                                        var day = new Date(collected2.first().content); // get Dia
                                        day = day.toISOString().slice(0,19).replace('T', ' '); // Formatting Dia
                                        try {
                                            var server = message.guild.id;
                                            var channel = message.channel.id;
                                            var type = "server";
                                        }
                                        catch {
                                            var server = 'null';
                                            var channel = message.channel.id;
                                            var type = "dm";
                                        }
                                        let sql = `INSERT INTO events (name, description, eventDate, user, server_id, channel_id, type, created_at, updated_at) VALUES (?, ?, ?, ${user}, ${server}, ${channel}, '${type}', sysdate(), sysdate())`;
                                        pool.query(sql, [name, desc, day], function(err, result, fields){
                                            if (err) {
                                                message.channel.send('Se ha producido un error interno.');
                                                return;
                                            }
                                            pool.query(`SELECT * FROM events WHERE id = ${result.insertId}`, function(err, result2, fields) {
                                                if (err) {
                                                    message.channel.send('Se ha producido un error interno.');
                                                    return;
                                                }
                                                result2.forEach(row => {
                                                    schedule.scheduler(row, client);
                                                })
                                            })
                                        });
                                        message.channel.send(":white_check_mark: Evento añadido");
                                        message.channel.send(`Nombre: ${name}, Descripcion: ${desc}, Dia: ${day}`);
                            
                                    } else {
                                        throw("formato incorrecto");
                                    }
                                }
                                catch {
                                    message.channel.send("El formato de fecha no es valido. Prueba con MM/DD/YYYY (mes/dia/año)");
                                }
                            })
                            .catch(collected => {message.channel.send("Han pasado más de 30 segundos y se ha cancelado el nuevo evento.")})
                    })
                    .catch(collected => {message.channel.send("Han pasado más de 30 segundos y se ha cancelado el nuevo evento.")});
            }
            catch{
                message.channel.send ("Unexpected error");
            }

        }
    },
    /*##### EVENTS #####*/
    events: async function(message, promisePool) {
        if (message.channel.type != "dm") {
            var eventsEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Eventos')
                .setDescription('Eventos de este servidor');
                try {
                    var [results, fields] = await promisePool.query(`SELECT * FROM events WHERE server_id = ? order by eventDate`, [message.guild.id]);
                } catch (err) {
                    console.log(err);
                    console.log("mlem");
                }
                results.forEach(row => {
                    eventsEmbed.addField(`${dateFormat(row.eventDate, 'paddedShortDate')}`, `${row.name}: ${row.description}`);
                });
            if (results.length == 0) {
                message.channel.send("No hay eventos. Puedes añadir un evento con el comando add")
            } else {
                message.channel.send(eventsEmbed);
            }
        }
        else {
            var eventsEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Eventos')
                .setDescription('Tus eventos personales');
                try {
                    var [results, fields] = await promisePool.query(`SELECT * FROM events WHERE user = ? AND server_id is null order by eventDate`, [message.author.id]);
                } catch (err) {
                    console.log(err);
                }
                results.forEach(row => {
                    eventsEmbed.addField(`${dateFormat(row.eventDate, 'paddedShortDate')}`, `${row.name}: ${row.description}`);
                });
            if (results.length == 0) {
                message.channel.send("No hay eventos. Puedes añadir un evento con el comando add")
            } else {
                message.channel.send(eventsEmbed);
            }
        }
    },
    /*##### HELP #####*/
    help: function(message, args, prefix) {
        try {
            if (args[0] === "utilidades"){
                var helpEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('EzCal')
                .setURL('https://github.com/JesusSePe/')
                .setDescription('Utilidades')
                .addFields(
                    { name: `${prefix} ping`, value:'Devuelve la latencia entre la API de Discord y este bot.'},
                    { name: `${prefix} help`, value:'Devuelve todos los comandos agrupados por secciones.'},
                    { name: `${prefix} invite`, value:'Devuelve el enlace para poder añadir el bot a un nuevo servidor.'},
                    { name: `${prefix} version`, value:'Devuelve la ultima version del bot.'}
                )
                .setTimestamp()
                .setFooter('discal');
            }
            else if (args[0] === "eventos"){
                var helpEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('EzCal')
                .setURL('https://github.com/JesusSePe/')
                .setDescription('Eventos')
                .addField(
                    { name: `${prefix} add`, value:'Añade un evento a la base de datos. Primero se envía el nombre, después la descripción y por último la fecha del evento. También se puede enviar la hora. La fecha y hora se guarda en formato GMT +00:00, de modo que puede variar la hora e incluso el día.'}
                )
            }
            else {
                throw("Argumento no valido");
            }
        }
        catch {
            var helpEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('EzCal')
            .setURL('https://github.com/JesusSePe/')
            .setDescription('¡Bienvenido a EzCal, el bot calendario simple!')
            .addFields(
                { name: 'Utilidades', value:`${prefix} help utilidades`},
                { name: 'Eventos', value:`${prefix} help eventos`}
            )
            .setTimestamp()
            .setFooter('EzCal');
        }
        message.channel.send(helpEmbed);
    }
}
