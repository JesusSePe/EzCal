const schedule = require('node-schedule'); // node-schedule package
const dateFormat = require("dateformat"); // Dateformat package
const Discord = require("discord.js"); // Load Discord JS modules

module.exports = {
    scheduler: function(row, client) {
        console.log(dateFormat(row.eventDate, 'yyyy'), (dateFormat(row.eventDate, 'm')-1), dateFormat(row.eventDate, 'd'), dateFormat(row.eventDate, 'H'), dateFormat(row.eventDate, 'M'), dateFormat(row.eventDate, 's'));
        var date = new Date(dateFormat(row.eventDate, 'yyyy'), (dateFormat(row.eventDate, 'm')-1), dateFormat(row.eventDate, 'd'), dateFormat(row.eventDate, 'H'), dateFormat(row.eventDate, 'M'), dateFormat(row.eventDate, 's'));
        schedule.scheduleJob(date, function() {
            let name = row.name;
            let description = row.description;
            if (row.type == "server") {
                let server = row.server_id;
                var EventEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${name}`)
                    .setDescription(`${description}`);
                client.channels.fetch(`${row.channel_id}`)
                    .catch() //In case Discord's API fails
                    .then(channel => channel.send(EventEmbed).catch()); //Catch error in case bot can't send message
            }
            else {
                var EventEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${name}`)
                    .setDescription(`${description}`);
                client.users.fetch(`${row.user}`)
                    .catch() //In case Discord's API fails
                    .then(user => user.send(EventEmbed).catch()); //Catch error in case bot can't send message on DMs
            }
        })
    }

}
