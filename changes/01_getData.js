// dhemerson.costa@ipam.org.br

// get fire frequency (col. 1) for the entire period (1985-2020)
var fire_freq = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas-fire-collection1-fire-frequency-1')
      .select('fire_frequency_1985_2020')
      .divide(100).int()
      .rename(['fire_freq']);

// get land cover and land use (col. 7) 
var collection = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
      .slice(0,36);    // remove 2021

// compute n changes
var n_changes = collection.reduce(ee.Reducer.countRuns()).subtract(1)
      .rename(['n_changes']);

// compute n classes
var n_classes = collection.reduce(ee.Reducer.countDistinctNonNull())
      .rename(['n_classes']);

// get mode land use and land cover
var mode = collection.reduce(ee.Reducer.mode())
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
var matopiba = ee.FeatureCollection('users/dh-conciani/vectors/matopiba_lapig_cerrado').aside(Map.addLayer)

// extract data 
var values = data.sample({
	region: matopiba,
	scale: 30,
	factor: 0.2,
	seed: 1,
	tileScale: 2,
	geometries: false,
});

//.sampleRegions({
//    collection: matopiba,
//    scale: 30,
//    tileScale: 5,
//    geometries: false
//  });

// export to drive
Export.table.toDrive({
  collection: values,
  description: 'fire-nChanges',
  folder: 'EXPORT',
  fileFormat: 'csv',
  });
