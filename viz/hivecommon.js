/*
   Copyright 2016-2018 Irdeto BV

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
function hive_init(all_xrefs_json, svg_exported_object) {
  var nodesByAddress = {};
  all_xrefs_json.forEach(function(group){
    Object.keys(group.edges).forEach(function(ea){
      node = {
        'type': group.label,
        'name': group.edges[ea].name,
        'address': ea
      };
      nodesByAddress[ea] = node;
    });
  });

  var links = [];
  all_xrefs_json.forEach(function(group){
    Object.keys(group.edges).forEach(function(ea){
      if (typeof nodesByAddress[ea] === "undefined") {
        console.log("missing node at ea: " + ea);
        return;
      }

      Object.values(group.edges[ea].xrefs_from).forEach(function(from){
        if (typeof nodesByAddress[from] === "undefined"){
          console.log("missing node at from: " + from);
          return;
        }

        //don't create links between the same types of nodes
        //TODO: duplicate axes for groups where we *want to see* intra-group links
        if(nodesByAddress[ea].type == nodesByAddress[from].type)
          return;

        links.push({
          'source': nodesByAddress[ea],
          'target': nodesByAddress[from]
        });
      });
    });
  });

  //create a rank for each node, based on sort of address. We'll use this for the display axis. It has the benefit (over address) of showing logical grouping and not conflating that also with the size of each function
  var nodes = [];
  count = 0;
  Object.keys(nodesByAddress)
    .sort(function(a,b) {
      return parseInt(a, 10) - parseInt(b, 10);
    })
    .forEach(function(address) {
      nodesByAddress[address].rank = count;
      nodes.push(nodesByAddress[address]);
      count = count + 1;
    });

  //go forward through the groups to have a predictable axis order
  var groups = [];
  all_xrefs_json.forEach(function(group){
    groups.push(group.label);
  });

  var panels = [
      [groups[0], groups[1], groups[2]]
    ];

  // done massaging the data; nodes, nodesByAddress and panels are populated
  //--------------------------------------------------------------------------------

  var major_angle = Math.PI / 6,
      minor_angle = Math.PI / 18,
      circle_r = 5,
      selected_line_width = 6,
      active_line_width = 3,
      line_width = 1.5,
      axis_width = 1.5,
      label_text_size = 14,
      tick_text_size = 11;

  var outerRadius = 2 * circle_r * Object.keys(nodesByAddress).length;
  var innerRadius = outerRadius / 8.0;
  outerRadius = outerRadius + innerRadius;

  var angle = d3.scaleBand().range([
        -1 * major_angle,
        11.0 * Math.PI / 6.0
      ]), //TODO: set most-central group as horizontally as possible
      radius = d3.scaleLinear().range([innerRadius, outerRadius]),
      color = d3.scaleOrdinal(d3.schemeDark2);

  angle.domain(Array.from(panels[0]).map((item, index) => index));
  radius.domain(d3.extent(nodes, function(d) { return d.rank; }));
  color.domain(groups);

  var container = d3.select("#hive");

  var svgs = container
    .selectAll("svg")
    .data(panels)
    .enter().append("svg")
    .attr("id", function(d){ return d; })
    .attr("width", (100 / panels.length - 0.5) + "%")
    .attr("height", "100%");

  var first_gs = svgs.append("g");

  //----------------------------------------------------------------------------
  // axis

  //TODO: enable dragging of axis to rotate angle using d3.drag()
  //TODO: enable dragging of edges of axis (maybe dragging the nodes off the axis?) to filter nodes from view
  var master_axis = d3.axisBottom(radius)
    .tickFormat(function(d) {
      return d3.format("#x")(parseInt(nodes[d].address, 10));
    })
    .tickSizeOuter(circle_r * 4)
    .tickSizeInner(circle_r * 2);

  svgs.each(function(groups) {
    first_g = d3.select(this).select("g");
    axes = [];
    groups.forEach(function(group) {
      tickValues = [];
      if (axes.length == 1) {
        tickValues.push(radius.domain()[0]);
      }
      tickValues.push(radius.domain()[1]);

      axis = first_g.append("g")
        .attr("class", "axis")
        .attr("transform", "rotate(" + rotate_neg90_indegrees(angle(groups.indexOf(group))) + ")");

      axis.append("line").attr("x1", radius.range()[0]).attr("x2", radius.range()[1]).style("stroke", color(group))
      axis.call(master_axis.tickValues(tickValues));

      first_g.append("g")
        .attr("class", "label")
        .attr("transform", "rotate(" + rotate_neg90_indegrees(angle(groups.indexOf(group))) + ")")
        .append("text")
        .attr("y", label_text_size + "px")
        .attr("transform", "translate(" + (radius.range()[1]*15/16) + " ," + -4 + ")")
        .style("text-anchor", "start")
        .attr("alignment-baseline", "hanging")
        .style("fill", color(group))
        .text(group);

      axes.push(axis);
    });
  });

  //---------------------------------------------------------------------------
  // links

  svgs.each(function(groups) {
    first_g = d3.select(this).select("g");

    first_g.selectAll(".link")
        .data(links)
      .enter()
        .filter(function (d) {
          return groups.includes(d.source.type) && groups.includes(d.target.type);
        })
        .append("path")
        .attr("class", "link")
        .attr("d", d3.hive.link()
                            .angle(function(d) { return angle(groups.indexOf(d.type)); })
                            .radius(function(d) { return radius(d.rank); }))
        .style("stroke", function(d) { return color(d.source.type); })
        .on("click", link_mouseclick)
        .on("mouseover", link_mouseover)
        .on("mouseout", mouseout);

    first_g.selectAll(".node")
        .data(nodes)
      .enter()
        .filter(function (d) {
          return groups.includes(d.type);
        })
        .append("circle")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + rotate_neg90_indegrees(angle(groups.indexOf(d.type))) + ")"; })
        .attr("cx", function(d) { return radius(d.rank); })
        .attr("r", circle_r)
        .style("fill", function(d) { return color(d.type); })
        .on("click", node_mouseclick)
        .on("mouseover", node_mouseover)
        .on("mouseout", mouseout);
  });
  //---------------------------------------------------------------------------

  svgs.nodes().forEach(function(node) {
    var width = node.clientWidth,
        height = node.clientHeight;

    svgs
      .attr("width", width) // fix the width an height of this svg element from now on
      .attr("height", height);
  });

  //--------------------------------------------------------------------------------------
  // Zoom/Pan
  var min_width = svgs.nodes().reduce((a,b) => Math.min(a, b.clientWidth), Number.MAX_VALUE),
      min_height = svgs.nodes().reduce((a,b) => Math.min(a, b.clientHeight), Number.MAX_VALUE),
      minScale = Math.min(min_width, min_height) / outerRadius / 2;

  var node_zoom_scale = zoom_scale(circle_r, 2.5),
      selected_line_zoom_scale = zoom_scale(selected_line_width, 2.0),
      active_line_zoom_scale = zoom_scale(active_line_width, 2.0),
      line_zoom_scale = zoom_scale(line_width, 0.25),
      axis_line_zoom_scale = zoom_scale(axis_width, 1.0),
      tick_line_zoom_scale = zoom_scale(circle_r, 2.5);

  var label_text_selector = svgs.selectAll(".label text"),
      tick_line_selector = svgs.selectAll(".tick line"),
      tick_text_selector = svgs.selectAll(".tick text");

  // the sizes of the elements are tweaked depending on the zoom -- so we need to tie the zooms of the panels together
  // TODO: independent translations/'pan' of each panel, but tied scale/'zoom'
  var zoom = d3.zoom()
    .scaleExtent([minScale, 4])
    .on("zoom", function() {
      this_svg = d3.select(this);
      svgs
        .filter(function(d){ return d3.select(this).attr('id') == this_svg.attr('id'); })
        .select('g')
        .attr('transform', d3.event.transform);

      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
        return;
      }

      var k = d3.event.transform.k;
      svgs
        .filter( function(d){ return d3.select(this).attr('id') !== this_svg.attr('id'); })
        .call(zoom.transform, d3.event.transform);
      //.call(zoom.scaleTo, k); -- alternative. but harder to correspond the two at high zoom levels

      // preserve label text size with zoom
      new_label_size = label_text_size / k + "px";
      setCSSStyle(".label text", "font-size", new_label_size);
      // adjust offset from axis also
      label_text_selector.attr("y", new_label_size);

      // preserve tick size and text size with zoom
      setCSSStyle(".tick text", "font-size", tick_text_size / k + "px");
      setCSSStyle(".tick", "stroke-width", axis_line_zoom_scale(k) + "px");
      tick_line_selector.attr("y2", tick_line_zoom_scale(k) + "px");
      // adjust offset from axis also
      tick_text_selector.attr("y", tick_line_zoom_scale(k) + "px");

      //scale (non-linearly) things so they are 1) individually visible when zoomed in 2) color-blurs when zoomed-out
      setCSSStyle(".node", "r", node_zoom_scale(k) + "px");
      setCSSStyle(".link.selected", "stroke-width", selected_line_zoom_scale(k) + "px");
      setCSSStyle(".link.active", "stroke-width", active_line_zoom_scale(k) + "px");
      setCSSStyle(".link", "stroke-width", line_zoom_scale(k) + "px");
      setCSSStyle(".axis", "stroke-width", axis_line_zoom_scale(k) + "px");
    });

  svgs
    .each(function(d) {
      single_svg = d3.select(this);
      zoom(single_svg);

      width = single_svg.node().clientWidth;
      height = single_svg.node().clientHeight;
      zoom.transform(single_svg, d3.zoomIdentity.translate(width/2, height/2 + 30).scale(minScale)); /* +30 gets the edge of the axis inside the svg box, not sure why */
    });

  //--------------------------------------------------------------------------------------
  // interactivity

  var formatNumber = d3.format(",d");
  var formatAddress = d3.format("#x");
  var info = d3.select("#info");
  var defaultInfo = "Above: groups " + groups + " making up " + formatNumber(nodes.length) + " total functions and " + formatNumber(links.length) + " calls (intra-group calls not shown)";
  info.text(defaultInfo);

  //TODO: tt format for node names
  //TODO: add floating labels at boarder of visible area on edges when they are selected or active
  function link_mouseover(l) {
    svgs.selectAll(".link").classed("active", function(p) { return p === l; });
    svgs.selectAll(".node").classed("active", function(p) { return p === l.source || p === l.target; });
    info.text(l.source.type + " " + l.source.name + " calls " + l.target.type + " " + l.target.name);
  }

  function node_mouseover(d) {
    svgs.selectAll(".link").classed("active", function(l) { return l.source === d || l.target === d; });
    svgs.selectAll(".node").classed("active", function(p) { return p === d; });
    info.text(d.type + " " + d.name + " @" + formatAddress(d.address));
  }

  function mouseout() {
    svgs.selectAll(".active").classed("active", false);
    info.text(defaultInfo);
  }

  function toggle_node_selection(d) {
    if (typeof d.selected === "undefined" || d.selected === false)
      d.selected = true;
    else
      d.selected = false;
  }

  function refresh_node_selected_classes() {
    svgs
      .selectAll(".node")
      .classed("selected", function(p) {
        return p.selected === true;
      });

    svgs
      .selectAll(".link")
      .classed("selected", function(p) {
        return p.source.selected === true || p.target.selected === true;
      });
  }

  function node_mouseclick(d) {
    toggle_node_selection(d);
    refresh_node_selected_classes();
   }

  function link_mouseclick(l) {
    l.source.selected = true;
    l.target.selected = true;
    refresh_node_selected_classes();
  }

//--------------------------------------------------------------------

  function rotate_neg90_indegrees(radians) {
    return radians / Math.PI * 180 - 90;
  }

  function zoom_scale(max_px, min_px = 1) {
    var zoom_threshold = min_px / max_px;
    return function(k) {
      if (k >= zoom_threshold)
        return max_px;
      else {
        return min_px / k;
      }
    }
  }

  function setCSSStyle(selector, style, value) {
    //NB: there must be a selector already specified in the CSS (hivestyle.css)

    //need to use 'for i=0...' -- forEach doesn't work
    for (var i=0, len=document.styleSheets[0].cssRules.length; i < len; i++) {
      rule = document.styleSheets[0].cssRules[i];
      if (rule.selectorText == selector) {
        rule.style[style]=value;
      }
    }
  }

}

