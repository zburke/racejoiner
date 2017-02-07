function RaceJoiner()
{
    var workflow = [getRoster, setFields, getFinishers, showFilters, showResults];
    var rj = this;

    var rosterArray    = [];
    var roster    = [];
    var finishers = [];
    var races = {};


    /**
     * Read racers into an array
     */
    function getRoster()
    {
        console.log('getRoster');
        $('.modal').hide();
        $('#roster').show();
        $('#rosterSubmit').click(function(){
            var lines = $('#rosterInput').val().split(/\n/);
            if ($('#rosterHeader').is(':checked')) {
                lines.shift();
            }

            $.each(lines, function() {
                var line = this.trim();
                if (line.length) {
                    rosterArray.push(line.split(/\t/));
                }
            });

            rj.run();
        });
    }


    /**
     * Parser for input array
     */
    function setFields()
    {
        console.log('setFields');
        $('.modal').hide();
        $('#fields').show();

        var jmax = rosterArray.length > 3 ? 3 : rosterArray.length;

        var fields = ['firstName', 'lastName', 'name', 'bib', 'ageClass', 'gender'];

        $.each(fields, function(index, item) {
            for (var i = 0; i < rosterArray[0].length; i++) {
                var val = [];
                for (var j = 0; j < jmax; j++) {
                    val.push(rosterArray[j][i]);
                }
                $('#fields' + item).append($('<option>', {value:i, text:val.join(", ")}));
            }
        });

        $('#fieldsSubmit').click(function(){

            $.each(rosterArray, function(index, line){
                racer = {};

                $.each(fields, function(findex, field) {
                    if ($('#fields' + field).val()) {
                        racer[field] = line[$('#fields' + field).val()]
                    }
                });

                roster.push(racer);
            });

            rj.run();
        });
    }


    /**
     * Read finishers into an array;
     * Format is hard-coded TSV with fields place, time, and bib.
     * Time is expected to be HH:MM:SS.sss
     */
    function getFinishers()
    {
        console.log('getFinishers');
        $('.modal').hide();
        $('#finishers').show();
        $('#finishersSubmit').click(function(){

            var lines = $('#finishersInput').val().split(/\n/);
            if ($('#finishersHeader').is(':checked')) {
                lines.shift();
            }

            $.each(lines, function() {
                var line = this.trim();
                if (line.length) {
                    var fields = line.split(/\t/);
                    var racer = {
                        place : fields[0],
                        time  : fields[1],
                        bib   : fields[2]
                    };

                    var tSegments = racer.time.match(/([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})(\.([0-9]+))?/);
                    if (tSegments && tSegments.length) {
                        racer.seconds = (3600 * Math.floor(tSegments[1])) + (60 * Math.floor(tSegments[2])) + Math.floor(tSegments[3]) + (tSegments[4] ? tSegments[4] : 0);
                    }

                    finishers.push(racer);
                }
            });

            joinInput();
            rj.run();
        });
    }


    /**
     * Match racers and finishers based on their bibs
     */
    function joinInput()
    {
        console.log('joinInput');

        $.each(roster, function() {
            var racer = this;
            $.each(finishers, function() {
                var finisher = this;
                if (racer.bib == finisher.bib) {
                    $.each(finisher, function(k, v) {
                        racer[k] = v;
                    });
                    return false;
                }
            });
        });
    }



    function showFilters()
    {
        console.log('showFilters');
        $('.modal').hide();
        $('#filter').show();


        if (roster[0].ageClass) {
            $('#filters').append('<div><label><input type="checkbox" id="filterByAgeClass" value="1"> Filter By Age Class?</label></div>');
        }

        if (roster[0].gender) {
            $('#filters').append('<div><label><input type="checkbox" id="filterByGender" value="1"> Filter By Gender?</label></div>');
        }


        $('#filterSubmit').click(function(){

            var ageFilter = $('#filterByAgeClass').is(':checked');
            var sexFilter = $('#filterByGender').is(':checked');

            if (ageFilter || sexFilter) {
                $.each(roster, function() {
                    var key = "Race";
                    if (ageFilter) {
                        key += "_" + this.ageClass;
                    }
                    if (sexFilter) {
                        key += "_" + this.gender;
                    }

                    if (! races[key]) {
                        races[key] = { finishers : []}
                    }

                    this.place = races[key].finishers.length + 1;

                    races[key].finishers.push(this);
                });
            }
            else {
                races["Everybody"] = {"finishers": roster};
            }

            rj.run();
        });
    }



    function sortByPlace(a, b) {
        return a.place > b.place ? 1 : (a.place < b.place ? -1 : 0);
    }



    function nameFormat(racer)
    {
        if (racer.firstName && racer.lastName) {
            return racer.firstName + ' ' + racer.lastName;
        }
        else if (racer.name) {
            return racer.name;
        }
        else if (racer.firstName) {
            return racer.firstName;
        }
        else if (racer.lastName) {
            return racer.lastName;
        }
        else {
            return '#' + racer.bib;
        }
    }



    function timeFormat(racer, offset = 0)
    {
        if (racer.seconds) {
            var seconds = racer.seconds - offset;
            var h = Math.floor(seconds / 3600);
            seconds -= h * 3600;

            var m = Math.floor(seconds / 60);
            seconds -= m * 60;

            var s = Math.floor(seconds);
            seconds -= s;

            var i = racer.seconds.match(/.*\.([0-9]+)/);
            i = (2 == i.length) ? i[1] : "000";

            return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s) + "." + i
        }

        return racer.time;
    }



    function raceFormat(key, offset = 0)
    {
        console.log(key, offset);
        var race = races[key];

        var str = '<table id="' + key + '"><thead><tr><th>PLACE</th><th>NAME</th><th>TIME</th><th>BIB</th></tr></thead><tbody>';
        $.each(race.finishers, function(i, racer) {
            str += "<tr><th>" + racer.place + "</th>"
                + "<td>" + nameFormat(racer) + "</td>"
                + "<td>" + timeFormat(racer, offset) + "</td>"
                + "<td>" + racer.bib + "</td>"
                + "</tr>";
        });
        str += "</tbody></table>";

        return str;
    }



    function showResults()
    {
        console.log('showResults');
        roster.sort(sortByPlace);

        $.each(races, function(index, value) {
            var race = $('<div class="race"></div>').prop('id', 'race_' + index).html('<h1>' + index + '</h1>');
            race.append(raceFormat(index));
            $('#results').append(race);

            if (value.finishers[0].seconds) {
                $('#race_' + index + ' h1').after('<div><label for="offset'+index+'">Offset Minutes</label><select id="offset'+index+'"></select></div>');
                for (var i = 0; i < 60; i++) {
                    $('#offset' + index).append($('<option>', {value:i, text: i}));
                }

                $('#offset'+index).change(function(){
                    var offsetSeconds = 60 * $(this).val();
                    $('table#' + index).replaceWith(raceFormat(index, offsetSeconds));
                });
            }
        });

        $('.modal').hide();
        $('#results').show();
    }



    this.run = function()
    {
        (workflow.shift())();
    }

    return this;
}
