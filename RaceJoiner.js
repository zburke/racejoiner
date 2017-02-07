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
            console.log(racer);
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
                        console.log('adding ageFilter ', this.ageClass)
                        key += "_" + this.ageClass;
                    }
                    if (sexFilter) {
                        console.log('adding genderFilter ', this.gender)
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
                races["mass"] = {"finishers": roster};
            }

            console.log(races);

            rj.run();
        });
    }



    function sortByPlace(a, b) {
        return a.place > b.place ? 1 : (a.place < b.place ? -1 : 0);
    }


    function nameFor(racer)
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



    function showResults()
    {
        console.log('showResults');
        roster.sort(sortByPlace);

        $.each(races, function(index, item) {
            $('#results').append('<h1>' + index +'</h1>');
            var str = '<table id="' + index + '" class="race"><thead><tr><th>PLACE</th><th>NAME</th><th>TIME</th><th>BIB</th></tr></thead><tbody>';
            $.each(item.finishers, function(i, racer) {
                str += "<tr><th>" + racer.place + "</th>"
                    + "<td>" + nameFor(racer) + "</td>"
                    + "<td>" + racer.time + "</td>"
                    + "<td>" + racer.bib + "</td>"
                    + "</tr>";
            });
            str += "</tbody></table>";

            $('#results').append(str);
        });


        $('.modal').hide();
        $('#results').show();
    }

    this.run = function()
    {
        console.log('running...');
        (workflow.shift())();
    }

    return this;
}
