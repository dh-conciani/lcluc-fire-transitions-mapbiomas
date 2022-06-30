var geometry = ee.FeatureCollection('users/dh-conciani/vectors/matopiba_lapig_cerrado');


Map.addLayer(geometry);

var address = 'projects/mapbiomas-workspace/FOGO/MODELAGEM/fire-and-transition-antropic-to-natural-v1';

var assets = ee.data.listAssets(address)
  .assets
  .slice(15,16);

assets.forEach(function(obj){
  var image = ee.Image(obj.id);

  var year = ee.Number.parse(obj.id.slice(-4)).add(1);
  print(year)
  var year_image = ee.Image(year)
    .rename('year');

  var newImage = image
    .select('fire_year').unmask(0)
    .addBands(image.select(['freq_prev','freq_post','fire_prev','fire_post']))
    .addBands(year_image);


  print(newImage);
  var sampleRegions = newImage.sampleRegions({
    collection:geometry,
    // properties:,
    scale:30,
    // projection:,
    tileScale:1,
    geometries:false
  }).select(['freq_prev','freq_post','fire_prev','fire_post','year','fire_year']);
  
  print(image,sampleRegions.filter(ee.Filter.neq('fire_year',1)).limit(10),sampleRegions.limit(10),sampleRegions.size());
  
  
  year.evaluate(function(y){
    var description = 'fire-and-transitions-v1-' + y;
    
    Export.table.toDrive({
      collection:sampleRegions,
      description:description,
      folder:'fire-and-transitions',
      fileNamePrefix:description,
      fileFormat: 'csv',
      // selectors:,
      // maxVertices:
    });

  });
});

print(assets);

// var col = ee.ImageCollection(address)
//   .filterDate(''+year+'-01-01',''+(year+1)+'-01-01');
