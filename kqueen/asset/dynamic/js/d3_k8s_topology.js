var cache = { };

function topology_graph(selector, notify, options) {
    var outer = d3.select(selector);

    /* Kinds of objects to show */
    var kinds = options["kinds"];

    /* Data we've been fed */
    var items = [];
    var relations = [];

    /* Graph information */
    var width;
    var height;
    var radius = 20;
    if (options["radius"]) {
       radius = options["radius"];
    }
    var timeout;
    var nodes = [];
    var links = [];
    var lookup = { };
    var selection = null;
    var force = options["force"];

    /* Allow the force to be passed in, default if not */
    if (!force) {
        force = d3.layout.force()
            .charge(-60)
            .linkDistance(100);
    }

    var drag = force.drag();

    var svg = outer.append("svg")
        .attr("viewBox", "0 0 1600 1200")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "kube-topology");

    var vertices = d3.select();
    var edges = d3.select();

    force.on("tick", function() {
        edges.attr("x1", function(d) { return d.source.x; })
             .attr("y1", function(d) { return d.source.y; })
             .attr("x2", function(d) { return d.target.x; })
             .attr("y2", function(d) { return d.target.y; });

        vertices
            .attr("cx", function(d) {
                d.x = d.fixed ? d.x : Math.max(radius, Math.min(width - radius, d.x));
                return d.x;
            })
            .attr("cy", function(d) {
                d.y = d.fixed ? d.y : Math.max(radius, Math.min(height - radius, d.y));
                return d.y;
            })
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
    });

    drag
        .on("dragstart", function(d) {
            notify(d.item);

            if (d.fixed !== true)
                d.floatpoint = [ d.x, d.y ];
            d.fixed = true;
            d3.select(this).classed("fixed", true);
        })
        .on("dragend", function(d) {
            var moved = true;
            if (d.floatpoint) {
                moved = (d.x < d.floatpoint[0] - 5 || d.x > d.floatpoint[0] + 5) ||
                        (d.y < d.floatpoint[1] - 5 || d.y > d.floatpoint[1] + 5);
                delete d.floatpoint;
            }
            d.fixed = moved && d.x > 3 && d.x < (width - 3) && d.y >= 3 && d.y < (height - 3);
            d3.select(this).classed("fixed", d.fixed);
        });

    svg
        .on("dblclick", function() {
            svg.selectAll("g")
                .classed("fixed", false)
                .each(function(d) { d.fixed = false; });
            force.start();
        })
        .on("click", function(ev) {
            /*if (!d3.select(d3.event.target).datum()) {
                notify(null);
            }*/
        });

    function select(item) {
        selection = item;
        svg.selectAll("g")
            .classed("selected", function(d) { return d.item === item; });
    }

    function adjust() {
        timeout = null;
        width = outer.node().clientWidth;
        height = outer.node().clientHeight;

        force.size([width, height]);
        svg.attr("viewBox", "0 0 " + width + " " + height);
        update();
    }

    function update() {
        edges = svg.selectAll("line")
            .data(links);

        edges.exit().remove();
        edges.enter().insert("line", ":first-child");

        edges.attr("class", function(d) { return d.kinds; });

        vertices = svg.selectAll("g")
            .data(nodes, function(d) { return d.id; });

        vertices.exit().remove();

        var added = vertices.enter().append("g")
            .call(drag);

        select(selection);

        force
            .nodes(nodes)
            .links(links)
            .start();

        return added;
    }

    function digest() {
        var pnodes = nodes;
        var plookup = lookup;

        /* The actual data for the graph */
        nodes = [];
        links = [];
        lookup = { };

        var item, id, kind, node;
        for (id in items) {
            item = items[id];
            kind = item.kind;

            if (kinds && !kinds[kind])
                continue;

            /* Prevents flicker */
            node = pnodes[plookup[id]];
            if (!node) {
                node = cache[id];
                delete cache[id];
                if (!node)
                    node = { };
            }

            node.id = id;
            node.item = item;

            lookup[id] = nodes.length;
            nodes.push(node);
        }

        var i, len, relation, s, t;
        for (i = 0, len = relations.length; i < len; i++) {
            relation = relations[i];

            s = lookup[relation.source];
            t = lookup[relation.target];
            if (s === undefined || t === undefined)
                continue;

            links.push({ source: s, target: t, kinds: nodes[s].item.kind + nodes[t].item.kind });
        }

        if (width && height)
            return update();
        else
            return d3.select();
    }

    function resized() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(adjust, 150);
    }

    //window.addEventListener('resize', resized);

    adjust();
    resized();

    return {
        select: select,
        kinds: function(value) {
            kinds = value;
            var added = digest();
            return [vertices, added];
        },
        data: function(new_items, new_relations) {
            items = new_items || { };
            relations = new_relations || [];
            var added = digest();
            return [vertices, added];
        },
        close: function() {
            window.removeEventListener('resize', resized);
            window.clearTimeout(timeout);

            /*
             * Keep the positions of these items cached,
             * in case we are asked to make the same graph again.
             */
                var id, node;
            cache = { };
            for (id in lookup) {
              node = nodes[lookup[id]];
              delete node.item;
              cache[id] = node;
            }

            nodes = [ ];
            lookup = { };
        }
    };
}
