// @flow

"use strict";

const MBTilesSource = require('./mbtiles_source');
const Map = require('mapbox-gl/src/ui/map');
const util = require('mapbox-gl/src/util/util');
const window = require('mapbox-gl/src/util/window');

const readJSON = (url) => new Promise((resolve, reject) => {
    const xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onerror = (e) => reject(e);
    xhr.onload = () => {
        const isFile = xhr.responseURL.indexOf('file://') === 0;
        if (((xhr.status >= 200 && xhr.status < 300) || isFile) && xhr.response) {
            try {
                resolve(JSON.parse(xhr.response));
            } catch (err) {
                reject(err);
            }
        } else {
            reject(new Error(xhr.statusText, xhr.status));
        }
    };
    xhr.send();
    return xhr;
});

const dereferenceStyle = (options) => {
    if (typeof options.style === 'string' || options.style instanceof String) {
        return readJSON(options.style).then((style) => util.extend({}, options, {style: style}));
    } else {
        return options;
    }
};

const createEmptyMap = (options) => new Promise((resolve) => {
    const emptyMapOptions = util.extend({}, options, {
        style: {
            'version': 8,
            'name': 'Empty Style With Original Glyphs and Sprites',
            'sources': {},
            'glyphs': options.style.glyphs,
            'sprite': options.style.sprite,
            'layers': [
                {
                    'id': 'background',
                    'type': 'background',
                    'paint': {
                        'background-color': 'rgba(0,0,0,0)'
                    }
                }
            ]
        }
    });
    const map = new Map(emptyMapOptions);
    map.once('load', () => map.addSourceType('mbtiles', MBTilesSource, () => resolve(map)));
});

const loadSources = (style) => (map) => {
    Object.keys(style.sources).map((sourceName) => map.addSource(sourceName, style.sources[sourceName]));
    return map;
};

const loadLayers = (style) => (map) => {
    style.layers.map((layer) => map.addLayer(layer));
    return map;
};

const OfflineMap = (options) =>
    dereferenceStyle(options).then((newOptions) =>
        createEmptyMap(newOptions)
            .then(loadSources(newOptions.style))
            .then(loadLayers(newOptions.style))
    );

module.exports = OfflineMap;
