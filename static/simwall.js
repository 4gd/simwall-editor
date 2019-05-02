// Constants
const INITIAL_WIDTH = 5;
const INITIAL_HEIGHT = 4;
const PILLAR_SIZE = 20;
const SECTION_LENGTH = 80;
const SECTION_WIDTH = PILLAR_SIZE;
const PILLAR_COLOR = '#777';
const NONE_COLOR = '#ffffff';
const WALL_COLOR = '#000000';
const DOOR_COLOR = '#ff0000'
const WINDOW_COLOR = '#00ff00'
const COLORS = [NONE_COLOR, WALL_COLOR, DOOR_COLOR, WINDOW_COLOR];
const SECTION_ATTR = {
    fill: NONE_COLOR,
    stroke: '#fff',
    'stroke-width': 0
}
const PILLAR_ATTR = {
    fill: PILLAR_COLOR,
    stroke: '#fff',
    'stroke-width': 8
}

function cycleColor(color) {
    for(let i = 0; i < COLORS.length; i++) {
        if (COLORS[i] === color) {
            return COLORS[(i + 1) % COLORS.length]
        }
    }
}

function getColor(s) {
    switch (s) {
        case "None":
            return NONE_COLOR;
        case "Wall":
            return WALL_COLOR;
        case "Door":
            return DOOR_COLOR;
        case "Window":
            return WINDOW_COLOR;
        default:
            throw 'Unknown type';

    }
}

function initialize(width, height) {
    $('#width-input').val(width);
    $('#height-input').val(height);
    $('#save-input').val('');

    draw.clear();
    let drawWidth = (PILLAR_SIZE + SECTION_LENGTH) * (width - 1) + PILLAR_SIZE
    let drawHeight = (PILLAR_SIZE + SECTION_LENGTH) * (height - 1) + PILLAR_SIZE
    draw.size(drawWidth, drawHeight);

    // Draw Pillars
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            draw.rect(PILLAR_SIZE, PILLAR_SIZE).attr({
                x: i * (PILLAR_SIZE + SECTION_LENGTH),
                y: j * (PILLAR_SIZE + SECTION_LENGTH),
                ...PILLAR_ATTR
            });
        }
    }

    // Draw Sections and set up click events
    sections = [];
    for (let j = 0; j < height; j++) {
        for(let i = 0; i < width; i++) {
        let x = draw.rect(SECTION_LENGTH, SECTION_WIDTH).attr({
            x: i * (PILLAR_SIZE + SECTION_LENGTH) + PILLAR_SIZE,
            y: j * (PILLAR_SIZE + SECTION_LENGTH),
        });
        let y = draw.rect(SECTION_WIDTH, SECTION_LENGTH).attr({
            x: i * (PILLAR_SIZE + SECTION_LENGTH),
            y: j * (PILLAR_SIZE + SECTION_LENGTH) + PILLAR_SIZE,
        });
        x.attr(SECTION_ATTR);
        y.attr(SECTION_ATTR);

        if (i < width - 1) {
            x.click(function() {
            let currentColor = this.attr('fill');
            this.fill(cycleColor(currentColor));
            });
        }
        if (j < height - 1) {
            y.click(function() {
            let currentColor = this.attr('fill');
            this.fill(cycleColor(currentColor));
            });
        }
        sections.push({'X': x, 'Y': y});
        }
    }
}

/**
 * Replacer function used by JSON.strinify to convert SVG object references into
 * required format
 */ 
function replacer(name, val) {
    if(name === 'X' || name === 'Y') {
        switch (val.attr('fill')) {
            case NONE_COLOR:
                return 'None';
            case WALL_COLOR:
                return 'Wall';
            case DOOR_COLOR:
                return 'Door';
            case WINDOW_COLOR:
                return 'Window';
            default:
                throw 'Unknown type';
        }
    } else if (name !== '') {
        // Add Name = index as a property (required by unreal format)
        val.Name = name;
    }
    return val;
}

function updateLayoutsSelect() {
    $.getJSON(apiBaseURL + 'layouts/names').done(function(data) {
        let options = data.sort().map(function(name) {
            return new Option(name, name);
        });
        $('#layouts-select')
            .find('option')
            .remove()
            .end()
            .append(options)
            .attr('size', options.length);
    });
}

// Create SVG document
let draw = SVG('whiteboard')

// Initial set up
let sections = [];
let apiBaseURL = '/api/';
initialize(INITIAL_WIDTH, INITIAL_HEIGHT);
updateLayoutsSelect();


// Event Handlers
$('#out-button').click(() => {
    console.log(JSON.stringify(sections, replacer, 4));
})

$('#width-input, #height-input').change(function() {
    let newWidth = $('#width-input').val();
    let newHeight = $('#height-input').val();
    initialize(newWidth, newHeight);
})

$('#refresh-button').click(function() {
    updateLayoutsSelect();
});

$('#save-button').click(function() {
    // TODO: check if name exists and update instead of post
    data = {  
        'name': $('#save-input').val(),
        'width': $('#width-input').val(),
        'height': $('#height-input').val(),
        'layout': JSON.stringify(sections, replacer, 4)
    }
    $.ajax({
        url: apiBaseURL + 'layouts',
        type: 'POST',
        data: JSON.stringify(data),
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: updateLayoutsSelect
    })
    
});

$('#delete-button').click(function() {
    let name = $('#layouts-select').val();
    $.ajax({
        url: apiBaseURL + 'layouts/' + name,
        type: 'DELETE',
        success: updateLayoutsSelect
    });
});

$('#load-button').click(function() {
    let name = $('#layouts-select').val();
    $.getJSON(apiBaseURL + 'layouts/' + name, function(data) {
        initialize(data.width, data.height);
        data.layout.forEach(function(section, i) {
            sections[i].X.fill(getColor(section.X));
            sections[i].Y.fill(getColor(section.Y));
        });
        $('#save-input').val(name);
    });
});
