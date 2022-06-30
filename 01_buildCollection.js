var geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-74.5709458512665, 6.574549931544006],
          [-74.5709458512665, -34.16411135518068],
          [-33.6139146012665, -34.16411135518068],
          [-33.6139146012665, 6.574549931544006]]], null, false);
          
// DATASET

var lulc = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas_collection60_integration_v1');

var fire = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas-fire-collection1-annual-burned-coverage-1')
  .gte(1);  

var years = [ 
   1985, 1986,1987,1988,1989,1990,1991,1992,1993,1994,
   1995,1996,1997,1998,1999,
   2000,
   2001,
   2002,
   2003,2004,
   2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,
   2015,2016,2017,
   2018,
   2019,
   2020
  ];
  
var oldValues = [ 
  1, 3, 4, 5, 49,  10, 11,  12, 32,  29, 13,  14, 15,  18, 19,  39, 20,  40, 41,  36, 46,  47, 48,  9,  21, 22,  23, 24,  30, 25,  26, 33,  31, 27,
];

// natural = 0
// antropico = 1
// não aplica = 2

var newValues = [
  0, 0, 0, 0, 0,  0, 0,  0, 0,  0, 0,  1, 1,  1, 1,  1, 1,  1, 1,  1, 1,  1, 1,  1,  1, 1,  1, 1,  1, 1,  3, 3,  3, 3,
  
  ];

var palettes = require('users/mapbiomas/modules:Palettes.js');

var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

var recipe = ee.Image().select();

/*
  0 - 0 = 0 -> n - n
  0 - 1 = -1 -> n - a
  1 - 0 = 1 ->  a - n
  1 - 1 = 0 -> a - a

  0 - 3 = -3 -> n - na
  3 - 0 = 3 -> na - n
  1 - 3 = -2 -> a - na
  3 - 1 = 2 -> na - a
  
  3 - 3 = 0 -> na - na
  */

years.forEach(function(year){
  
  var yearPost = year +1;
  
  var lulc_year = lulc.select('classification_'+year)
    .aside(Map.addLayer,vis,'lulc ' + year)
    .remap(oldValues,newValues);
  
  var lulc_yearPost = lulc.select('classification_'+yearPost)
    .aside(Map.addLayer,vis,'lulc ' + yearPost)
    .remap(oldValues,newValues);
  
  var transition_year = lulc_year.subtract(lulc_yearPost);
  
  var natural_to_atropic = transition_year.eq(-1);
  
  var fire_transition = fire.updateMask(natural_to_atropic.eq(1));

  var year_actual = fire_transition.select('burned_coverage_'+yearPost);

  var list_years_prev = ee.List.sequence(1985,yearPost-1,1);
  
  var years_prev = list_years_prev
    .iterate(function(current,previous){
      current = ee.Number(current).int();
      var fire_year = fire_transition
        .select(ee.String('burned_coverage_').cat(current))
        .multiply(current);
      
      return ee.Image(previous)
        .addBands(fire_year);
        
    },ee.Image().select());
  
  years_prev = ee.Image(years_prev);
  
  var year_prev_max = years_prev.reduce('max');

  var year_prev_sum =  list_years_prev
    .iterate(function(current,previous){
      var band = ee.String('burned_coverage_').cat(ee.Number(current).int());
      var img = fire_transition
        .select(band);
      return ee.Image(previous)
        .addBands(img);
    },
    ee.Image().select());
  
  year_prev_sum = ee.Image(year_prev_sum);
  
  var year_prev_freq = year_prev_sum.reduce('sum').divide((yearPost-1)-1985);

  // Map.addLayer(year_prev_max,{},'year_prev_max');
  // Map.addLayer(year_prev_freq,{},'year_prev_freq');


  var list_years_post = ee.List.sequence(yearPost+1,2020,1);

  var years_post = list_years_post
     .iterate(function(current,previous){
      current = ee.Number(current).int();
      var fire_year = fire_transition
        .select(ee.String('burned_coverage_').cat(current))
        .multiply(current);
      
      return ee.Image(previous)
        .addBands(fire_year);
        
    },ee.Image().select());
  
  years_post = ee.Image(years_post);

  var year_post_max = years_post.reduce('min');

  var year_post_sum =  list_years_post
    .iterate(function(current,previous){
      var band = ee.String('burned_coverage_').cat(ee.Number(current).int());
      var img = fire_transition
        .select(band);
      return ee.Image(previous)
        .addBands(img);
    },ee.Image().select());
    
    
  year_post_sum = ee.Image(year_post_sum);
  // print('year_post_sum',year_post_sum)
  var year_post_freq = year_post_sum.reduce('sum').divide(2020 - (yearPost+1));

  // Map.addLayer(year_post_max,{},'year_post_max');
  // Map.addLayer(year_post_freq,{},'year_post_freq');
  
  // Map.addLayer(lulc_year.randomVisualizer(),{},'lulc '+year)
  // Map.addLayer(lulc_yearPost.randomVisualizer(),{},'lulc '+lulc_yearPost)
  // Map.addLayer(transition_year.randomVisualizer(),{},'transition ' +year);
  // Map.addLayer(natural_to_atropic.randomVisualizer(),{},'natural_to_atropic ' +year);
  // Map.addLayer(fire_transition,{},'fire  ');
  
  
  var output = 'projects/mapbiomas-workspace/FOGO/MODELAGEM/fire-and-transition-antropic-to-natural-v1/';
  
  var image = year_prev_max.rename('fire_prev')
    .addBands(year_prev_freq.rename('freq_prev'))
    .addBands(year_post_max.rename('fire_post'))
    .addBands(year_post_freq.rename('freq_post'))
    .addBands(year_actual.rename('fire_year'))
    .set({
      'transição':yearPost,
      'comparação':year,
      'system:time_start':ee.Date(''+year+'-01-01').millis(),
      'system:time_end':ee.Date(''+(year+1)+'-01-01').millis()
    });
  
  var description = '' + yearPost;
  
  Export.image.toAsset({
    image:image,
      description:'fire-and-transition-antropic-to-natural-v1-'+description,
    assetId:output + description,
    pyramidingPolicy:'mode',
    // dimensions:,
    region:geometry,
    scale:30,
    // crs:,
    // crsTransform:,
    maxPixels:1e11,
    // shardSize:
  });
});
