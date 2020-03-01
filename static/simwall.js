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
    panels = [];
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
            // sections.push({'X': x, 'Y': y});
            panels.push({'x': i, 'y': j, 'horizontal': true, 'type': x});
            panels.push({'x': i, 'y': j, 'horizontal': false, 'type': y});
        }
    }
}

function getPanelType(panel) {
    switch (panel.type.attr('fill')) {
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
}

/**
 * Replacer function used by JSON.strinify to convert SVG object references into
 * required format
 */ 
function replacer(key, val) {
    if(key === 'type') {
        return getPanelType(this);
    }
    return val;
}

function updateLayoutsSelect() {
    $.getJSON(apiBaseURL + 'layouts/names').done(function(data) {
        let names = data.names;
        let options = names.sort().map(function(name) {
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

function loadLayout(name) {
    $.getJSON(apiBaseURL + 'layouts/' + name, function(data) {
        initialize(data.width, data.height);
        data.panels.forEach(function(panel) {
            let x = panel.x, y = panel.y, horizontal = panel.horizontal;
            // 2d to 1d index. Multiply by 2 because horzontal true/false
            let i = (x + (y * data.width)) * 2;
            if (!panel.horizontal) {
                i += 1;
            }
            panels[i].type.fill(getColor(panel.type));
        });
        $('#save-input').val(name);
    }).fail(function() {
        console.log("404: layout not found");
    });
}

// Create SVG document
let draw = SVG('whiteboard')

// Initial set up
let sections = [];
let apiBaseURL = '/api/';
initialize(INITIAL_WIDTH, INITIAL_HEIGHT);
updateLayoutsSelect();
// Check for query string default layout
let params = new URL(location).searchParams;
if (params.get("name")) {
    loadLayout(params.get("name"));
}

// Event Handlers
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
        'panels': JSON.stringify(panels.filter(panel => getPanelType(panel) != "None"), replacer, 4)
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
    loadLayout(name);
});
