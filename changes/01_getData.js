// dhemerson.costa@ipam.org.br

// get fire frequency (col. 1) for the entire period (1985-2020)
var fire_freq = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas-fire-collection1-fire-frequency-1')
      .select('fire_frequency_1985_2020')
      .divide(100).int()
      .rename(['fire_freq'])
      .unmask(0);

// get land cover and land use (col. 7) 
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
      .slice(0,36);  // remove 2021

// create recipe to receive remaped data
var recipe = ee.Image([]);

// remao each year
ee.List.sequence({'start': 1985, 'end': 2020}).getInfo().forEach(function(year_i) {
  // get year i
  var classification_i = collection.select(['classification_' + year_i])
      //remap
      .remap([1, 3, 4, 5, 49,  10, 11,  12, 32,  29, 13,  14, 15,  18, 19,  39, 20,  40, 41,  36, 46,  47, 48,  9,  21, 22,  23, 24,  30, 25,  26, 33,  31, 27],
             [1, 3, 4, 3,  3,   4, 11,  12, 12,  12, 12,  18, 15,  18, 18,  18, 18,  18, 18,  18, 18,  18, 18, 18,  18, 25,  25, 25,  25, 25,  33, 33,  33, 27])
      .rename('classification_' + year_i);
  // add into recipe
  recipe = recipe.addBands(classification_i);
});

// compute n changes
var n_changes = recipe.reduce(ee.Reducer.countRuns()).subtract(1)
      .rename(['n_changes']);

// compute n classes
var n_classes = recipe.reduce(ee.Reducer.countDistinctNonNull())
      .rename(['n_classes']);

// get mode land use and land cover
var mode = recipe.reduce(ee.Reducer.mode())
      .rename(['mode']);

// get pixel area (in hectares)
var pixel_area = ee.Image.pixelArea().divide(10000)
      .rename(['area_ha']);

// stack data
var data = fire_freq.addBands(
  n_changes).addBands(
    n_classes).addBands(
      mode).aside(print);

// plot
Map.addLayer(data, {}, 'data');

// read matopiba vector
var matopiba = ee.FeatureCollection('users/dh-conciani/vectors/matopiba_lapig_cerrado');

// extract data 
var values = data.sample({
	region: matopiba,
	scale: 30,
	numPixels: 1e6,
	seed:1,
	dropNulls:true,
	tileScale: 2,
	geometries:false,
});

// export to drive
Export.table.toDrive({
  collection: values,
  description: 'fire-nChanges_1kk',
  folder: 'EXPORT',
  fileFormat: 'csv',
  });
