(function(def) {
    /*
        EXAMPLE:
            CanvasGraph([
                { nodeLabel:'FancyLabel', nodeId:'A', children: [ { property: ':b', propertyLabel:':bFancy', nodeId: 'B', children: [ { property: ':d', target: 'D' }, { property: ':e', nodeId: 'E' }, ] }, { property: ':c', nodeId: 'C' } ] },
                { nodeId:'Y2', children: [ { property: ':c', nodeId: 'C', children:[{property:':cz',target:'D1'}] } ] },
                { nodeId:'D', },
                { nodeId:'Z', children: [ { property: ':b', nodeId: 'B', children: [ { property: ':d', target: 'D' }, ] }, { property: ':z', target: 'A' }, ] },
                { nodeId:'Y1', children: [ { property: ':c', nodeId: 'C' } ] },
                { nodeId:'A1', children: [ { property: ':b', nodeId: 'B', children: [ { property: ':d', target: 'D' }, { property: ':e', nodeId: 'E' }, ] }, { property: ':c', nodeId: 'C' } ] },
                { nodeId:'D1'},
            ], document.body);
    */
    def(function CanvasGraph(roots, container) {
        var canvasGraphEl = document.createElement('div');
        canvasGraphEl.className = 'CanvasGraph';
        var nodesEl = document.createElement('div');
        nodesEl.className = 'CanvasGraph-nodes-container';
        canvasGraphEl.appendChild(nodesEl);
        var edgesEl = document.createElement('div');
        edgesEl.className = 'CanvasGraph-edges-container';
        canvasGraphEl.appendChild(edgesEl);
        container.appendChild(canvasGraphEl);

        var targetLookup, sourceEls;

        var renderNodes = (function() {
            return function() {
                function rest(list) {
                    return Array.prototype.slice.call(list, 1);
                }
                function div(spec /*, .. rest .. */) {
                    if (typeof spec === 'string') {
                        return '<div class="'+spec+'">' + rest(arguments).join('') + '</div>';
                    } else {
                        return '<div data-CanvasGraph-node-id="'+spec.nodeId+'" data-CanvasGraph-target="'+(spec.target||'')+'" class="'+spec.className+'">' + rest(arguments).join('') + '</div>';
                    }
                }
                function safe(s) {
                    if (!s) return '';
                    return s.replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;');
                }
                function renderNode(node) {
                    if (node.property) {
                        var propertyValue = '';
                        if (node.nodeId) {
                            propertyValue = div('CanvasGraph-property-value',
                                                div({className:'CanvasGraph-node', nodeId:node.nodeId},
                                                    div('CanvasGraph-node-header',
                                                        div('CanvasGraph-node-label', safe(node.nodeLabel || node.nodeId))),
                                                    node.children ? node.children.map(renderNode).join('') : ''));
                        }
                        return div('CanvasGraph-property',
                                   div('CanvasGraph-property-header', div({className:'CanvasGraph-property-label', nodeId:node.property, target:node.target}, safe(node.propertyLabel || node.property))),
                                   propertyValue);
                    } else {
                        return div({className:'CanvasGraph-node',nodeId:node.nodeId},
                                   div('CanvasGraph-node-header',
                                       div('CanvasGraph-node-label', safe(node.nodeLabel || node.nodeId))),
                                   node.children ? node.children.map(renderNode).join('') : '');
                    }
                }
                function indexTargets() {
                    var sources = nodesEl.querySelectorAll('[data-CanvasGraph-target]')
                    sourceEls = [];
                    targetLookup = {};
                    var to;
                    for (var i=0, n=sources.length; i < n; i++) {
                        to = sources[i].getAttribute('data-CanvasGraph-target')
                        if (to) {
                            sourceEls.push(sources[i]);
                            targetLookup[to] = nodesEl.querySelector('[data-CanvasGraph-node-id="'+to+'"]')
                        }
                    }
                }
                var finalHtml = roots.map(renderNode).join('');
                finalHtml += div('CanvasGraph-clear-float');
                nodesEl.innerHTML = finalHtml;
                indexTargets()
            };
        })();
        var renderEdges = (function() {
            function getPos(el) {
                var x = 0;
                var y = 0;
                for (; el && el != nodesEl; el = el.offsetParent) {
                    x += el.offsetLeft
                    y += el.offsetTop
                }
                x -= canvasGraphEl.scrollLeft
                y -= canvasGraphEl.scrollTop
                return {
                    x:x,
                    y:y
                }
            }
            function sq(x) { return x*x }
            function distance(pA, pB) {
                return Math.sqrt(sq(pB.x-pA.x) + sq(pB.y-pA.y));
            }
            function drawEdge(pA,pB, gfx) {
                var x1 = pA.x - 30;
                var y1 = (pA.y <= pB.y) ? pA.y + 100 : pA.y - 50;
                var x2 = (pA.x <= pB.x) ? pB.x - 30 : pB.x + 30;
                var y2 = (pA.y <= pB.y) ? pB.y - 100 : pB.y + 50;
                var x3 = pB.x;
                var y3 = pB.y - 40;

                gfx.beginPath();
                    gfx.moveTo(pA.x-2, pA.y);
                    gfx.lineTo(x1, pA.y);
                    if (distance(pA,pB) > 400) {
                        gfx.bezierCurveTo(x1,y1, x2,y2, x2,y3);
                    } else {
                        gfx.lineTo(x2,y3);
                    }
                    gfx.lineTo(x3, y3);
                    gfx.lineTo(pB.x, pB.y-4);

                    gfx.strokeStyle = 'white';
                    gfx.lineWidth = 6;
                    gfx.lineJoin = 'round';
                    gfx.stroke();

                    gfx.strokeStyle = 'hsl(200,80%,50%)';
                    gfx.lineWidth = 2;
                    gfx.stroke();
                gfx.closePath();

                // Arrow
                var r = 16;
                gfx.beginPath();
                    gfx.moveTo(pB.x-r-4, pB.y-r-2);
                    gfx.lineTo(pB.x+r+4, pB.y-r-2);
                    gfx.lineTo(pB.x+4, pB.y);
                    gfx.lineTo(pB.x-4, pB.y);

                    gfx.fillStyle = 'white';
                    gfx.fill();
                gfx.closePath();
                gfx.beginPath();
                    gfx.moveTo(pB.x-r, pB.y-r);
                    gfx.lineTo(pB.x+r, pB.y-r);
                    gfx.lineTo(pB.x, pB.y-2);

                    gfx.fillStyle = 'hsl(170,90%,40%)';
                    gfx.fill();
                gfx.closePath();
            }
            function renderNow() {
                var canvasEl = document.createElement('canvas');
                canvasEl.width = canvasGraphEl.clientWidth;
                canvasEl.height = canvasGraphEl.clientHeight;
                edgesEl.style.top = canvasGraphEl.scrollTop + 'px';
                edgesEl.style.left = canvasGraphEl.scrollLeft + 'px';
                var gfx = canvasEl.getContext('2d');
                gfx.clearRect(0,0, canvasEl.width, canvasEl.height);
                sourceEls.forEach(function(sourceEl) {
                    var target = sourceEl.getAttribute('data-CanvasGraph-target');
                    var targetEl = targetLookup[target];
                    var a = getPos(sourceEl);
                    var b = getPos(targetEl);
                    a.y += sourceEl.clientHeight/2;
                    b.x += 8;
                    drawEdge(a,b, gfx);
                });
                edgesEl.style.backgroundImage = 'url('+canvasEl.toDataURL('image/png')+')';
            }

            var renderTimer;
            return function() {
                clearTimeout(renderTimer);
                renderTimer = setTimeout(renderNow, 300);
            };
        })();
        renderNodes();
        renderEdges();
        canvasGraphEl.addEventListener('scroll', renderEdges);
        window.addEventListener('resize', renderEdges);
        return {
            setRoots: function(newRoots) {
                canvasGraphEl.scrollTop = 0;
                canvasGraphEl.scrollLeft = 0;
                roots = newRoots;
                renderNodes();
                renderEdges();
            },
            redrawEdges: function() {
                renderEdges();
            },
            destroy: function() {
                canvasGraphEl.removeEventListener('scroll', renderEdges);
                window.removeEventListener('resize', renderEdges);
                container.removeChild(canvasGraphEl);
            }
        };
    });
})(typeof window.define === 'function' ? window.define : function(api) { window.CanvasGraph = api });
